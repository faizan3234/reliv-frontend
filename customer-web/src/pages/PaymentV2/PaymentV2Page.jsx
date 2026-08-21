import React, { useState, useEffect } from 'react';
import { createPaymentV2Order, verifyPaymentV2 } from '../../services/bridgeApi';
import { openRazorpayCheckout } from '../../services/razorpay';
import { extractPaymentPackage } from '../../services/session';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { CheckCircle2, Lock, AlertCircle, RefreshCw, Smartphone, KeyRound } from 'lucide-react';

export function PaymentV2Page({ sessionStore }) {
  const { state, updateState, resetSession } = sessionStore;
  
  // Extract encrypted package from state or directly from window.location.hash
  const encryptedPackage = state.encryptedPackage || extractPaymentPackage();

  const [loadingState, setLoadingState] = useState('INIT'); // 'INIT' | 'ORDER_READY' | 'PAYING' | 'VERIFYING' | 'SUCCESS' | 'ERROR'
  const [orderData, setOrderData] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. When encryptedPackage is present, automatically create Razorpay Order on Oracle Payment Bridge
  useEffect(() => {
    let isMounted = true;

    async function initPaymentV2() {
      if (!encryptedPackage) {
        setLoadingState('IDLE');
        return;
      }

      setLoadingState('INIT');
      setErrorMessage('');

      try {
        const order = await createPaymentV2Order({ encryptedPackage });
        if (isMounted) {
          setOrderData(order);
          setLoadingState('ORDER_READY');
        }
      } catch (err) {
        if (isMounted) {
          console.error('[PaymentV2] Order creation failed:', err);
          setErrorMessage(err.message || 'Unable to prepare payment. The payment QR may be expired or already used.');
          setLoadingState('ERROR');
        }
      }
    }

    initPaymentV2();

    return () => {
      isMounted = false;
    };
  }, [encryptedPackage]);

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
          setLoadingState('VERIFYING');
          try {
            const verifyRes = await verifyPaymentV2({
              requestId: orderData.requestId,
              razorpay_payment_id: paymentResult.razorpay_payment_id,
              razorpay_order_id: paymentResult.razorpay_order_id,
              razorpay_signature: paymentResult.razorpay_signature,
            });

            const code = String(verifyRes.confirmationCode || '').trim();
            if (code) {
              setConfirmationCode(code);
              setLoadingState('SUCCESS');
            } else {
              throw new Error('Confirmation code was not returned by the payment service.');
            }
          } catch (verifyErr) {
            console.error('[PaymentV2] Verification error:', verifyErr);
            setErrorMessage(verifyErr.message || 'Payment verification could not be completed.');
            setLoadingState('ERROR');
          }
        },
        onDismiss: () => {
          setLoadingState('ORDER_READY');
        },
        onError: (err) => {
          console.error('[PaymentV2] Razorpay error:', err);
          setErrorMessage(err.description || err.message || 'Payment was declined or cancelled.');
          setLoadingState('ERROR');
        },
      });
    } catch (checkoutErr) {
      console.error('[PaymentV2] Checkout modal error:', checkoutErr);
      setErrorMessage(checkoutErr.message || 'Could not open payment checkout modal.');
      setLoadingState('ERROR');
    }
  };

  const handleRetry = () => {
    if (encryptedPackage) {
      setLoadingState('INIT');
      createPaymentV2Order({ encryptedPackage })
        .then((order) => {
          setOrderData(order);
          setLoadingState('ORDER_READY');
        })
        .catch((err) => {
          setErrorMessage(err.message || 'Payment creation failed.');
          setLoadingState('ERROR');
        });
    } else {
      window.location.reload();
    }
  };

  const handleDone = () => {
    resetSession();
    window.location.href = window.location.origin + window.location.pathname;
  };

  // Helper for human-readable amount in Rupees
  const displayRupees = orderData ? (orderData.amount / 100).toFixed(0) : '0';
  const displayService = orderData?.serviceType === 'MEDICINE' ? 'Medicine Kit Purchase' : 'Health Checkup';

  // IDLE STATE (Direct open without #p)
  if (!encryptedPackage || loadingState === 'IDLE') {
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
            {errorMessage || 'Unable to complete payment request. Please return to the kiosk and scan a new QR code.'}
          </p>
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
          <p className="text-sm text-slate-600">
            Enter this 4-digit code on the kiosk screen:
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
              Type these 4 digits on the kiosk touch screen.
            </p>
            <p className="text-slate-600">
              Your service will begin immediately upon verification.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Amount Paid</span>
            <span className="font-bold text-slate-900 text-sm">₹{displayRupees}</span>
          </div>
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
