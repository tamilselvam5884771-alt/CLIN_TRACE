import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-clinical-border rounded-lg overflow-hidden bg-white ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-clinical-bg/30 text-left font-semibold text-sm text-clinical-text hover:bg-clinical-bg/60 transition-colors"
      >
        <span>{title}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-clinical-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="p-4 border-t border-clinical-border text-sm leading-relaxed">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
