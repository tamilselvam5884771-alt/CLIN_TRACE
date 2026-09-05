import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Building2, Send, AlertTriangle } from 'lucide-react';
import { ClinicalSignal, SignalStep } from '../components/ui/ClinicalSignal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { UrgencyBadge } from '../components/ui/Badge';
import { RuleTrace } from '../components/ui/RuleTrace';
import { LoadingSpinner, StatusIndicator } from '../components/ui/StatusIndicator';
import { api } from '../api/client';
import { IntakeWorkflowResponse } from '../types/api';

export const PatientResultView: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<IntakeWorkflowResponse | null>(null);
  const [followupAnswer, setFollowupAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      const cached = sessionStorage.getItem(`intake_res_${sessionId}`);
      if (cached) {
        try {
          setResult(JSON.parse(cached));
        } catch (e) {
          // ignore cache parse error
        }
      }
    }
  }, [sessionId]);

  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !followupAnswer.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.submitFollowup(parseInt(sessionId, 10), {
        answer: followupAnswer.trim(),
      });
      setResult(res);
      sessionStorage.setItem(`intake_res_${sessionId}`, JSON.stringify(res));
      setFollowupAnswer('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit follow-up response.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <LoadingSpinner label="Retrieving intake evaluation status..." />
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-clinical-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Start New Intake
        </Link>
      </div>
    );
  }

  const signalStep: SignalStep =
    result.status === 'NEEDS_FOLLOW_UP' ? 'verify' : 'route';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ClinicalSignal currentStep={signalStep} className="mb-6" />

      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-clinical-muted hover:text-clinical-text">
          <ArrowLeft className="w-4 h-4" /> Start New Intake
        </Link>
        <StatusIndicator status={result.status} />
      </div>

      {result.status === 'NEEDS_FOLLOW_UP' ? (
        <Card className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-clinical-primary font-bold text-sm mb-4">
            <MessageSquare className="w-5 h-5 text-clinical-primary" />
            <span>Additional Clarification Required</span>
          </div>

          {result.follow_up_questions && result.follow_up_questions.length > 0 && (
            <div className="p-4 bg-clinical-primary-light/30 border border-clinical-primary/20 rounded-lg mb-6">
              <p className="text-xs uppercase font-bold text-clinical-muted mb-1">Follow-up Question from Assistant:</p>
              <p className="text-sm font-semibold text-clinical-text">{result.follow_up_questions[0]}</p>
            </div>
          )}

          <form onSubmit={handleFollowupSubmit} className="space-y-4">
            {error && <p className="text-xs font-medium text-urgency-emergency">{error}</p>}
            <Textarea
              label="Your Answer"
              placeholder="Provide more specific details..."
              value={followupAnswer}
              onChange={(e) => setFollowupAnswer(e.target.value)}
              rows={4}
              required
            />
            <Button type="submit" variant="primary" className="w-full font-bold" isLoading={isLoading}>
              <Send className="w-4 h-4" /> Submit Clarification
            </Button>
          </form>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-white border-clinical-primary/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-clinical-border">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-clinical-muted">Triage Result</span>
                <h2 className="text-2xl font-extrabold text-clinical-text mt-0.5">
                  {result.status === 'ROUTED' ? 'Patient Clinical Routing Complete' : 'Case Escalated to Clinician'}
                </h2>
              </div>
              <UrgencyBadge urgency={result.urgency} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {result.department && (
                <div className="p-4 bg-clinical-bg rounded-lg border border-clinical-border">
                  <div className="flex items-center gap-2 text-clinical-muted text-xs font-bold uppercase mb-1">
                    <Building2 className="w-4 h-4 text-clinical-primary" />
                    <span>Assigned Clinical Department</span>
                  </div>
                  <p className="text-lg font-extrabold text-clinical-primary">{result.department}</p>
                </div>
              )}

              <div className="p-4 bg-clinical-bg rounded-lg border border-clinical-border">
                <div className="flex items-center gap-2 text-clinical-muted text-xs font-bold uppercase mb-1">
                  <span>Urgency Classification</span>
                </div>
                <p className="text-lg font-extrabold text-clinical-text">{result.urgency || 'Escalated Review'}</p>
              </div>
            </div>
          </Card>

          {/* Rule Engine Trace Component */}
          <RuleTrace
            ruleId={result.rule_id}
            ruleName={result.rule_name}
            reason={result.reason}
            matchedFacts={result.extractions}
            status={result.status}
          />
        </div>
      )}
    </div>
  );
};
