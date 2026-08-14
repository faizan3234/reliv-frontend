import React, { useEffect } from 'react';
import { extractQueryParams, validateSessionParams } from '../../services/session';
import { Button } from '../../components/Button';
import { Smartphone, CheckCircle2, QrCode, ArrowRight, ShieldCheck } from 'lucide-react';

export function StartPage({ sessionStore }) {
  const { state, updateState } = sessionStore;

  useEffect(() => {
    // Extract query parameters from URL
    const { sessionId, pairingToken, kioskId } = extractQueryParams();

    if (sessionId && pairingToken) {
      const { valid, reason } = validateSessionParams({ sessionId, pairingToken });
      if (valid) {
        updateState({
          sessionId,
          pairingToken,
          kioskId,
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
    } else if (!state.sessionId) {
      // No URL parameters and no existing session in sessionStorage
      updateState({
        paymentState: 'ERROR',
        error: {
          title: 'No Active Kiosk Session',
          message: 'Please scan the QR code displayed on the Reliv Kiosk screen to begin your session.',
          code: 'NO_PARAMS',
        },
      });
    }
  }, []);

  const handleContinue = () => {
    updateState({ paymentState: 'CUSTOMER_DETAILS' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-2 glow-orange">
          <Smartphone className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white font-outfit">Welcome to Reliv Kiosk</h2>
        <p className="text-sm text-slate-400">Scan ONCE • Complete on Phone • Pay & Dispense</p>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Kiosk Connected</p>
            <p className="text-xs text-emerald-400/80">Kiosk ID: {state.kioskId || 'RELIV-001'}</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
            <span>Encrypted local session established</span>
          </div>
          <div className="flex items-center space-x-2">
            <QrCode className="w-4 h-4 text-orange-400 shrink-0" />
            <span>Single QR scan authorization active</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button onClick={handleContinue} icon={ArrowRight}>
          Continue to Details
        </Button>
        <p className="text-[11px] text-center text-slate-500">
          By continuing, your session remains securely bound to Kiosk {state.kioskId || 'RELIV-001'}
        </p>
      </div>
    </div>
  );
}
