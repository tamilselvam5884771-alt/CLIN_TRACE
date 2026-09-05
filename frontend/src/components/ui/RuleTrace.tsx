import React from 'react';
import { ShieldCheck, AlertTriangle, FileCode } from 'lucide-react';
import { ExtractionFact } from '../../types/api';

export interface RuleTraceProps {
  ruleId?: string | null;
  ruleName?: string | null;
  reason?: string | null;
  matchedFacts?: ExtractionFact[];
  status?: string;
  className?: string;
}

export const RuleTrace: React.FC<RuleTraceProps> = ({
  ruleId,
  ruleName,
  reason,
  matchedFacts = [],
  status = 'ROUTED',
  className = '',
}) => {
  const isEscalated = status.toUpperCase() === 'ESCALATED';

  return (
    <div
      className={`rounded-xl border p-4 font-sans text-sm ${
        isEscalated
          ? 'bg-amber-50/50 border-amber-200 text-amber-950'
          : 'bg-clinical-primary-light/20 border-clinical-primary/30 text-clinical-text'
      } ${className}`}
    >
      <div className="flex items-center justify-between border-b border-clinical-border/60 pb-3 mb-3">
        <div className="flex items-center gap-2">
          {isEscalated ? (
            <AlertTriangle className="w-5 h-5 text-urgency-urgent" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-clinical-primary" />
          )}
          <span className="font-semibold text-xs tracking-wider uppercase">
            {isEscalated ? 'Clinical Safety Escalation' : 'Deterministic Rule Engine Trace'}
          </span>
        </div>
        {ruleId && (
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-clinical-primary/10 text-clinical-primary rounded border border-clinical-primary/20">
            {ruleId}
          </span>
        )}
      </div>

      {ruleName && (
        <div className="mb-2">
          <span className="text-xs uppercase font-medium text-clinical-muted">Matched Rule Name:</span>
          <p className="font-bold text-clinical-text">{ruleName}</p>
        </div>
      )}

      {reason && (
        <div className="mb-3">
          <span className="text-xs uppercase font-medium text-clinical-muted">Exact Rule Reasoning:</span>
          <p className="mt-0.5 text-xs font-mono bg-white/80 p-2.5 rounded border border-clinical-border/60 leading-relaxed">
            {reason}
          </p>
        </div>
      )}

      {matchedFacts.length > 0 && (
        <div>
          <span className="text-xs uppercase font-medium text-clinical-muted">Matched Clinical Facts:</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {matchedFacts.map((fact, idx) => (
              <div
                key={idx}
                className="bg-white px-2.5 py-1 rounded border border-clinical-border text-xs flex items-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5 text-clinical-primary" />
                <span className="font-medium text-clinical-text">{fact.symptom}</span>
                {fact.severity && (
                  <span className="text-[10px] uppercase font-bold text-clinical-muted bg-clinical-bg px-1 rounded">
                    {fact.severity}
                  </span>
                )}
                {fact.duration_days && (
                  <span className="text-[10px] text-clinical-muted">{fact.duration_days}d</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
