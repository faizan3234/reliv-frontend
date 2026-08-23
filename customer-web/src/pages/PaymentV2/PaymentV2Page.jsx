import React, { useState, useEffect, useCallback } from 'react';
import { createPaymentV2Order, verifyPaymentV2 } from '../../services/bridgeApi';
import { openRazorpayCheckout } from '../../services/razorpay';
import {
  extractPaymentPackage,
  savePendingVerification,
  getPendingVerification,
  clearPendingVerification,
} from '../../services/session';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { CheckCircle2, Lock, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';

export function PaymentV2Page({ sessionStore }) {
  const { state, updateState, resetSession } = sessionStore;

  // Extract encrypted package from state or directly from window.location.hash
  const encryptedPackage = state.encryptedPackage || extractPaymentPackage();

  const [loadingState, setLoadingState] = useState('INIT'); // 'INIT' | 'ORDER_READY' | 'PAYING' | 'VERIFYING' | 'SUCCESS' | 'ERROR'
  const [orderData, setOrderData] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Core verification execution function that uses a normalized payload
  const runVerification = useCallback(
    async (payload) => {
      setLoadingState('VERIFYING');
      setErrorMessage('');

      try {
        const verifyRes = await verifyPaymentV2({
          requestId: payload.requestId,
          orderId: payload.orderId,
          paymentId: payload.paymentId,
          signature: payload.signature,
        });

        const code = String(verifyRes.confirmationCode || '').trim();
        if (code) {
          // Success: Clear temporary recovery state only AFTER confirmation code is received
          clearPendingVerification();
          setConfirmationCode(code);
          updateState({ confirmationCode: code });
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

  // 1. Initialize: Check for pending recovery payment first, or create new order from encrypted package
  useEffect(() => {
    let isMounted = true;

    async function initPaymentV2() {
      // Check if there is an unverified payment from a previous attempt/reload
      const pending = getPendingVerification();
      if (pending) {
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

      if (!encryptedPackage) {
        if (isMounted) setLoadingState('IDLE');
        return;
      }

      if (isMounted) {
        setLoadingState('INIT');
        setErrorMessage('');
      }

      try {
        const order = await createPaymentV2Order({ encryptedPackage });
        if (isMounted) {
          setOrderData(order);
          setLoadingState('ORDER_READY');
        }
      } catch (err) {
        if (isMounted) {
          console.error('[PaymentV2] Order creation failed:', err.message || err);
          setErrorMessage(err.message || 'Unable to prepare payment. The payment QR may be expired or already used.');
          setLoadingState('ERROR');
        }
      }
    }

    initPaymentV2();

    return () => {
      isMounted = false;
    };
  }, [encryptedPackage, runVerification]);

  // 2. Open Razorpay Checkout on explicit button tap
  const handlePayClick = async () => {
    if (!orderData || loadingState === 'PAYING' || loadingState === 'VERIFYING') return;

    try {
      setLoadingState('PAYING');

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
            requestId: orderData.requestId || '',
            orderId: orderId.trim(),
            paymentId: paymentId.trim(),
            signature: signature.trim(),
            amount: orderData.amount,
            serviceType: orderData.serviceType,
          };

          // CRITICAL: Persist to sessionStorage BEFORE making Oracle verify HTTP request
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

  // 3. Try Again Handler: NEVER creates a duplicate payment if payment was already made
  const handleRetry = async () => {
    const pending = getPendingVerification();

    // If payment already succeeded at Razorpay, retry ONLY Oracle verification
    if (pending) {
      await runVerification(pending);
      return;
    }

    // Otherwise, retry order initialization from QR package
    if (encryptedPackage) {
      setLoadingState('INIT');
      setErrorMessage('');
      try {
        const order = await createPaymentV2Order({ encryptedPackage });
        setOrderData(order);
        setLoadingState('ORDER_READY');
      } catch (err) {
        setErrorMessage(err.message || 'Payment creation failed.');
        setLoadingState('ERROR');
      }
    } else {
      window.location.reload();
    }
  };

  const handleDone = () => {
    clearPendingVerification();
    resetSession();
    window.location.href = window.location.origin + window.location.pathname;
  };

  // Helper for human-readable amount in Rupees
  const displayRupees = orderData?.amount ? (orderData.amount / 100).toFixed(0) : '0';
  const displayService = orderData?.serviceType === 'MEDICINE' ? 'Medicine Kit Purchase' : 'Health Checkup';

  // IDLE STATE (Direct open without #p)
  if (!encryptedPackage && loadingState === 'IDLE' && !getPendingVerification()) {
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
          <h3 className="text-base font-semibold text-slate-900">Preparing your payment...</h3>
          <p className="text-xs text-slate-500">Connecting securely with payment gateway</p>
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

  // SUCCESS STATE — DISPLAY 4-DIGIT CONFIRMATION CODE
  if (loadingState === 'SUCCESS') {
    const digits = confirmationCode.split('');

    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
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

        <div className="rounded-3xl border border-orange-200 bg-white p-6 shadow-md space-y-5 text-center">
          {/* Large Digit Cards */}
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

        <Button onClick={handleDone} variant="primary">
          Done
        </Button>
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
      </div>
    </div>
  );
}

export default PaymentV2Page;
