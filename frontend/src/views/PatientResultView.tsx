import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, AlertTriangle, Info, CheckCircle2, FileText, HelpCircle, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ClinicalSignal } from '../components/ui/ClinicalSignal';
import { Card } from '../components/ui/Card';
import { UrgencyBadge } from '../components/ui/Badge';
import { RuleTrace } from '../components/ui/RuleTrace';
import { LoadingSpinner, StatusIndicator } from '../components/ui/StatusIndicator';
import { api } from '../api/client';
import { IntakeWorkflowResponse, TriageNoteDetail } from '../types/api';

export const PatientResultView: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const shouldReduceMotion = useReducedMotion();

  const [workflowRes, setWorkflowRes] = useState<IntakeWorkflowResponse | null>(null);
  const [triageNote, setTriageNote] = useState<TriageNoteDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      if (!sessionId) return;
      setIsLoading(true);
      setFetchError(null);

      // Check session storage first
      const cached = sessionStorage.getItem(`intake_res_${sessionId}`);
      let parsedCached: IntakeWorkflowResponse | null = null;
      if (cached) {
        try {
          parsedCached = JSON.parse(cached);
          setWorkflowRes(parsedCached);
        } catch (e) {
          // ignore cache error
        }
      }

      // Fetch triage note details if triage_note_id or session ID is available
      const noteIdToFetch = parsedCached?.triage_note_id || parseInt(sessionId, 10);
      try {
        const note = await api.getTriageNoteDetail(noteIdToFetch);
        setTriageNote(note);
      } catch (err) {
        // If single triage note fails, fall back to cached workflow response
        if (!parsedCached) {
          setFetchError('Unable to load triage evaluation results. Please try starting a new intake.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <LoadingSpinner label="Retrieving clinical evaluation result..." />
      </div>
    );
  }

  if (fetchError && !workflowRes && !triageNote) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-urgency-emergency mb-6 text-sm">
          {fetchError}
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-clinical-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Patient Intake
        </Link>
      </div>
    );
  }

  // Derive consolidated fields from workflow response or triage note detail
  const status = triageNote?.status || workflowRes?.status || 'ROUTED';
  const isEscalated = status.toUpperCase() === 'ESCALATED';

  const urgency = isEscalated ? null : (triageNote?.urgency || workflowRes?.urgency || null);
  const department = triageNote?.department || workflowRes?.department || null;
  const ruleId = triageNote?.rule_id || workflowRes?.rule_id || null;
  const ruleName = triageNote?.rule_name || workflowRes?.rule_name || null;
  const reason = triageNote?.exact_rule_reason || workflowRes?.reason || null;

  // What We Heard
  const patientInputs = triageNote?.conversation_history
    ? triageNote.conversation_history.filter((m) => m.sender === 'patient').map((m) => m.content)
    : [triageNote?.patient_reported?.chief_complaint || 'Initial intake description submitted.'];

  // Established Information
  const establishedInfo = triageNote?.established_information || (workflowRes?.extractions || []).map(f => ({
    symptom: f.symptom,
    severity: f.severity || null,
    duration: f.duration_days ? `${f.duration_days} days` : null,
    additional_context: f.additional_context || null,
  }));

  // Unknown Information
  const unknownInfo = triageNote?.unknown_information || 'None identified';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Animated Clinical Signal Line (State: ROUTE) */}
      <ClinicalSignal currentStep="route" className="mb-6" />

      {/* Top Header & Actions */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-clinical-muted hover:text-clinical-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Start New Intake
        </Link>
        <StatusIndicator status={status} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
        className="space-y-6"
      >
        {/* ESCALATION BANNER vs. TRIAGE COMPLETE HEADER */}
        {isEscalated ? (
          <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-900 block">
                  CLINICAL SAFETY NOTICE
                </span>
                <h1 className="text-2xl font-black text-amber-950 tracking-tight">
                  ESCALATED TO STAFF
                </h1>
                <p className="text-sm font-medium text-amber-900 leading-relaxed pt-1">
                  "There isn't enough information to safely route this case."
                </p>
                <p className="text-xs text-amber-800 pt-2 border-t border-amber-200/80 mt-3">
                  This case has been prioritized in the nurse queue. A clinician will review your intake description directly.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Card className="shadow-clinical-md border-clinical-primary/30">
            {/* Top Result Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-clinical-border">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-clinical-primary block">
                  CLINICAL ROUTING RESULT
                </span>
                <h1 className="text-3xl font-extrabold text-clinical-text tracking-tight mt-0.5">
                  TRIAGE COMPLETE
                </h1>
              </div>
              {/* Urgency Badge */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: 0.15 }}
              >
                <UrgencyBadge urgency={urgency} className="px-4 py-1.5 text-sm" />
              </motion.div>
            </div>

            {/* Department & Urgency Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {department && (
                <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/80">
                  <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
                    <Building2 className="w-4 h-4 text-clinical-primary" />
                    <span>Assigned Department</span>
                  </div>
                  <p className="text-xl font-black text-clinical-primary">{department}</p>
                </div>
              )}

              <div className="p-4 bg-clinical-bg rounded-xl border border-clinical-border">
                <div className="flex items-center gap-2 text-clinical-muted text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Routing Priority</span>
                </div>
                <p className="text-xl font-black text-clinical-text">{urgency || 'Standard'}</p>
              </div>
            </div>

            {/* RECOMMENDED BECAUSE Section */}
            {(ruleId || reason) && (
              <div className="mt-6 pt-6 border-t border-clinical-border">
                <span className="text-xs font-extrabold tracking-widest uppercase text-clinical-primary block mb-2">
                  RECOMMENDED BECAUSE
                </span>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  {ruleId && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-clinical-primary/10 text-clinical-primary rounded border border-clinical-primary/20">
                        {ruleId}
                      </span>
                      {ruleName && <span className="font-bold text-sm text-clinical-text">{ruleName}</span>}
                    </div>
                  )}
                  {reason && (
                    <p className="text-xs font-mono text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                      {reason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* STRUCTURED INFORMATION SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Section 1: WHAT WE HEARD */}
          <Card className="shadow-xs border-clinical-border flex flex-col">
            <div className="flex items-center gap-2 text-clinical-primary font-bold text-xs uppercase tracking-wider mb-3">
              <FileText className="w-4 h-4 text-clinical-primary" />
              <span>WHAT WE HEARD</span>
            </div>
            <div className="space-y-2.5 text-xs flex-1">
              {patientInputs.map((input, idx) => (
                <div key={idx} className="p-2.5 bg-clinical-bg rounded-lg border border-clinical-border/60">
                  <p className="italic text-clinical-text">"{input}"</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 2: ESTABLISHED INFORMATION */}
          <Card className="shadow-xs border-clinical-border flex flex-col">
            <div className="flex items-center gap-2 text-clinical-primary font-bold text-xs uppercase tracking-wider mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ESTABLISHED INFORMATION</span>
            </div>
            <div className="space-y-2 flex-1">
              {establishedInfo.length > 0 ? (
                establishedInfo.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-clinical-bg rounded-lg border border-clinical-border/60 text-xs space-y-0.5"
                  >
                    <div className="font-bold text-clinical-text flex items-center justify-between">
                      <span>{fact.symptom}</span>
                      {fact.severity && (
                        <span className="text-[10px] uppercase font-bold text-clinical-primary bg-clinical-primary-light px-1.5 py-0.5 rounded">
                          {fact.severity}
                        </span>
                      )}
                    </div>
                    {fact.duration && (
                      <p className="text-[11px] text-clinical-muted">Duration: {fact.duration}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-clinical-muted italic">No explicit symptoms extracted.</p>
              )}
            </div>
          </Card>

          {/* Section 3: UNKNOWN */}
          <Card className="shadow-xs border-clinical-border flex flex-col">
            <div className="flex items-center gap-2 text-clinical-primary font-bold text-xs uppercase tracking-wider mb-3">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>UNKNOWN</span>
            </div>
            <div className="p-3 bg-clinical-bg rounded-lg border border-clinical-border/60 text-xs text-clinical-muted leading-relaxed flex-1">
              <p>{unknownInfo}</p>
            </div>
          </Card>
        </div>

        {/* RULE TRACE COMPONENT */}
        <RuleTrace
          ruleId={ruleId}
          ruleName={ruleName}
          reason={reason}
          matchedFacts={workflowRes?.extractions || []}
          status={status}
          patientInputText={patientInputs.join(' | ')}
          department={department}
          urgency={urgency}
          defaultExpanded={false}
        />

        {/* MEDICAL DISCLAIMER */}
        <div className="p-4 bg-white border border-clinical-border/80 rounded-xl flex items-center justify-center gap-2 text-center text-xs text-clinical-muted">
          <Info className="w-4 h-4 text-clinical-primary shrink-0" />
          <span className="font-medium text-clinical-text">
            This is a routing recommendation, not a diagnosis.
          </span>
        </div>
      </motion.div>
    </div>
  );
};

