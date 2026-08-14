import React from 'react';
import { ShieldCheck, HelpCircle } from 'lucide-react';

export function Header({ kioskId = 'RELIV-001' }) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-bold text-white shadow-md shadow-orange-500/20">
            R
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white font-outfit">
              RELIV <span className="text-orange-500 font-light">HEALTH</span>
            </span>
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Secure Kiosk Handoff</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 font-medium flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{kioskId}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
