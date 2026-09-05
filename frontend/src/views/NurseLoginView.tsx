import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../api/client';

export const NurseLoginView: React.FC = () => {
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemoCredentials = () => {
    setUsernameOrEmail('nurse@clintrace.demo');
    setPassword('demo123');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError('Please provide your login email/username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.login({
        username_or_email: usernameOrEmail.trim(),
        password,
      });
      navigate('/nurse');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify login details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8 space-y-2">
        <div className="w-12 h-12 rounded-xl bg-clinical-primary text-white mx-auto flex items-center justify-center shadow-clinical">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-clinical-text">
          Clinical Operations Authentication
        </h1>
        <p className="text-xs text-clinical-muted">
          Secure staff access for Nurse Dashboard &amp; Priority Triage Review Queue
        </p>
      </div>

      <Card className="shadow-clinical-md border-clinical-border/80">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-urgency-emergency flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Email or Username"
            placeholder="nurse@clintrace.demo"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            disabled={isLoading}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold py-3 min-h-[44px]"
            isLoading={isLoading}
          >
            <Lock className="w-4 h-4" /> Authenticate &amp; Access Console
          </Button>

          <div className="pt-3 border-t border-clinical-border text-center">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-clinical-primary hover:text-teal-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-fill Demo Staff Credentials
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

