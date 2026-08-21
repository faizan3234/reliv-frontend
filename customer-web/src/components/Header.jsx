import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

export function Header({ kioskId }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-orange-100 px-4 py-3 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Logo className="h-7 w-auto" />
          <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-medium pl-1 border-l border-slate-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Secure Health</span>
          </div>
        </div>

        {Boolean(kioskId) && (
          <div className="flex items-center space-x-2">
            <div className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[11px] font-mono text-orange-700 font-medium flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{kioskId}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
