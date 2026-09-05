import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-clinical-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';
    
    const variants = {
      primary: 'bg-clinical-primary text-white hover:bg-[#0D625C] active:bg-[#0B4F4A]',
      secondary: 'bg-clinical-primary-light text-clinical-text hover:bg-[#B5F4E8]',
      outline: 'border border-clinical-border text-clinical-text bg-white hover:bg-clinical-bg',
      ghost: 'text-clinical-text hover:bg-clinical-primary-light/50',
      danger: 'bg-urgency-emergency text-white hover:bg-red-700',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
