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
        <h2 className="text-2xl font-bold text-slate-900 font-outfit">What do you need?</h2>
        <p className="text-sm text-slate-600">Select your service at the kiosk</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Health Checkup Card */}
        <button
          onClick={() => handleSelectService('HEALTH_CHECKUP')}
          className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md text-left group flex items-start justify-between relative overflow-hidden"
        >
          <div className="space-y-2 max-w-[80%]">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-outfit flex items-center space-x-2">
                <span>Health Checkup</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">Popular</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Vitals, BMI, body composition and comprehensive health report.
              </p>
            </div>
          </div>
          <div className="self-center p-2.5 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>

        {/* Medicine / Kit Purchase Card */}
        <button
          onClick={() => handleSelectService('MEDICINE')}
          className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md text-left group flex items-start justify-between relative overflow-hidden"
        >
          <div className="space-y-2 max-w-[80%]">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-outfit">Medicine & Kit Purchase</h3>
              <p className="text-xs text-slate-600 mt-1">
                Select medical kits for automated dispensing at the kiosk.
              </p>
            </div>
          </div>
          <div className="self-center p-2.5 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100 text-xs text-slate-600 space-y-1">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Transparent Pricing</span>
        </div>
        <p>Final item price is calculated authoritatively by the kiosk inventory system.</p>
      </div>
    </div>
  );
}
