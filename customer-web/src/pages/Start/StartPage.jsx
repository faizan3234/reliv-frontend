import React, { useEffect } from 'react';
import { extractQueryParams, validateSessionParams } from '../../services/session';
import { Button } from '../../components/Button';
import { CheckCircle2, QrCode, ArrowRight, ShieldCheck, Smartphone } from 'lucide-react';

export function StartPage({ sessionStore }) {
  const { state, updateState } = sessionStore;
  const hasValidSession = Boolean(state.sessionId);

  useEffect(() => {
    // Extract query parameters from URL
    const { sessionId, pairingToken, kioskId } = extractQueryParams();

    if (sessionId && pairingToken) {
      const { valid, reason } = validateSessionParams({ sessionId, pairingToken });
      if (valid) {
        updateState({
          sessionId,
          pairingToken,
          kioskId: kioskId || '',
          paymentState: 'START',
          error: null,
        });
      } else {
        updateState({
          paymentState: 'ERROR',
          error: {
            title: 'Invalid Kiosk Session',
            message: 'This kiosk QR link appears invalid or expired. Please scan the QR code displayed on the kiosk screen again.',
            code: reason,
          },
        });
      }
    }
  }, []);

  const handleContinue = () => {
    updateState({ paymentState: 'CUSTOMER_DETAILS' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-orange-100 border border-orange-200 text-orange-600 mb-2 shadow-sm">
          {hasValidSession ? <Smartphone className="w-8 h-8" /> : <QrCode className="w-8 h-8" />}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-outfit">
          Reliv Health
        </h2>
        <p className="text-sm text-slate-600">
          {hasValidSession ? 'Your health and payment session is ready' : 'Secure Payment Companion'}
        </p>
      </div>

      <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm space-y-4">
        {hasValidSession ? (
          <>
            <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Secure kiosk session</p>
                <p className="text-xs text-emerald-700">Your health and payment session is connected.</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-1">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Encrypted session active</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-2 space-y-2.5">
            <h3 className="text-base font-semibold text-slate-900">No active payment session</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Scan the payment QR displayed on a Reliv kiosk to continue.
            </p>
          </div>
        )}
      </div>

      {hasValidSession && (
        <div className="space-y-3">
          <Button onClick={handleContinue} icon={ArrowRight}>
            Continue
          </Button>
          <p className="text-[11px] text-center text-slate-400">
            Secure connection to Reliv Health System
          </p>
        </div>
      )}
    </div>
  );
}
