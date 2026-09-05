import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', header, footer }) => {
  return (
    <div className={`bg-white border border-clinical-border rounded-xl shadow-clinical overflow-hidden ${className}`}>
      {header && <div className="px-6 py-4 border-b border-clinical-border bg-clinical-bg/40">{header}</div>}
      <div className="p-6">{children}</div>
      {footer && <div className="px-6 py-3 border-t border-clinical-border bg-clinical-bg/30">{footer}</div>}
    </div>
  );
};
