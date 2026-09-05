export type UrgencyLevel = 'Emergency' | 'Urgent' | 'Standard' | 'Non-Urgent';
export type CaseStatus = 'ROUTED' | 'ESCALATED' | 'NEEDS_FOLLOW_UP';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'nurse' | 'doctor' | 'staff' | 'admin';
  created_at: string;
  updated_at: string;
}


export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  user: User;
}

export interface ExtractionFact {
  symptom: string;
  severity?: string | null;
  duration_days?: number | null;
  additional_context?: string | null;
}

export interface IntakeRequest {
  patient_name: string;
  description: string;
}

export interface FollowupRequest {
  answer: string;
}

export interface IntakeWorkflowResponse {
  session_id: number;
  status: CaseStatus;
  urgency?: UrgencyLevel | null;
  department?: string | null;
  rule_id?: string | null;
  rule_name?: string | null;
  reason?: string | null;
  follow_up_questions?: string[] | null;
  extractions: ExtractionFact[];
  triage_note_id?: number | null;
}

export interface TriageNoteDetail {
  case_id: number;
  created_at: string;
  urgency?: UrgencyLevel | null;
  department?: string | null;
  status: CaseStatus;
  rule_id?: string | null;
  rule_name?: string | null;
  exact_rule_reason?: string | null;
  patient_reported: {
    patient_id?: number | null;
    name: string;
    chief_complaint?: string | null;
  };
  established_information: Array<{
    symptom: string;
    severity?: string | null;
    duration?: string | null;
    additional_context?: string | null;
  }>;
  unknown_information?: string | null;
  contradictions?: string | null;
  intake_summary?: string | null;
  escalation_reason?: string | null;
  conversation_history: Array<{
    id: number;
    sender: 'patient' | 'assistant' | 'system' | 'clinician';
    content: string;
    timestamp: string;
  }>;
}

export interface EscalateRequest {
  reason: string;
}

export interface ClinicalRule {
  rule_id: string;
  name: string;
  description: string;
  priority: number;
  urgency: UrgencyLevel;
  department: string;
  conditions: Record<string, any>;
  reason: string;
}
