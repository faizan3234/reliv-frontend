import React from 'react';
import { Button } from '../../components/Button';
import { CheckCircle2, Pill, Stethoscope, Mail, ShieldCheck, Download, RefreshCw } from 'lucide-react';

export function CompletionPage({ sessionStore }) {
  const { state, resetSession } = sessionStore;
  const isMedicine = state.serviceType === 'MEDICINE';

  const handleFinish = () => {
    resetSession();
    window.location.href = state.kioskId ? `#` : '/';
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 mb-1 glow-cyan animate-bounce">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-extrabold text-white font-outfit">Payment Successful ✓</h2>
        <p className="text-sm font-semibold text-emerald-400">Transaction Authorized by Kiosk</p>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        {isMedicine ? (
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 space-y-2 text-center">
            <Pill className="w-8 h-8 mx-auto text-cyan-400 animate-pulse" />
            <h4 className="font-bold text-base text-white font-outfit">Dispensing Your Order...</h4>
            <p className="text-xs text-cyan-200">
              Please collect your items from the kiosk dispensing tray below the screen.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 space-y-2 text-center">
            <Stethoscope className="w-8 h-8 mx-auto text-orange-400" />
            <h4 className="font-bold text-base text-white font-outfit">Preparing Your Health Report</h4>
            <p className="text-xs text-orange-200">
              Your comprehensive vitals, BMI, and 7-day health graph report PDF is being generated.
            </p>
          </div>
        )}

        {/* Receipt & Email Summary Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Transaction ID</span>
            <span className="font-mono text-slate-200">{state.transactionId?.slice(0, 16) || 'TXN-982103'}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Amount Paid</span>
            <span className="font-bold text-white text-sm">₹{state.amount}</span>
          </div>

          <div className="flex items-center space-x-2 pt-1 text-slate-300">
            <Mail className="w-4 h-4 text-orange-400 shrink-0" />
            <span>📧 Report/receipt queued for: <strong className="text-white">{state.customerDetails?.email || 'customer@example.com'}</strong></span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Session securely completed. Single QR authorization fulfilled.</span>
        </div>
      </div>

      <Button onClick={handleFinish} variant="secondary" icon={RefreshCw}>
        Done / Start New Session
      </Button>
    </div>
  );
}
