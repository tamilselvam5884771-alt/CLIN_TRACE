import React, { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-clinical-muted mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3.5 py-2.5 bg-white border border-clinical-border rounded-lg text-clinical-text text-sm placeholder-clinical-muted/60 focus:outline-none focus:ring-2 focus:ring-clinical-primary focus:border-transparent transition-all resize-y min-h-[100px] ${
            error ? 'border-urgency-emergency focus:ring-urgency-emergency' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-urgency-emergency font-medium">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
