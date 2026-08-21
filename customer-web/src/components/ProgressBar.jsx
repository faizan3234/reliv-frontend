import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 'START', label: 'Scan' },
  { id: 'DETAILS', label: 'Details' },
  { id: 'SERVICE', label: 'Service' },
  { id: 'PAYMENT', label: 'Payment' },
  { id: 'COMPLETE', label: 'Done' }
];

export function ProgressBar({ currentState }) {
  const getStepIndex = (state) => {
    if (['START', 'CONNECTING', 'SESSION_VALID'].includes(state)) return 0;
    if (['DETAILS', 'CUSTOMER_DETAILS'].includes(state)) return 1;
    if (['SERVICE', 'SERVICE_SELECTION', 'CART'].includes(state)) return 2;
    if (['PAYMENT', 'PAYMENT_READY', 'PAYMENT_PROCESSING', 'PAYMENT_BRIDGE_VERIFYING', 'PAYMENT_HANDOFF'].includes(state)) return 3;
    if (['COMPLETED', 'DISPENSING', 'REPORT_GENERATING'].includes(state)) return 4;
    return 0;
  };

  const currentIndex = getStepIndex(currentState);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3">
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />
        
        {/* Active track line */}
        <div 
          className="absolute top-1/2 left-4 h-0.5 bg-orange-500 -translate-y-1/2 transition-all duration-500 -z-0"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isDone
                    ? 'bg-orange-500 text-white shadow-sm'
                    : isCurrent
                      ? 'bg-white text-orange-600 border-2 border-orange-500 ring-4 ring-orange-100'
                      : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium transition-colors ${
                isCurrent ? 'text-orange-600 font-semibold' : isDone ? 'text-slate-700' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
