import React from 'react';
import { Logo } from '../../components/Logo';

export function StartPage() {
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

export default StartPage;
