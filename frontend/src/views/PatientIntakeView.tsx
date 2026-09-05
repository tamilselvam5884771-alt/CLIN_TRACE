import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, MessageSquare, Info } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ClinicalSignal, TealBreathingSignal, SignalStep } from '../components/ui/ClinicalSignal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { api } from '../api/client';
import { IntakeWorkflowResponse } from '../types/api';

export const PatientIntakeView: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Intake State
  const [patientName, setPatientName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workflow State for in-page Follow-ups
  const [activeSession, setActiveSession] = useState<IntakeWorkflowResponse | null>(null);
  const [followupAnswer, setFollowupAnswer] = useState('');
  const [followupStepCount, setFollowupStepCount] = useState<number>(1);

  // Handle Initial Intake Submit
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe what is bothering you in your own words.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const nameToSubmit = patientName.trim() || 'Patient Guest';

    try {
      const res = await api.submitIntake({
        patient_name: nameToSubmit,
        description: description.trim(),
      });

      sessionStorage.setItem(`intake_res_${res.session_id}`, JSON.stringify(res));

      if (res.status === 'NEEDS_FOLLOW_UP') {
        setActiveSession(res);
        setFollowupStepCount(1);
      } else {
        navigate(`/result/${res.session_id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to intake server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Followup Answer Submit
  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !followupAnswer.trim()) {
      setError('Please enter your response to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.submitFollowup(activeSession.session_id, {
        answer: followupAnswer.trim(),
      });

      sessionStorage.setItem(`intake_res_${res.session_id}`, JSON.stringify(res));

      if (res.status === 'NEEDS_FOLLOW_UP') {
        setActiveSession(res);
        setFollowupAnswer('');
        setFollowupStepCount((prev) => prev + 1);
      } else {
        navigate(`/result/${res.session_id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit follow-up response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Signal step calculation
  const currentSignalStep: SignalStep = isLoading
    ? 'understand'
    : activeSession
    ? 'verify'
    : 'intake';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Animated Clinical Signal Progress Indicator */}
      <ClinicalSignal currentStep={currentSignalStep} className="mb-8" />

      {/* Main Form Container with Page Transitions */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          /* Processing State - "UNDERSTANDING YOUR MESSAGE" */
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="shadow-clinical-md border-clinical-primary/30">
              <TealBreathingSignal label="UNDERSTANDING YOUR MESSAGE" />
            </Card>
          </motion.div>
        ) : activeSession && activeSession.status === 'NEEDS_FOLLOW_UP' ? (
          /* Screen 2: Follow-up Question Flow */
          <motion.div
            key="followup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="shadow-clinical-md border-clinical-primary/30">
              <div className="flex items-center justify-between border-b border-clinical-border pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-clinical-primary block">
                    A LITTLE MORE INFORMATION
                  </span>
                  <span className="text-xs text-clinical-muted">
                    {followupStepCount} of 2 additional questions
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-clinical-primary-light flex items-center justify-center text-clinical-primary font-bold text-xs">
                  {followupStepCount}
                </div>
              </div>

              {error && (
                <div className="p-3.5 mb-6 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-urgency-emergency flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Focused Single Question Display */}
              <div className="p-4 bg-teal-50/50 border border-teal-200/60 rounded-xl mb-6 flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-clinical-primary shrink-0 mt-0.5" />
                <p className="text-base font-semibold text-clinical-text leading-snug">
                  {activeSession.follow_up_questions?.[0] || 'Could you provide a few more details about your symptoms?'}
                </p>
              </div>

              <form onSubmit={handleFollowupSubmit} className="space-y-6">
                <Textarea
                  label="Your Response"
                  placeholder="Type your response here in plain words..."
                  value={followupAnswer}
                  onChange={(e) => setFollowupAnswer(e.target.value)}
                  rows={4}
                  className="text-base"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-xs py-3.5 min-h-[48px]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </form>
            </Card>
          </motion.div>
        ) : (
          /* Screen 1: Welcome / Intake Start */
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div className="text-center space-y-2">
              <span className="text-xs font-extrabold tracking-widest uppercase text-clinical-primary bg-clinical-primary-light/50 px-3 py-1 rounded-full border border-clinical-primary/20 inline-block">
                CLINTRACE
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-clinical-text">
                Patient Intake &amp; Clinical Routing
              </h1>
              <p className="text-sm sm:text-base text-clinical-muted max-w-lg mx-auto leading-relaxed pt-1">
                "Tell us what is bothering you in your own words. No medical terms are needed."
              </p>
            </div>

            <Card className="shadow-clinical-md border-clinical-border/80">
              <form onSubmit={handleInitialSubmit} className="space-y-6">
                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-urgency-emergency flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  label="Your Name (Optional)"
                  placeholder="e.g. Jane Doe"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  disabled={isLoading}
                />

                <Textarea
                  label="What is bothering you today?"
                  placeholder="Describe your symptoms in your own words. For example: I have had a dull stomach pain since yesterday morning..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  rows={6}
                  className="text-base leading-relaxed"
                  required
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full font-bold shadow-xs py-3.5 min-h-[48px] text-base"
                    isLoading={isLoading}
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            </Card>

            {/* Unobtrusive Medical Disclaimer */}
            <div className="flex items-center justify-center gap-2 text-center text-xs text-clinical-muted pt-2">
              <Info className="w-3.5 h-3.5 shrink-0 text-clinical-primary" />
              <span>This is a routing recommendation, not a diagnosis.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

