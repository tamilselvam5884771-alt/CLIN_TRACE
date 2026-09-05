import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User as UserIcon,
  MessageSquare,
  AlertTriangle,
  Building2,
  Clock,
  FileCode,
  ShieldCheck,
  HelpCircle,
  AlertOctagon,
  ArrowDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { UrgencyBadge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import { StatusIndicator, LoadingSpinner } from '../components/ui/StatusIndicator';
import { api } from '../api/client';
import { TriageNoteDetail } from '../types/api';

export const NurseCaseDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<TriageNoteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await api.getTriageNoteDetail(parseInt(id, 10));
      setNote(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load case detail.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleEscalateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !escalateReason.trim()) return;

    setIsEscalating(true);
    try {
      const updated = await api.escalateTriageNote(parseInt(id, 10), {
        reason: escalateReason.trim(),
      });
      setNote(updated);
      setIsEscalateOpen(false);
      setEscalateReason('');
    } catch (err: any) {
      alert(err.message || 'Escalation failed.');
    } finally {
      setIsEscalating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <LoadingSpinner label="Retrieving clinical case details..." />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-sm font-bold text-urgency-emergency">{error || 'Case record not found.'}</p>
        <Link to="/nurse" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-clinical-primary">
          <ArrowLeft className="w-4 h-4" /> Return to Nurse Console Dashboard
        </Link>
      </div>
    );
  }

  const isEscalated = note.status.toUpperCase() === 'ESCALATED';
  const patientInputText = note.patient_reported?.chief_complaint || 'Initial complaint';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/nurse"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Priority Queue
        </Link>

        <div className="flex items-center gap-3">
          <StatusIndicator status={note.status} />
          {!isEscalated && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsEscalateOpen(true)}
              className="font-bold shadow-2xs"
            >
              <AlertOctagon className="w-3.5 h-3.5" /> Manual Escalation
            </Button>
          )}
        </div>
      </div>

      {/* ESCALATED BANNER IF APPLICABLE */}
      {isEscalated && (
        <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-2xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-900 shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-900">
                  CLINICAL SAFETY ESCALATION
                </span>
                <span className="text-xs font-mono font-semibold text-amber-800">
                  {new Date(note.created_at).toLocaleString()}
                </span>
              </div>
              <h2 className="text-2xl font-black text-amber-950 tracking-tight">
                ESCALATED TO STAFF
              </h2>
              <p className="text-sm font-semibold text-amber-900 bg-white/70 p-3 rounded-lg border border-amber-200">
                Reason: {note.escalation_reason || note.exact_rule_reason || "There isn't enough information to safely route this case."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CASE METADATA HEADER */}
      <Card className="shadow-2xs border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500">
              <span>Case #{note.case_id}</span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(note.created_at).toLocaleString()}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 mt-1">
              <UserIcon className="w-6 h-6 text-clinical-primary" />
              {note.patient_reported?.name || 'Anonymous Patient'}
            </h1>
          </div>
          {!isEscalated && <UrgencyBadge urgency={note.urgency} className="px-4 py-1.5 text-sm" />}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Chief Complaint:
            </span>
            <p className="text-sm font-medium text-slate-900">
              "{patientInputText}"
            </p>
          </div>

          <div className="p-3.5 bg-teal-50/60 border border-teal-200/80 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800">
              Assigned Clinical Department:
            </span>
            <p className="text-lg font-black text-clinical-primary">
              {note.department || 'Unassigned (Escalated Review)'}
            </p>
          </div>
        </div>
      </Card>

      {/* 5-STEP VISUAL RULE TRACE PIPELINE */}
      <Card className="shadow-2xs border-clinical-primary/30 bg-gradient-to-br from-white to-teal-50/20">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-clinical-primary" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
              Deterministic Rule Engine Trace
            </h3>
          </div>
          {note.rule_id && (
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-clinical-primary/10 text-clinical-primary rounded border border-clinical-primary/20">
              {note.rule_id}
            </span>
          )}
        </div>

        <div className="mt-5 space-y-3 relative">
          {/* Step 1: PATIENT MESSAGE */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Step 1: Patient Message
            </div>
            <p className="text-xs italic text-slate-800">
              "{patientInputText}"
            </p>
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Step 2: STRUCTURED FACTS */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Step 2: Structured Facts (Clinical Extractions)
            </div>
            {note.established_information.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {note.established_information.map((fact, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs flex items-center gap-1.5"
                  >
                    <FileCode className="w-3.5 h-3.5 text-clinical-primary" />
                    <span className="font-semibold text-slate-900">{fact.symptom}</span>
                    {fact.severity && (
                      <span className="text-[10px] uppercase font-bold text-clinical-primary bg-clinical-primary-light px-1.5 py-0.5 rounded">
                        {fact.severity}
                      </span>
                    )}
                    {fact.duration && (
                      <span className="text-[10px] text-slate-500 font-mono">{fact.duration}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No structured clinical facts extracted.</p>
            )}
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Step 3: DETERMINISTIC RULE */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Step 3: Deterministic Rule Match
            </div>
            {note.rule_id ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-clinical-primary bg-clinical-primary/10 px-2 py-0.5 rounded">
                    {note.rule_id}
                  </span>
                  <span className="font-bold text-xs text-slate-900">{note.rule_name || 'Clinical Rule'}</span>
                </div>
                {note.exact_rule_reason && (
                  <p className="mt-1 text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                    {note.exact_rule_reason}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-amber-800 font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                No deterministic rule triggered with sufficient safety confidence. Safe default escalation applied.
              </p>
            )}
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Step 4: URGENCY */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Step 4: Urgency Classification
            </div>
            <div className="pt-0.5">
              <UrgencyBadge urgency={isEscalated ? null : note.urgency} />
            </div>
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Step 5: DEPARTMENT */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Step 5: Clinical Department Routing
            </div>
            <p className="text-sm font-black text-clinical-primary">
              {note.department || 'Escalated to Staff Review'}
            </p>
          </div>
        </div>
      </Card>

      {/* 2-COLUMN STRUCTURED INFORMATION & DIALOGUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dialogue History */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            header={
              <div className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-clinical-primary" />
                <span>Conversation Dialogue History</span>
              </div>
            }
          >
            <div className="space-y-3">
              {note.conversation_history.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    msg.sender === 'patient'
                      ? 'bg-slate-50 border-slate-200 ml-0 mr-6'
                      : 'bg-teal-50/60 border-teal-200/80 ml-6 mr-0'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[10px] uppercase text-slate-500 mb-1">
                    <span>{msg.sender === 'patient' ? note.patient_reported?.name : 'ClinTrace Assistant'}</span>
                    <span className="flex items-center gap-1 font-normal text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{msg.content}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Established Facts, Unknowns, & Contradictions */}
        <div className="space-y-6">
          <Card
            header={
              <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Established Information
              </div>
            }
          >
            <div className="space-y-2 text-xs">
              {note.established_information.length === 0 ? (
                <p className="text-slate-400 italic">No structured facts extracted.</p>
              ) : (
                note.established_information.map((fact, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900">{fact.symptom}</p>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {fact.severity && (
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-clinical-primary">
                          Severity: {fact.severity}
                        </span>
                      )}
                      {fact.duration && (
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-mono">
                          Duration: {fact.duration}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card
            header={
              <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Unknowns &amp; Safety Checks
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Unknown Information:</span>
                <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-600">
                  {note.unknown_information || 'None identified'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Contradictions Detected:</span>
                <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-600">
                  {note.contradictions || 'None detected'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* MANUAL ESCALATION DIALOG */}
      <Dialog
        isOpen={isEscalateOpen}
        onClose={() => setIsEscalateOpen(false)}
        title="Manual Case Escalation to Clinician"
      >
        <form onSubmit={handleEscalateSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Provide explicit clinical justification for manually escalating this patient intake case to clinician review.
          </p>
          <Textarea
            label="Escalation Reason"
            placeholder="State clinical observations or reasons for escalation..."
            value={escalateReason}
            onChange={(e) => setEscalateReason(e.target.value)}
            rows={4}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEscalateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={isEscalating}>
              Confirm Manual Escalation
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

