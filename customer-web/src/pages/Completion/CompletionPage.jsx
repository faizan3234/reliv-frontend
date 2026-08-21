import React from 'react';
import { Button } from '../../components/Button';
import { CheckCircle2, Pill, Stethoscope, Mail, ShieldCheck } from 'lucide-react';

export function CompletionPage({ sessionStore }) {
  const { state, resetSession } = sessionStore;
  const isMedicine = state.serviceType === 'MEDICINE';

  const handleFinish = () => {
    resetSession();
    window.location.href = window.location.origin + window.location.pathname;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 mb-1 shadow-sm">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-outfit">
          You're all set
        </h2>
        <p className="text-sm text-slate-600">
          Your Reliv session has been completed successfully.
        </p>
      </div>

      <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm space-y-4">
        {isMedicine ? (
          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 space-y-2 text-center">
            <Pill className="w-8 h-8 mx-auto text-orange-500" />
            <h4 className="font-bold text-base text-slate-900 font-outfit">
              Payment confirmed
            </h4>
            <p className="text-xs text-slate-600">
              Please return to the kiosk. Your medicine is being prepared.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 space-y-2 text-center">
            <Stethoscope className="w-8 h-8 mx-auto text-orange-500" />
            <h4 className="font-bold text-base text-slate-900 font-outfit">
              Payment confirmed
            </h4>
            <p className="text-xs text-slate-600">
              Your health report is being prepared.
            </p>
          </div>
        )}

        {/* Receipt & Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs text-slate-600">
          {state.transactionId && (
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Transaction ID</span>
              <span className="font-mono text-slate-800">
                {state.transactionId.slice(0, 16)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Amount Paid</span>
            <span className="font-bold text-slate-900 text-sm">
              {state.amount > 0 ? `₹${state.amount}` : 'Paid'}
            </span>
          </div>

          <div className="flex items-center space-x-2 pt-1 text-slate-600">
            <Mail className="w-4 h-4 text-orange-500 shrink-0" />
            <span>
              Report ready for:{' '}
              <strong className="text-slate-900">
                {state.customerDetails?.email || 'Registered user'}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Session securely completed.</span>
        </div>
      </div>

      <Button onClick={handleFinish} variant="primary">
        Done
      </Button>
    </div>
  );
}
