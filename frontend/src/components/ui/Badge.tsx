import React from 'react';
import { UrgencyLevel } from '../../types/api';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'muted' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: 'bg-clinical-bg text-clinical-text border-clinical-border',
    primary: 'bg-clinical-primary-light text-clinical-primary border-clinical-primary/20',
    muted: 'bg-slate-100 text-clinical-muted border-slate-200',
    outline: 'bg-white text-clinical-text border-clinical-border',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export interface UrgencyBadgeProps {
  urgency?: UrgencyLevel | string | null;
  className?: string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency, className = '' }) => {
  if (!urgency) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
        UNSPECIFIED
      </span>
    );
  }

  const u = urgency.toLowerCase();

  if (u.includes('emergency')) {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider bg-red-50 text-urgency-emergency border border-red-200 animate-pulse ${className}`}>
        ● EMERGENCY
      </span>
    );
  }

  if (u.includes('urgent')) {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-50 text-urgency-urgent border border-amber-200 ${className}`}>
        ● URGENT
      </span>
    );
  }

  if (u.includes('standard')) {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-teal-50 text-urgency-standard border border-teal-200 ${className}`}>
        ● STANDARD
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-slate-50 text-urgency-nonurgent border border-slate-200 ${className}`}>
      ● NON-URGENT
    </span>
  );
};
