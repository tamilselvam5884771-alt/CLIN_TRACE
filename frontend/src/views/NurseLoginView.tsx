import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, AlertCircle, Info } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../api/client';

export const NurseLoginView: React.FC = () => {
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState('nurse@clintrace.demo');
  const [password, setPassword] = useState('demo123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.login({
        username_or_email: usernameOrEmail.trim(),
        password,
      });
      navigate('/nurse');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-clinical-primary text-white mx-auto flex items-center justify-center mb-3 shadow-clinical">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-clinical-text">
          Clinical Operations Authentication
        </h1>
        <p className="text-xs text-clinical-muted mt-1">
          Secure access to Nurse Dashboard & Triage Review Queue
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-urgency-emergency flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Email or Username"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" className="w-full font-bold" isLoading={isLoading}>
            <Lock className="w-4 h-4" /> Authenticate & Access Queue
          </Button>

          <div className="pt-3 border-t border-clinical-border text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-clinical-muted bg-clinical-bg px-3 py-1.5 rounded-md border border-clinical-border">
              <Info className="w-3.5 h-3.5 text-clinical-primary" />
              <span>Demo Login: nurse@clintrace.demo / demo123</span>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
