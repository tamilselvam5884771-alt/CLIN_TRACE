import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, MessageSquare, AlertOctagon, Building2, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { UrgencyBadge } from '../components/ui/Badge';
import { RuleTrace } from '../components/ui/RuleTrace';
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
        <LoadingSpinner label="Retrieving case details..." />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-sm font-semibold text-urgency-emergency">{error || 'Case not found.'}</p>
        <Link to="/nurse" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-clinical-primary">
          <ArrowLeft className="w-4 h-4" /> Return to Nurse Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <Link to="/nurse" className="inline-flex items-center gap-1.5 text-xs font-bold text-clinical-muted hover:text-clinical-text">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard Queue
        </Link>
        <div className="flex items-center gap-2">
          <StatusIndicator status={note.status} />
          {note.status !== 'ESCALATED' && (
            <Button variant="danger" size="sm" onClick={() => setIsEscalateOpen(true)}>
              <AlertOctagon className="w-3.5 h-3.5" /> Manual Escalation
            </Button>
          )}
        </div>
      </div>

      {/* Main Case Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-clinical-border">
              <div>
                <span className="text-xs uppercase font-bold text-clinical-muted">Case Record #{note.case_id}</span>
                <h2 className="text-xl font-extrabold text-clinical-text flex items-center gap-2 mt-0.5">
                  <UserIcon className="w-5 h-5 text-clinical-primary" />
                  {note.patient_reported?.name || 'Anonymous Patient'}
                </h2>
              </div>
              <UrgencyBadge urgency={note.urgency} />
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="font-bold uppercase tracking-wider text-clinical-muted">Chief Complaint:</span>
                <p className="mt-1 text-sm font-medium text-clinical-text bg-clinical-bg p-3 rounded-lg border border-clinical-border">
                  "{note.patient_reported?.chief_complaint || 'No complaint details'}"
                </p>
              </div>

              {note.department && (
                <div className="flex items-center gap-2 text-clinical-primary font-bold text-sm pt-2">
                  <Building2 className="w-4 h-4" />
                  <span>Routed Department: {note.department}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Rule Engine Trace Component */}
          <RuleTrace
            ruleId={note.rule_id}
            ruleName={note.rule_name}
            reason={note.exact_rule_reason}
            matchedFacts={note.established_information}
            status={note.status}
          />

          {/* Conversation History */}
          <Card header={<div className="font-bold text-xs uppercase tracking-wider text-clinical-muted flex items-center gap-2"><MessageSquare className="w-4 h-4 text-clinical-primary" /> Conversation Dialogue History</div>}>
            <div className="space-y-3">
              {note.conversation_history.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                    msg.sender === 'patient'
                      ? 'bg-clinical-bg border-clinical-border ml-0 mr-8'
                      : 'bg-clinical-primary-light/30 border-clinical-primary/20 ml-8 mr-0'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[10px] uppercase text-clinical-muted mb-1">
                    <span>{msg.sender === 'patient' ? note.patient_reported?.name : 'ClinTrace Assistant'}</span>
                    <span className="flex items-center gap-1 font-normal"><Clock className="w-3 h-3" /> {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-clinical-text font-medium">{msg.content}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card header={<div className="font-bold text-xs uppercase tracking-wider text-clinical-muted">Established Facts</div>}>
            <div className="space-y-2 text-xs">
              {note.established_information.length === 0 ? (
                <p className="text-clinical-muted italic">No structured facts extracted.</p>
              ) : (
                note.established_information.map((fact, idx) => (
                  <div key={idx} className="p-2.5 bg-clinical-bg rounded-lg border border-clinical-border">
                    <p className="font-bold text-clinical-text">{fact.symptom}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-clinical-muted font-medium">
                      {fact.severity && <span className="bg-white px-1.5 py-0.5 rounded border">Severity: {fact.severity}</span>}
                      {fact.duration && <span className="bg-white px-1.5 py-0.5 rounded border">Duration: {fact.duration}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card header={<div className="font-bold text-xs uppercase tracking-wider text-clinical-muted">Case Metadata</div>}>
            <div className="space-y-2 text-xs text-clinical-text">
              <div className="flex justify-between py-1 border-b border-clinical-border">
                <span className="text-clinical-muted">Created:</span>
                <span className="font-mono">{new Date(note.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-clinical-border">
                <span className="text-clinical-muted">Contradictions:</span>
                <span>{note.contradictions}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-clinical-muted">Missing Info:</span>
                <span>{note.unknown_information}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Manual Escalation Dialog */}
      <Dialog isOpen={isEscalateOpen} onClose={() => setIsEscalateOpen(false)} title="Manual Case Escalation">
        <form onSubmit={handleEscalateSubmit} className="space-y-4">
          <p className="text-xs text-clinical-muted">
            Provide explicit clinical justification for manually escalating this patient case to duty clinician review.
          </p>
          <Textarea
            label="Escalation Reason"
            placeholder="Describe clinical rationale..."
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
              Confirm Escalation
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
