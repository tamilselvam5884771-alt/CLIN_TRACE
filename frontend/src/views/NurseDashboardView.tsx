import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, Eye, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { UrgencyBadge, Badge } from '../components/ui/Badge';
import { StatusIndicator, LoadingSpinner } from '../components/ui/StatusIndicator';
import { Button } from '../components/ui/Button';
import { api } from '../api/client';
import { TriageNoteDetail } from '../types/api';

export const NurseDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<TriageNoteDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTriageNotes({
        urgency: urgencyFilter || undefined,
        status: statusFilter || undefined,
      });
      setNotes(data);
    } catch (err) {
      // If unauthorized, redirect to login
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [urgencyFilter, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-clinical-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-clinical-text">
              Nurse Operations Dashboard
            </h1>
            <Badge variant="primary">LIVE QUEUE</Badge>
          </div>
          <p className="text-xs text-clinical-muted mt-1">
            Real-time triage queue sorted by newest arrival. Filter by clinical urgency level or status.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchQueue} isLoading={isLoading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-clinical-border rounded-xl p-4 mb-6 shadow-clinical flex flex-wrap items-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-1.5 text-clinical-muted uppercase tracking-wider font-bold">
          <Filter className="w-3.5 h-3.5 text-clinical-primary" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-clinical-muted">Urgency:</label>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-clinical-bg border border-clinical-border rounded-md text-clinical-text focus:outline-none focus:ring-1 focus:ring-clinical-primary"
          >
            <option value="">All Urgencies</option>
            <option value="Emergency">Emergency</option>
            <option value="Urgent">Urgent</option>
            <option value="Standard">Standard</option>
            <option value="Non-Urgent">Non-Urgent</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-clinical-muted">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-clinical-bg border border-clinical-border rounded-md text-clinical-text focus:outline-none focus:ring-1 focus:ring-clinical-primary"
          >
            <option value="">All Statuses</option>
            <option value="ROUTED">ROUTED</option>
            <option value="ESCALATED">ESCALATED</option>
            <option value="NEEDS_FOLLOW_UP">NEEDS_FOLLOW_UP</option>
          </select>
        </div>
      </div>

      {/* Case Table */}
      {isLoading ? (
        <LoadingSpinner label="Loading live nurse queue..." />
      ) : notes.length === 0 ? (
        <div className="bg-white border border-clinical-border rounded-xl p-12 text-center">
          <ShieldCheck className="w-8 h-8 text-clinical-muted mx-auto mb-2" />
          <h3 className="text-sm font-bold text-clinical-text">No Matching Cases Found</h3>
          <p className="text-xs text-clinical-muted mt-1">Adjust filters or submit a new intake case.</p>
        </div>
      ) : (
        <div className="bg-white border border-clinical-border rounded-xl shadow-clinical overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-clinical-bg/60 border-b border-clinical-border uppercase font-bold tracking-wider text-clinical-muted">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Assigned Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Matched Rule</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clinical-border font-medium text-clinical-text">
                {notes.map((note) => (
                  <tr key={note.case_id} className="hover:bg-clinical-bg/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold">#{note.case_id}</td>
                    <td className="py-3 px-4 font-bold">{note.patient_reported?.name || 'Anonymous'}</td>
                    <td className="py-3 px-4">
                      <UrgencyBadge urgency={note.urgency} />
                    </td>
                    <td className="py-3 px-4 font-semibold text-clinical-primary">
                      {note.department || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusIndicator status={note.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-clinical-muted">
                      {note.rule_id ? `${note.rule_id}` : 'None'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/nurse/case/${note.case_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-clinical-primary-light/60 text-clinical-primary hover:bg-clinical-primary-light rounded font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Case
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
