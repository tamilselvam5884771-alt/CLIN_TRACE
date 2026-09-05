import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, FileCode, ChevronDown, ArrowDown, Cpu } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ExtractionFact } from '../../types/api';

export interface RuleTraceProps {
  ruleId?: string | null;
  ruleName?: string | null;
  reason?: string | null;
  matchedFacts?: ExtractionFact[];
  status?: string;
  patientInputText?: string | null;
  department?: string | null;
  urgency?: string | null;
  className?: string;
  defaultExpanded?: boolean;
}

export const RuleTrace: React.FC<RuleTraceProps> = ({
  ruleId,
  ruleName,
  reason,
  matchedFacts = [],
  status = 'ROUTED',
  patientInputText,
  department,
  urgency,
  className = '',
  defaultExpanded = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const isEscalated = status.toUpperCase() === 'ESCALATED';
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`rounded-xl border font-sans text-sm overflow-hidden transition-colors ${
        isEscalated
          ? 'bg-amber-50/50 border-amber-200 text-amber-950'
          : 'bg-clinical-primary-light/10 border-clinical-primary/30 text-clinical-text'
      } ${className}`}
    >
      {/* Toggle Bar Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-clinical-primary-light/20 transition-colors focus:outline-hidden"
      >
        <div className="flex items-center gap-3">
          {isEscalated ? (
            <AlertTriangle className="w-5 h-5 text-urgency-urgent shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-clinical-primary shrink-0" />
          )}
          <div>
            <span className="font-bold text-xs tracking-wider uppercase text-clinical-primary block">
              VIEW RULE TRACE
            </span>
            <span className="text-xs text-clinical-muted">
              {isEscalated
                ? 'Clinical safety escalation trace details'
                : ruleId
                ? `Deterministic Rule Match: ${ruleId} (${ruleName || 'Clinical Rule'})`
                : 'Deterministic Clinical Engine Pipeline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {ruleId && (
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-clinical-primary/10 text-clinical-primary rounded border border-clinical-primary/20">
              {ruleId}
            </span>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-clinical-muted" />
          </motion.div>
        </div>
      </button>

      {/* Accordion Expandable Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeInOut' }}
            className="border-t border-clinical-border/60 bg-white/70"
          >
            <div className="p-5 space-y-4">
              <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-lg flex items-start gap-2 text-xs text-teal-900 mb-4">
                <Cpu className="w-4 h-4 text-clinical-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Deterministic Clinical Governance:</span> This urgency recommendation was produced strictly by deterministic clinical Python rules. LLM models extract facts only and never decide patient urgency.
                </div>
              </div>

              {/* Visual 4-Step Rule Trace Pipeline */}
              <div className="space-y-3 relative">
                {/* Step 1: Patient Input */}
                <div className="p-3.5 bg-white border border-clinical-border rounded-lg shadow-2xs">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-clinical-muted mb-1">
                    Step 1: Patient Input
                  </div>
                  <p className="text-xs italic text-clinical-text">
                    "{patientInputText || 'Patient complaint description recorded during intake'}"
                  </p>
                </div>

                <div className="flex justify-center my-1 text-clinical-muted">
                  <ArrowDown className="w-4 h-4" />
                </div>

                {/* Step 2: Structured Information */}
                <div className="p-3.5 bg-white border border-clinical-border rounded-lg shadow-2xs">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-clinical-muted mb-1.5">
                    Step 2: Structured Information (Clinical Facts)
                  </div>
                  {matchedFacts.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {matchedFacts.map((fact, idx) => (
                        <div
                          key={idx}
                          className="bg-clinical-bg px-2.5 py-1 rounded border border-clinical-border text-xs flex items-center gap-1.5"
                        >
                          <FileCode className="w-3.5 h-3.5 text-clinical-primary" />
                          <span className="font-semibold text-clinical-text">{fact.symptom}</span>
                          {fact.severity && (
                            <span className="text-[10px] uppercase font-bold text-clinical-primary bg-clinical-primary-light px-1 rounded">
                              {fact.severity}
                            </span>
                          )}
                          {fact.duration_days !== undefined && fact.duration_days !== null && (
                            <span className="text-[10px] text-clinical-muted font-mono">{fact.duration_days} days</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-clinical-muted italic">No structured clinical facts extracted.</p>
                  )}
                </div>

                <div className="flex justify-center my-1 text-clinical-muted">
                  <ArrowDown className="w-4 h-4" />
                </div>

                {/* Step 3: Rule Match */}
                <div className="p-3.5 bg-white border border-clinical-border rounded-lg shadow-2xs">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-clinical-muted mb-1">
                    Step 3: Rule Match
                  </div>
                  {ruleId ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-clinical-primary bg-clinical-primary/10 px-2 py-0.5 rounded">
                          {ruleId}
                        </span>
                        <span className="font-bold text-xs text-clinical-text">{ruleName || 'Clinical Rule'}</span>
                      </div>
                      {reason && (
                        <p className="mt-1 text-xs font-mono bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-800 leading-relaxed">
                          {reason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-800 font-semibold bg-amber-50 p-2 rounded border border-amber-200">
                      {isEscalated
                        ? 'No specific deterministic rule matched with required safety confidence. Safe default escalation triggered.'
                        : 'No deterministic rule triggered.'}
                    </p>
                  )}
                </div>

                <div className="flex justify-center my-1 text-clinical-muted">
                  <ArrowDown className="w-4 h-4" />
                </div>

                {/* Step 4: Routing Decision */}
                <div className="p-3.5 bg-white border border-clinical-border rounded-lg shadow-2xs">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-clinical-muted mb-1">
                    Step 4: Routing Decision
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs font-bold text-clinical-muted uppercase">Status: </span>
                      <span className="text-xs font-extrabold text-clinical-primary">{status}</span>
                    </div>
                    {urgency && (
                      <div>
                        <span className="text-xs font-bold text-clinical-muted uppercase">Urgency: </span>
                        <span className="text-xs font-extrabold text-clinical-text">{urgency}</span>
                      </div>
                    )}
                    {department && (
                      <div>
                        <span className="text-xs font-bold text-clinical-muted uppercase">Dept: </span>
                        <span className="text-xs font-extrabold text-clinical-primary">{department}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

