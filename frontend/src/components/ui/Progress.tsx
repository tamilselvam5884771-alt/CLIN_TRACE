import React from 'react';

export interface ProgressProps {
  value: number; // 0 - 100
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className = '' }) => {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full bg-clinical-border rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="bg-clinical-primary h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
