'use client';

import clsx from 'clsx';
import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Company & Tax Info' },
  { label: 'Contacts & Remittance' },
  { label: 'ACH Authorization' },
  { label: 'Review & Sign' },
];

export default function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Form progress" className="w-full">
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const stepNum = index + 1;
          const isComplete = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <li key={stepNum} className="flex-1 relative">
              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={clsx(
                    'absolute top-4 left-1/2 w-full h-0.5 -translate-y-0.5',
                    isComplete ? 'bg-bpn-600' : 'bg-slate-200'
                  )}
                  aria-hidden
                />
              )}

              <div className="relative flex flex-col items-center gap-2">
                {/* Circle */}
                <div
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold z-10 transition-all duration-200 border-2',
                    isComplete && 'bg-bpn-600 border-bpn-600 text-white',
                    isCurrent && 'bg-white border-bpn-600 text-bpn-700',
                    !isComplete && !isCurrent && 'bg-white border-slate-300 text-slate-400'
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                {/* Label */}
                <span
                  className={clsx(
                    'hidden sm:block text-center text-xs font-medium leading-tight',
                    isCurrent ? 'text-bpn-700' : isComplete ? 'text-slate-600' : 'text-slate-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
