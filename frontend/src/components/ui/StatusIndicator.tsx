import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    error: <AlertCircle className="w-4 h-4 text-urgency-emergency" />,
    info: <Info className="w-4 h-4 text-clinical-primary" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 z-50 bg-white border border-clinical-border shadow-clinical-md rounded-lg p-3.5 flex items-center gap-3 text-sm text-clinical-text max-w-md"
    >
      {icons[type]}
      <span className="font-medium flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-clinical-muted hover:text-clinical-text text-xs">
          ✕
        </button>
      )}
    </motion.div>
  );
};

export const LoadingSpinner: React.FC<{ label?: string; className?: string }> = ({
  label = 'Processing clinical logic...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <Loader2 className="w-8 h-8 text-clinical-primary animate-spin mb-3" />
      <p className="text-xs font-semibold uppercase tracking-wider text-clinical-muted">{label}</p>
    </div>
  );
};

export interface StatusIndicatorProps {
  status: 'ROUTED' | 'ESCALATED' | 'NEEDS_FOLLOW_UP' | string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className = '' }) => {
  const s = status.toUpperCase();

  if (s === 'ROUTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-emerald-500" /> ROUTED
      </span>
    );
  }

  if (s === 'ESCALATED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> ESCALATED
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 ${className}`}>
      <span className="w-2 h-2 rounded-full bg-teal-500" /> NEEDS FOLLOW-UP
    </span>
  );
};
