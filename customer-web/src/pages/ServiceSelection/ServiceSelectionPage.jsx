import React from 'react';
import { Stethoscope, Pill, ChevronRight, ShieldCheck } from 'lucide-react';

export function ServiceSelectionPage({ sessionStore }) {
  const { updateState } = sessionStore;

  const handleSelectService = (serviceType) => {
    updateState({ serviceType });
    if (serviceType === 'MEDICINE') {
      updateState({ paymentState: 'CART' });
    } else {
      updateState({ paymentState: 'PAYMENT_READY' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-white font-outfit">What do you need?</h2>
        <p className="text-sm text-slate-400">Select your service at Kiosk</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Health Checkup Card */}
        <button
          onClick={() => handleSelectService('HEALTH_CHECKUP')}
          className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-orange-500/50 hover:bg-slate-900/80 transition-all text-left group flex items-start justify-between relative overflow-hidden"
        >
          <div className="space-y-2 max-w-[80%]">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-outfit flex items-center space-x-2">
                <span>Health Checkup</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">Popular</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Vitals, BMI, Body Composition & 7-day health graph report queued to your email.
              </p>
            </div>
          </div>
          <div className="self-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-orange-400 group-hover:border-orange-500/30 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* Medicine / Kit Purchase Card */}
        <button
          onClick={() => handleSelectService('MEDICINE')}
          className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all text-left group flex items-start justify-between relative overflow-hidden"
        >
          <div className="space-y-2 max-w-[80%]">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-outfit">Medicine & Kit Purchase</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select medical kits for instant automated dispensing at Kiosk.
              </p>
            </div>
          </div>
          <div className="self-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Authoritative Pricing Disclaimer</span>
        </div>
        <p>Final item price is calculated authoritatively by Kiosk backend inventory during transaction creation.</p>
      </div>
    </div>
  );
}
