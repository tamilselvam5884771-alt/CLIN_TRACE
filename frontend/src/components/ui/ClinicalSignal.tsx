import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

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
  const shouldReduceMotion = useReducedMotion();

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
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: 'easeInOut' }}
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
                animate={isCurrent && !shouldReduceMotion ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 1.5, repeat: isCurrent && !shouldReduceMotion ? Infinity : 0, repeatDelay: 0.8 }}
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

export const TealBreathingSignal: React.FC<{ label?: string; className?: string }> = ({
  label = 'UNDERSTANDING YOUR MESSAGE',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer Pulsing Teal Signal Ring */}
        <motion.div
          className="w-16 h-16 rounded-full bg-clinical-primary/20 absolute"
          animate={shouldReduceMotion ? {} : { scale: [1, 1.6, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Inner Pulsing Core */}
        <motion.div
          className="w-10 h-10 rounded-full bg-clinical-primary/40 absolute"
          animate={shouldReduceMotion ? {} : { scale: [1, 1.3, 1], opacity: [0.8, 0.3, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        />
        {/* Center Solid Clinical Signal Node */}
        <div className="w-5 h-5 rounded-full bg-clinical-primary shadow-sm z-10 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white animate-ping" />
        </div>
      </div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-clinical-primary mb-1">
        {label}
      </h3>
      <p className="text-xs text-clinical-muted max-w-xs">
        Analyzing symptom details and checking deterministic clinical routing rules...
      </p>
    </div>
  );
};

