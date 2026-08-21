import React from 'react';
import { Button } from '../../components/Button';
import { AlertCircle, RefreshCw, QrCode, ShieldAlert } from 'lucide-react';

export function getFriendlyErrorMessage(error) {
  const message = String(
    error?.message || error?.title || error || ''
  ).toLowerCase();

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout')
  ) {
    return {
      title: 'Connection problem',
      message:
        'We could not reach the payment service. Check your mobile Internet and try again.',
    };
  }

  if (
    message.includes('expired') ||
    message.includes('invalid') ||
    message.includes('session')
  ) {
    return {
      title: 'Session expired',
      message:
        'This payment session is no longer active. Please return to the Reliv kiosk.',
    };
  }

  if (
    message.includes('payment') ||
    message.includes('declined') ||
    message.includes('verify')
  ) {
    return {
      title: 'Payment could not be confirmed',
      message:
        'Please check your payment status and try again.',
    };
  }

  return {
    title: 'Something went wrong',
    message:
      'Please try again. If the problem continues, return to the Reliv kiosk.',
  };
}

export function ErrorPage({ sessionStore }) {
  const { state, updateState, resetSession } = sessionStore;
  const rawError = state.error || {};
  const friendly = getFriendlyErrorMessage(rawError);

  const handleRetryPayment = () => {
    updateState({
      paymentState: 'PAYMENT_READY',
      error: null,
    });
  };

  const handleRestart = () => {
    resetSession();
    window.location.reload();
  };

  const isPaymentError = ['PAYMENT_FAILED', 'PAYMENT_VERIFICATION_FAILED', 'RAZORPAY_ERROR'].includes(state.paymentState) || rawError.code?.includes('PAYMENT');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-600 mb-1 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-outfit">{friendly.title}</h2>
      </div>

      <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed text-center">
          {friendly.message}
        </p>

        {isPaymentError && (
          <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-slate-700 text-xs flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <span>
              If money was deducted from your account, your payment is safe. Please return to the kiosk for automatic verification.
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {isPaymentError ? (
          <>
            <Button onClick={handleRetryPayment} icon={RefreshCw}>
              Try Again
            </Button>
            <Button onClick={handleRestart} variant="secondary" icon={QrCode}>
              Scan Kiosk QR Again
            </Button>
          </>
        ) : (
          <Button onClick={handleRestart} icon={QrCode}>
            Scan Kiosk QR Again
          </Button>
        )}
      </div>
    </div>
  );
}
