import React from 'react';
import { motion } from 'framer-motion';

export type SignalStep = 'intake' | 'understand' | 'verify' | 'route';

export interface ClinicalSignalProps {
  currentStep: SignalStep;
  className?: string;
}

const steps: Array<{ id: SignalStep; label: string }> = [
  { id: 'intake', label: 'INTAKE' },
  { id: 'understand', label: 'UNDERSTAND' },
  { id: 'verify', label: 'VERIFY' },
  { id: 'route', label: 'ROUTE' },
];

export const ClinicalSignal: React.FC<ClinicalSignalProps> = ({ currentStep, className = '' }) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="flex items-center justify-between relative max-w-xl mx-auto px-4">
        {/* Background Track Line */}
        <div className="absolute top-1/2 left-8 right-8 h-[2px] bg-clinical-border -translate-y-1/2 z-0" />

        {/* Active Animated Teal Signal Line */}
        <motion.div
          className="absolute top-1/2 left-8 h-[2px] bg-clinical-primary -translate-y-1/2 z-0"
          initial={{ width: '0%' }}
          animate={{
            width: `${(currentIndex / (steps.length - 1)) * 88}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {/* Nodes */}
        {steps.map((step, idx) => {
          const isActive = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <motion.div
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'bg-clinical-primary text-white' : 'bg-white border-2 border-clinical-border text-transparent'
                }`}
                animate={isCurrent ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 1.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 1 }}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-transparent'}`} />
              </motion.div>
              <span
                className={`mt-2 text-[10px] font-bold tracking-wider uppercase transition-colors ${
                  isActive ? 'text-clinical-primary font-bold' : 'text-clinical-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
