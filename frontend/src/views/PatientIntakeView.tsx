import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Send, FileText, AlertCircle } from 'lucide-react';
import { ClinicalSignal } from '../components/ui/ClinicalSignal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { api } from '../api/client';

export const PatientIntakeView: React.FC = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !description.trim()) {
      setError('Please provide both your name and description of your health symptoms.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.submitIntake({
        patient_name: patientName.trim(),
        description: description.trim(),
      });
      // Store session details in session storage for local state management
      sessionStorage.setItem(`intake_res_${res.session_id}`, JSON.stringify(res));
      navigate(`/result/${res.session_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit intake. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Clinical Signal Progress Tracker */}
      <ClinicalSignal currentStep="intake" className="mb-6" />

      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-clinical-text">
          Patient Symptom Intake
        </h1>
        <p className="mt-2 text-sm text-clinical-muted max-w-xl mx-auto">
          Please describe your medical symptoms clearly. ClinTrace uses deterministic clinical safety rules to evaluate urgency and route you to the right department.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-urgency-emergency flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="e.g. Jane Doe"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            disabled={isLoading}
            required
          />

          <Textarea
            label="Describe Your Symptoms & Duration"
            placeholder="Please detail your main symptoms, when they started, severity (mild, moderate, or severe), and any pain location..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            rows={5}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-xs"
              isLoading={isLoading}
            >
              <Send className="w-4 h-4" />
              Submit Intake for Clinical Evaluation
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
