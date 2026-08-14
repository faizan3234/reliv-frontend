import React from 'react';
import { Button } from '../../components/Button';
import { AlertOctagon, RefreshCw, QrCode, ShieldAlert, ArrowLeft } from 'lucide-react';

export function ErrorPage({ sessionStore }) {
  const { state, updateState, resetSession } = sessionStore;
  const error = state.error || {
    title: 'An Unexpected Error Occurred',
    message: 'Please try scanning the QR code on the kiosk again.',
    code: 'UNKNOWN_ERROR',
  };

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

  const isPaymentError = ['PAYMENT_FAILED', 'PAYMENT_VERIFICATION_FAILED', 'RAZORPAY_ERROR'].includes(state.paymentState) || error.code?.includes('PAYMENT');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 mb-1">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white font-outfit">{error.title}</h2>
        <p className="text-xs text-red-400 font-mono">Error Code: {error.code || 'ERR_GENERIC'}</p>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed text-center">
          {error.message}
        </p>

        {isPaymentError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              If money was deducted, do not make a second payment attempt. The kiosk will verify your transaction status automatically.
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {isPaymentError ? (
          <>
            <Button onClick={handleRetryPayment} icon={RefreshCw}>
              Retry Payment Attempt
            </Button>
            <Button onClick={handleRestart} variant="secondary" icon={QrCode}>
              Scan Kiosk QR Again
            </Button>
          </>
        ) : (
          <Button onClick={handleRestart} icon={QrCode}>
            Please Scan Kiosk QR Code Again
          </Button>
        )}
      </div>
    </div>
  );
}
