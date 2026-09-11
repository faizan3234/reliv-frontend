import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  createPaymentV2Order,
  verifyPaymentV2,
  emailPaymentReceipt,
  emailHealthReport,
  downloadHealthReport,
  recoverPaymentV2,
} from '../../services/bridgeApi';
import { openRazorpayCheckout } from '../../services/razorpay';
import {
  extractPaymentPackage,
  savePendingVerification,
  getPendingVerification,
  clearPendingVerification,
  savePaymentRecovery,
  getPaymentRecovery,
  clearPaymentRecovery,
} from '../../services/session';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { CheckCircle2, Lock, AlertCircle, RefreshCw, Mail, ShieldCheck } from 'lucide-react';

export function PaymentV2Page({ sessionStore }) {
  const { state, updateState, resetSession } = sessionStore;

  // Extract encrypted package from state, URL hash, or persistent recovery storage
  const recoverySession = getPaymentRecovery();
  const encryptedPackage = state.encryptedPackage || extractPaymentPackage() || recoverySession?.encryptedPackage;

  const [loadingState, setLoadingState] = useState('INIT'); // 'INIT' | 'ORDER_READY' | 'PAYING' | 'VERIFYING' | 'SUCCESS' | 'ERROR' | 'IDLE'
  const [orderData, setOrderData] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState(''); // in-memory only; never stored in localStorage
  const [errorMessage, setErrorMessage] = useState('');
  const [activeRequestId, setActiveRequestId] = useState('');

  // Receipt state: 'idle' | 'sending' | 'sent' | 'already_sent' | 'error'
  const [receiptEmail, setReceiptEmail] = useState('');
  const [receiptStatus, setReceiptStatus] = useState('idle');
  const [receiptError, setReceiptError] = useState('');
  const [reportDownloadToken, setReportDownloadToken] = useState('');
  const [reportScanNumber, setReportScanNumber] = useState(1);
  const [reportTotalScans, setReportTotalScans] = useState(1);
  const [reportDownloadStatus, setReportDownloadStatus] = useState('idle');

  const isSyncingRef = useRef(false);

  // Core verification execution function that uses a normalized payload
  const runVerification = useCallback(
    async (payload) => {
      setLoadingState('VERIFYING');
      setErrorMessage('');

      try {
        if (payload.requestId) {
          setActiveRequestId(payload.requestId);
        }

        const verifyRes = await verifyPaymentV2({
          requestId: payload.requestId,
          orderId: payload.orderId,
          paymentId: payload.paymentId,
          signature: payload.signature,
        });

        const code = String(verifyRes.confirmationCode || '').trim();
        if (code) {
          if (verifyRes.requestId) {
            setActiveRequestId(verifyRes.requestId);
          }
          // Success: Clear temporary recovery state only AFTER confirmation code is received
          clearPendingVerification();
          clearPaymentRecovery();
          setConfirmationCode(code);
          setOrderData((prev) => ({
            ...(prev || {}),
            requestId: verifyRes.requestId || payload.requestId || prev?.requestId || '',
            serviceType: payload.serviceType || prev?.serviceType || 'HEALTH_CHECKUP',
          }));
          updateState({
            confirmationCode: code,
            requestId: verifyRes.requestId || payload.requestId || '',
          });
          setLoadingState('SUCCESS');
        } else {
          throw new Error('Confirmation code was not returned by the payment service.');
        }
      } catch (verifyErr) {
        console.error('[PaymentV2] Verification error:', verifyErr.message || verifyErr);
        // Do NOT clear pending verification here so user can retry without paying again
        setErrorMessage(verifyErr.message || 'Payment verification could not be completed.');
        setLoadingState('ERROR');
      }
    },
    [updateState]
  );

  // Authoritative State Sync with Oracle Payment Bridge
  const syncWithOracle = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      // 1. Check if there is an unverified callback from Razorpay in localStorage
      const pending = getPendingVerification();
      if (pending) {
        if (pending.requestId) {
          setActiveRequestId(pending.requestId);
        }
        if (pending.amount) {
          setOrderData((prev) => prev || {
            orderId: pending.orderId,
            amount: pending.amount,
            requestId: pending.requestId,
            serviceType: pending.serviceType,
          });
        }
        await runVerification(pending);
        return;
      }

      // 2. Check if we have an active requestId to attempt direct Oracle reconciliation
      const currentReqId = activeRequestId || getPaymentRecovery()?.requestId;
      if (currentReqId) {
        try {
          const recoverRes = await recoverPaymentV2({ requestId: currentReqId });
          if (recoverRes.paid && recoverRes.confirmationCode) {
            console.log(`[PaymentV2] Payment recovered and verified via Oracle: ${recoverRes.confirmationCode}`);
            setActiveRequestId(recoverRes.requestId || currentReqId);
            setOrderData((prev) => ({
              ...(prev || {}),
              requestId: recoverRes.requestId || currentReqId,
              orderId: recoverRes.orderId || prev?.orderId,
              amount: recoverRes.amount ?? prev?.amount,
              currency: recoverRes.currency || prev?.currency || 'INR',
              serviceType: recoverRes.serviceType || prev?.serviceType || 'HEALTH_CHECKUP',
            }));
            clearPendingVerification();
            clearPaymentRecovery();
            setConfirmationCode(recoverRes.confirmationCode);
            setLoadingState('SUCCESS');
            return;
          }
        } catch (recoverErr) {
          // If order not found or pending, proceed with normal package flow
          console.log('[PaymentV2] Direct recovery check non-fatal:', recoverErr.message);
        }
      }

      // 3. Check if we have an encrypted payment package to check / initialize
      const activePackage = encryptedPackage || extractPaymentPackage() || getPaymentRecovery()?.encryptedPackage;
      if (!activePackage) {
        setLoadingState('IDLE');
        return;
      }

      setLoadingState('INIT');
      setErrorMessage('');

      // Query Oracle for authoritative state (idempotent order check/creation)
      const order = await createPaymentV2Order({ encryptedPackage: activePackage });

      if (order.requestId) {
        setActiveRequestId(order.requestId);
      }
      setOrderData(order);

      // 4. If Oracle indicates this request is already PAID, NEVER launch Razorpay!
      if (order.paid === true || order.raw?.status === 'PAID') {
        console.log('[PaymentV2] Authoritative Oracle check: Order is already PAID');

        // Check if confirmation code is already returned
        const returnedCode = String(order.confirmationCode || order.raw?.confirmationCode || '').trim();
        if (returnedCode) {
          clearPendingVerification();
          clearPaymentRecovery();
          setConfirmationCode(returnedCode);
          setLoadingState('SUCCESS');
          return;
        }

        // Attempt recover-payment to decrypt code from Oracle
        if (order.requestId) {
          try {
            const recoverRes = await recoverPaymentV2({ requestId: order.requestId });
            if (recoverRes.confirmationCode) {
              clearPendingVerification();
              clearPaymentRecovery();
              setConfirmationCode(recoverRes.confirmationCode);
              setLoadingState('SUCCESS');
              return;
            }
          } catch (e) {
            console.warn('[PaymentV2] Code reveal via recover failed:', e.message);
          }
        }
      }

      // 5. Unpaid / Active Order Ready
      savePaymentRecovery({
        requestId: order.requestId,
        encryptedPackage: activePackage,
        orderId: order.orderId,
        amount: order.amount,
        serviceType: order.serviceType,
        currency: order.currency,
        keyId: order.keyId,
        paymentState: 'ORDER_READY',
      });

      setLoadingState('ORDER_READY');
    } catch (err) {
      console.error('[PaymentV2] Oracle sync error:', err.message || err);

      const isExpired =
        err.code === 'REQUEST_EXPIRED' ||
        String(err.message || '').toLowerCase().includes('expired');

      if (isExpired) {
        clearPaymentRecovery();
        clearPendingVerification();
        setErrorMessage('This payment request has expired. Please refresh the QR on the kiosk.');
      } else {
        setErrorMessage(err.message || 'Unable to prepare payment. Please check your connection or scan the kiosk QR again.');
      }
      setLoadingState('ERROR');
    } finally {
      isSyncingRef.current = false;
    }
  }, [encryptedPackage, runVerification, activeRequestId]);

  // Automatic Resume Triggers: visibilitychange, focus, pageshow, and app mount
  useEffect(() => {
    const handleResume = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      // Do not interrupt active success screen
      if (confirmationCode) return;
      syncWithOracle();
    };

    // Initial mount sync
    syncWithOracle();

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleResume);
      window.addEventListener('pageshow', handleResume);
      document.addEventListener('visibilitychange', handleResume);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleResume);
        window.removeEventListener('pageshow', handleResume);
        document.removeEventListener('visibilitychange', handleResume);
      }
    };
  }, [syncWithOracle, confirmationCode]);

  // Open Razorpay Checkout on explicit button tap
  const handlePayClick = async () => {
    if (!orderData || loadingState === 'PAYING' || loadingState === 'VERIFYING') return;

    // Safety: If already marked paid, do not open Razorpay
    if (orderData.paid === true) {
      syncWithOracle();
      return;
    }

    try {
      setLoadingState('PAYING');

      // Update recovery state to PAYING
      savePaymentRecovery({
        requestId: orderData.requestId,
        encryptedPackage,
        orderId: orderData.orderId,
        amount: orderData.amount,
        serviceType: orderData.serviceType,
        currency: orderData.currency,
        keyId: orderData.keyId,
        paymentState: 'PAYING',
      });

      await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        keyId: orderData.keyId,
        customerDetails: {},
        onSuccess: async (paymentResult) => {
          // Normalize at boundary
          const orderId = paymentResult?.orderId || paymentResult?.razorpay_order_id;
          const paymentId = paymentResult?.paymentId || paymentResult?.razorpay_payment_id;
          const signature = paymentResult?.signature || paymentResult?.razorpay_signature;

          // Strict validation
          if (
            typeof orderId !== 'string' || !orderId.trim() ||
            typeof paymentId !== 'string' || !paymentId.trim() ||
            typeof signature !== 'string' || !signature.trim()
          ) {
            console.error('[PaymentV2] Missing required callback fields');
            setErrorMessage('Payment callback data is incomplete. Missing orderId, paymentId, or signature.');
            setLoadingState('ERROR');
            return;
          }

          const normalizedPayload = {
            requestId: orderData.requestId || activeRequestId || '',
            orderId: orderId.trim(),
            paymentId: paymentId.trim(),
            signature: signature.trim(),
            amount: orderData.amount,
            serviceType: orderData.serviceType,
          };

          // CRITICAL: Persist to persistent localStorage BEFORE making Oracle verify HTTP request
          savePendingVerification(normalizedPayload);

          // Execute verification
          await runVerification(normalizedPayload);
        },
        onDismiss: () => {
          setLoadingState('ORDER_READY');
        },
        onError: (err) => {
          console.error('[PaymentV2] Razorpay error:', err.message || err.description || err);
          setErrorMessage(err.description || err.message || 'Payment was declined or cancelled.');
          setLoadingState('ERROR');
        },
      });
    } catch (checkoutErr) {
      console.error('[PaymentV2] Checkout modal error:', checkoutErr.message || checkoutErr);
      setErrorMessage(checkoutErr.message || 'Could not open payment checkout modal.');
      setLoadingState('ERROR');
    }
  };

  // Try Again Handler: NEVER creates a duplicate payment if payment was already made
  const handleRetry = async () => {
    const pending = getPendingVerification();

    // If payment already succeeded at Razorpay, retry ONLY Oracle verification
    if (pending) {
      await runVerification(pending);
      return;
    }

    // Otherwise, perform full authoritative sync with Oracle
    await syncWithOracle();
  };

  // Service-aware delivery:
  // HEALTH_CHECKUP -> mandatory health report + receipt email
  // MEDICINE       -> optional payment receipt email
  const handleEmailDelivery = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!receiptEmail || !receiptEmail.trim() || receiptStatus === 'sending') return;

    const emailToSend = receiptEmail.trim();
    if (!emailToSend.includes('@') || !emailToSend.includes('.')) {
      setReceiptError('Please enter a valid email address.');
      return;
    }

    const currentRequestId = activeRequestId || orderData?.requestId || state.requestId;
    if (!currentRequestId) {
      setReceiptError('Payment request ID is missing. Please reopen the payment QR.');
      return;
    }

    setReceiptStatus('sending');
    setReceiptError('');

    try {
      if (isHealthCheckup) {
        const result = await emailHealthReport({
          requestId: currentRequestId,
          email: emailToSend,
        });

        setReportDownloadToken(result.downloadToken || '');
        setReportScanNumber(result.scanNumber || 1);
        setReportTotalScans(result.totalScans || result.scanNumber || 1);
        setReceiptStatus(result.alreadySent ? 'already_sent' : 'sent');
      } else {
        const result = await emailPaymentReceipt({
          requestId: currentRequestId,
          email: emailToSend,
        });

        setReceiptStatus(result.alreadySent ? 'already_sent' : 'sent');
      }
    } catch (err) {
      console.error(
        isHealthCheckup
          ? '[PaymentV2] Health report email error:'
          : '[PaymentV2] Receipt email error:',
        err.message || err
      );
      setReceiptError(
        err.message ||
        (isHealthCheckup
          ? "We couldn't send your health report."
          : "We couldn't send your receipt.")
      );
      setReceiptStatus('error');
    }
  };

  const handleDownloadReport = async () => {
    if (!reportDownloadToken || reportDownloadStatus === 'downloading') return;

    const currentRequestId = activeRequestId || orderData?.requestId || state.requestId;
    if (!currentRequestId) return;

    setReportDownloadStatus('downloading');
    setReceiptError('');

    try {
      await downloadHealthReport({
        requestId: currentRequestId,
        token: reportDownloadToken,
        scanNumber: reportScanNumber,
      });
      setReportDownloadStatus('done');
    } catch (err) {
      setReceiptError(err.message || 'Could not download the health report.');
      setReportDownloadStatus('error');
    }
  };

  const handleDone = () => {
    clearPendingVerification();
    clearPaymentRecovery();
    resetSession();
    window.location.href = window.location.origin + window.location.pathname;
  };

  // Helper for human-readable amount in Rupees
  const displayRupees = orderData?.amount ? (orderData.amount / 100).toFixed(0) : '0';
  const normalizedServiceType = String(orderData?.serviceType || state.serviceType || 'HEALTH_CHECKUP')
    .trim()
    .toUpperCase();
  const isHealthCheckup =
    normalizedServiceType === 'HEALTH_CHECKUP' ||
    normalizedServiceType === 'CHECKUP';
  const displayService = isHealthCheckup ? 'Health Checkup' : 'Medicine Kit Purchase';

  // IDLE STATE (Direct open without #p or saved session)
  if (!encryptedPackage && loadingState === 'IDLE' && !getPendingVerification() && !getPaymentRecovery()) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="flex justify-center pb-1">
            <Logo className="h-11 w-auto" />
          </div>
          <p className="text-sm text-slate-600">
            Secure Payment Companion
          </p>
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm space-y-4">
          <div className="text-center py-2 space-y-2.5">
            <h3 className="text-base font-semibold text-slate-900">No active payment session</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Scan the payment QR displayed on a Reliv kiosk to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // LOADING / INITIALIZING ORDER
  if (loadingState === 'INIT') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="flex justify-center pb-1">
            <Logo className="h-11 w-auto" />
          </div>
          <p className="text-sm text-slate-600">
            Secure Payment Checkout
          </p>
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white p-8 shadow-sm space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-semibold text-slate-900">Checking payment status...</h3>
          <p className="text-xs text-slate-500">Connecting securely with Reliv payment bridge</p>
        </div>
      </div>
    );
  }

  // VERIFYING STATE
  if (loadingState === 'VERIFYING') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="flex justify-center pb-1">
            <Logo className="h-11 w-auto" />
          </div>
          <p className="text-sm text-slate-600">
            Payment Verification
          </p>
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white p-8 shadow-sm space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-semibold text-slate-900">Verifying payment...</h3>
          <p className="text-xs text-slate-500">Please do not close or refresh this page.</p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (loadingState === 'ERROR') {
    const hasPendingPayment = Boolean(getPendingVerification());

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-600 mb-1 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-outfit">Payment Problem</h2>
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed text-center">
            {errorMessage || 'Unable to complete payment verification. Please try again.'}
          </p>
          {hasPendingPayment && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-center">
              Your payment was received. Tap <strong>Try Again</strong> to re-verify without paying again.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button onClick={handleRetry} icon={RefreshCw}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // SUCCESS STATE — DISPLAY 4-DIGIT CONFIRMATION CODE + RECEIPT EMAIL FORM
  if (loadingState === 'SUCCESS') {
    const digits = confirmationCode.split('');

    return (
      <div className="space-y-5 animate-in fade-in zoom-in-95 duration-400">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 mb-1 shadow-sm">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-outfit">
            Payment Successful
          </h2>
          <p className="text-sm font-semibold text-slate-700">
            Your Kiosk Code
          </p>
        </div>

        {/* 4-Digit Kiosk Code Card */}
        <div className="rounded-3xl border border-orange-200 bg-white p-6 shadow-md space-y-5 text-center">
          <div className="flex justify-center items-center gap-3 py-2">
            {digits.map((digit, idx) => (
              <div
                key={idx}
                className="w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-orange-500 border-2 border-orange-600 text-white font-extrabold text-3xl sm:text-4xl flex items-center justify-center shadow-md font-mono"
              >
                {digit}
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-100 text-xs text-orange-950 space-y-1">
            <p className="font-semibold text-slate-900">
              Enter this 4-digit code on the Reliv kiosk.
            </p>
            <p className="text-slate-600">
              Your service will begin immediately upon verification.
            </p>
          </div>

          {displayRupees !== '0' && (
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Amount Paid</span>
              <span className="font-bold text-slate-900 text-sm">₹{displayRupees}</span>
            </div>
          )}
        </div>

        {/* Directly Underneath: Payment Receipt Section */}
        <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm space-y-3.5">
          <div className="text-center space-y-0.5">
            <h3 className="text-base font-bold text-slate-900 font-outfit">
              {isHealthCheckup ? 'Get your Health Report & Receipt' : 'Get your payment receipt'}
            </h3>
            <p className="text-xs text-slate-500">
              {isHealthCheckup
                ? 'Enter your email to receive your detailed health report and payment receipt.'
                : 'Enter your email to receive a digital receipt.'}
            </p>
          </div>

          {/* Idle / Sending / Error state: Email input form */}
          {(receiptStatus === 'idle' || receiptStatus === 'sending' || receiptStatus === 'error') && (
            <form onSubmit={handleEmailDelivery} className="space-y-3 pt-1">
              <div>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  required
                  disabled={receiptStatus === 'sending'}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition duration-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-50"
                />
              </div>

              {receiptError && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-0.5">
                  <p className="text-xs text-red-600 font-semibold">{receiptError}</p>
                  <p className="text-[11px] text-slate-500">Your payment is safe. Check your email and tap Retry.</p>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  type="submit"
                  loading={receiptStatus === 'sending'}
                  disabled={!receiptEmail.trim() || receiptStatus === 'sending'}
                  size="md"
                  icon={receiptStatus === 'error' ? RefreshCw : Mail}
                >
                  {receiptStatus === 'error'
                    ? 'Retry Sending'
                    : isHealthCheckup
                    ? 'Send My Health Report'
                    : 'Email My Receipt'}
                </Button>
                {!isHealthCheckup && (
                  <button
                    type="button"
                    onClick={handleDone}
                    className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition py-1.5"
                  >
                    Skip
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Sent successfully */}
          {receiptStatus === 'sent' && (
            <div className="space-y-3.5 text-center animate-in fade-in duration-300 pt-1">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-semibold text-emerald-800">
                  {isHealthCheckup ? 'Health report sent successfully!' : 'Receipt sent successfully!'}
                </p>
                <p className="text-emerald-700">
                  {isHealthCheckup ? (
                    <>
                      We've emailed Scan <strong>{reportScanNumber}</strong> of your health report to <strong>{receiptEmail}</strong>.
                      {' '}<span className="text-emerald-600">({reportTotalScans} scan{reportTotalScans === 1 ? '' : 's'} linked)</span>
                    </>
                  ) : (
                    <>We've emailed your payment receipt to <strong>{receiptEmail}</strong>.</>
                  )}
                </p>
              </div>

              <div className="space-y-2">

                {isHealthCheckup && reportDownloadToken && (

                  <Button

                    onClick={handleDownloadReport}

                    variant="primary"

                    size="md"

                    loading={reportDownloadStatus === 'downloading'}

                  >

                    Download Health Report

                  </Button>

                )}

                <Button onClick={handleDone} variant="primary" size="md">

                  Done

                </Button>

              </div>
            </div>
          )}

          {/* Already sent */}
          {receiptStatus === 'already_sent' && (
            <div className="space-y-3.5 text-center animate-in fade-in duration-300 pt-1">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-semibold text-amber-800">
                  {isHealthCheckup ? 'Health report already sent' : 'Receipt already sent'}
                </p>
                <p className="text-amber-700">
                  {isHealthCheckup ? (
                    <>This paid scan is already linked and the report was sent to <strong>{receiptEmail}</strong>.</>
                  ) : (
                    <>A receipt for this payment was already sent to <strong>{receiptEmail}</strong>.</>
                  )}
                </p>
              </div>

              <div className="space-y-2">

                {isHealthCheckup && reportDownloadToken && (

                  <Button

                    onClick={handleDownloadReport}

                    variant="primary"

                    size="md"

                    loading={reportDownloadStatus === 'downloading'}

                  >

                    Download Health Report

                  </Button>

                )}

                <Button onClick={handleDone} variant="primary" size="md">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ORDER READY TO PAY STATE
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 font-outfit">Secure Payment</h2>
        <p className="text-sm text-slate-600">Review and complete your payment</p>
      </div>

      <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm space-y-4">
        {/* Order Summary Box */}
        <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Service</span>
            <span className="font-semibold text-slate-900">{displayService}</span>
          </div>

          <div className="border-t border-orange-200/70 pt-3 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-base">Total Amount</span>
            <span className="text-2xl font-bold text-orange-600 font-outfit">
              ₹{displayRupees}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-500 text-center pt-1">
          <span>Your payment is securely processed through Razorpay.</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handlePayClick}
          loading={loadingState === 'PAYING'}
          size="lg"
        >
          Pay ₹{displayRupees}
        </Button>

        <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 pt-1">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure 256-bit encrypted payment • UPI, Cards & Netbanking</span>
        </div>

        {/* Customer Reassurance & Auto-Return / Rescan Recovery Notice */}
        <div className="rounded-2xl bg-orange-50/80 border border-orange-100 p-3.5 text-center space-y-1 mt-2">
          <p className="text-xs font-semibold text-slate-800">
            Complete payment in your UPI app. You'll automatically return here for your confirmation code.
          </p>
          <p className="text-[11px] text-slate-500 leading-normal">
            Didn't return? Reopen this page or scan the kiosk QR again. You won't be charged twice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentV2Page;
