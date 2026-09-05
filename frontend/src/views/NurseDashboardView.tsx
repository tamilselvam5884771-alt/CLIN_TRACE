import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  History,
  BookOpen,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  Building2,
  ShieldCheck,
  Search,
  X
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { UrgencyBadge, Badge } from '../components/ui/Badge';
import { StatusIndicator, LoadingSpinner } from '../components/ui/StatusIndicator';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { api } from '../api/client';
import { TriageNoteDetail, ClinicalRule } from '../types/api';

type NavTab = 'overview' | 'queue' | 'escalations' | 'history' | 'rules';

export const NurseDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<NavTab>('queue');
  const [allNotes, setAllNotes] = useState<TriageNoteDetail[]>([]);
  const [notes, setNotes] = useState<TriageNoteDetail[]>([]);
  const [rules, setRules] = useState<ClinicalRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filters
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  // Fetch Queue Data
  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      // Fetch unfiltered for summary metrics
      const rawData = await api.getTriageNotes();
      setAllNotes(rawData);

      // Fetch filtered queue
      const filteredData = await api.getTriageNotes({
        urgency: urgencyFilter || undefined,
        status: statusFilter || undefined,
        department: departmentFilter || undefined,
      });
      setNotes(filteredData);
    } catch (err: any) {
      // Redirect to login if unauthorized
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Clinical Rules
  const fetchRules = async () => {
    try {
      const data = await api.getRules();
      setRules(data);
    } catch (e) {
      // ignore rule fetch error
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [urgencyFilter, statusFilter, departmentFilter]);

  useEffect(() => {
    fetchRules();
  }, []);

  // Sync Nav Tabs with Filters
  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'overview' || tab === 'queue') {
      setUrgencyFilter('');
      setStatusFilter('');
    } else if (tab === 'escalations') {
      setStatusFilter('ESCALATED');
      setUrgencyFilter('');
    } else if (tab === 'history') {
      setStatusFilter('ROUTED');
      setUrgencyFilter('');
    } else if (tab === 'rules') {
      setIsRulesModalOpen(true);
    }
  };

  // Overview Counts Calculated from Full Dataset
  const totalIntakes = allNotes.length;
  const emergencyCount = allNotes.filter(n => n.urgency === 'Emergency').length;
  const urgentCount = allNotes.filter(n => n.urgency === 'Urgent').length;
  const escalatedCount = allNotes.filter(n => n.status === 'ESCALATED').length;

  // Filtered by Search Query
  const displayedNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.case_id.toString().includes(q) ||
      (n.patient_reported?.name || '').toLowerCase().includes(q) ||
      (n.patient_reported?.chief_complaint || '').toLowerCase().includes(q) ||
      (n.department || '').toLowerCase().includes(q) ||
      (n.rule_id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50 font-sans">
      {/* LEFT NAVIGATION SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 p-5 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2 pb-6 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-clinical-primary flex items-center justify-center font-bold text-white shadow-xs">
              CT
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wider uppercase text-white">CLINTRACE</h2>
              <p className="text-[10px] text-teal-400 font-medium">Operations Console</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5 text-xs font-semibold">
            <button
              onClick={() => handleNavClick('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeTab === 'overview'
                  ? 'bg-clinical-primary text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => handleNavClick('queue')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeTab === 'queue'
                  ? 'bg-clinical-primary text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4" />
                <span>Intake Queue</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-teal-300">
                {totalIntakes}
              </span>
            </button>

            <button
              onClick={() => handleNavClick('escalations')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeTab === 'escalations'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Escalations</span>
              </div>
              {escalatedCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
                  {escalatedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('history')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeTab === 'history'
                  ? 'bg-clinical-primary text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>

            <button
              onClick={() => handleNavClick('rules')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span>Clinical Rules</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                {rules.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Console Footer */}
        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Online
            </span>
          </div>
          <p className="text-[10px] text-slate-600">ClinTrace Clinical Governance v0.1</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Clinical Triage &amp; Operations Queue
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic priority routing. Cases sorted by arrival time and clinical urgency level.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchQueue} isLoading={isLoading}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
            </Button>
          </div>
        </div>

        {/* TODAY'S OVERVIEW METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: TOTAL INTAKES */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              TODAY'S INTAKES
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900">{totalIntakes}</span>
              <span className="text-xs text-slate-500 font-semibold">Cases</span>
            </div>
          </div>

          {/* Card 2: URGENT */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 block mb-1">
              URGENT CASES
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-700">{urgentCount}</span>
              <span className="text-xs text-amber-800 font-semibold font-mono">Priority 2</span>
            </div>
          </div>

          {/* Card 3: EMERGENCY */}
          <div className="p-4 bg-red-50/50 border border-red-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-800 block mb-1">
              EMERGENCY CASES
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-urgency-emergency">{emergencyCount}</span>
              <span className="text-xs text-red-800 font-bold uppercase tracking-wider">Immediate</span>
            </div>
          </div>

          {/* Card 4: ESCALATED */}
          <div className="p-4 bg-orange-50/50 border border-orange-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-900 block mb-1">
              ESCALATED TO STAFF
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-orange-700">{escalatedCount}</span>
              <span className="text-xs text-orange-800 font-semibold">Staff Review</span>
            </div>
          </div>
        </div>

        {/* FILTER BAR & SEARCH */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-slate-500 uppercase tracking-wider font-bold">
              <Filter className="w-3.5 h-3.5 text-clinical-primary" />
              <span>Filter Queue:</span>
            </div>

            {/* Urgency Filter */}
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-clinical-primary font-medium"
            >
              <option value="">All Urgencies</option>
              <option value="Emergency">Emergency</option>
              <option value="Urgent">Urgent</option>
              <option value="Standard">Standard</option>
              <option value="Non-Urgent">Non-Urgent</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-clinical-primary font-medium"
            >
              <option value="">All Statuses</option>
              <option value="ROUTED">ROUTED</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="NEEDS_FOLLOW_UP">NEEDS_FOLLOW_UP</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-clinical-primary font-medium"
            >
              <option value="">All Departments</option>
              <option value="Emergency Medicine">Emergency Medicine</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Pulmonology">Pulmonology</option>
              <option value="Gastroenterology">Gastroenterology</option>
            </select>

            {(urgencyFilter || statusFilter || departmentFilter) && (
              <button
                onClick={() => {
                  setUrgencyFilter('');
                  setStatusFilter('');
                  setDepartmentFilter('');
                }}
                className="text-[11px] text-clinical-primary font-bold hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-clinical-primary"
            />
          </div>
        </div>

        {/* PRIORITY QUEUE LIST */}
        {isLoading ? (
          <LoadingSpinner label="Loading priority clinical queue..." />
        ) : displayedNotes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Matching Intake Cases</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or submitting a new patient intake.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-extrabold tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3.5 px-4">Case ID</th>
                    <th className="py-3.5 px-4">Time</th>
                    <th className="py-3.5 px-4">Patient Name</th>
                    <th className="py-3.5 px-4">Primary Concern</th>
                    <th className="py-3.5 px-4">Urgency</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {displayedNotes.map((note) => (
                    <motion.tr
                      key={note.case_id}
                      whileHover={shouldReduceMotion ? {} : { backgroundColor: '#F8FAFC' }}
                      transition={{ duration: 0.15 }}
                      className="transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{note.case_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {note.patient_reported?.name || 'Anonymous'}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        "{note.patient_reported?.chief_complaint || 'No complaint details'}"
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <UrgencyBadge urgency={note.status === 'ESCALATED' ? null : note.urgency} />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-clinical-primary whitespace-nowrap">
                        {note.department ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{note.department}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusIndicator status={note.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/nurse/case/${note.case_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-clinical-primary-light/80 text-clinical-primary hover:bg-clinical-primary-light rounded-lg font-bold transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Case
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* CLINICAL RULES DRAWER / MODAL */}
      <Dialog
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        title="Active Deterministic Clinical Rules (rules.json)"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-xs text-slate-500">
            Below are the active, frozen Python clinical safety rules used to determine patient urgency and department routing.
          </p>
          {rules.map((rule) => (
            <div key={rule.rule_id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-clinical-primary/10 text-clinical-primary px-2 py-0.5 rounded">
                    {rule.rule_id}
                  </span>
                  <span className="font-bold text-xs text-slate-900">{rule.name}</span>
                </div>
                <UrgencyBadge urgency={rule.urgency} />
              </div>
              <p className="text-xs text-slate-600">{rule.description}</p>
              <div className="pt-1 text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                Department: {rule.department} | Priority: {rule.priority}
              </div>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
};

