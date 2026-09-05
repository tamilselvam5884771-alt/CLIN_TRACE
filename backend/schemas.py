from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

# Health check response schema
class HealthCheckResponse(BaseModel):
    status: str
    database: str
    service: str
    version: str
    timestamp: datetime

# Authentication Schemas
class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: UserResponse

# Patient Schemas
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None
    medical_history_summary: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Message Schemas
class MessageBase(BaseModel):
    session_id: int
    sender: str
    content: str

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Extraction Schemas
class ExtractionFact(BaseModel):
    symptom: str
    severity: Optional[str] = None
    duration_days: Optional[int] = None
    additional_context: Optional[str] = None

class ExtractionCreate(ExtractionFact):
    session_id: int

class ExtractionResponse(ExtractionFact):
    id: int
    session_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Triage Engine Models
class TriageInput(BaseModel):
    extractions: List[ExtractionFact] = []
    confidence_score: float = 1.0
    has_contradiction: bool = False
    has_missing_info: bool = False
    missing_info_reason: Optional[str] = None

class TriageResult(BaseModel):
    status: str  # "ROUTED" or "ESCALATED"
    urgency: Optional[str] = None
    department: Optional[str] = None
    rule_id: Optional[str] = None
    rule_name: Optional[str] = None
    reason: str
    matched_facts: List[dict] = []

    model_config = ConfigDict(from_attributes=True)

# Intake Workflow API Models
class IntakeRequest(BaseModel):
    patient_name: str
    description: str

class FollowupRequest(BaseModel):
    answer: str

class IntakeWorkflowResponse(BaseModel):
    session_id: int
    status: str  # "ROUTED", "NEEDS_FOLLOW_UP", "ESCALATED"
    urgency: Optional[str] = None
    department: Optional[str] = None
    rule_id: Optional[str] = None
    rule_name: Optional[str] = None
    reason: Optional[str] = None
    follow_up_questions: Optional[List[str]] = None
    extractions: List[ExtractionFact] = []
    triage_note_id: Optional[int] = None

# Triage Note Schemas & Dashboard Payload
class TriageNoteDetailResponse(BaseModel):
    case_id: int
    created_at: datetime
    urgency: Optional[str] = None
    department: Optional[str] = None
    status: str
    rule_id: Optional[str] = None
    rule_name: Optional[str] = None
    exact_rule_reason: Optional[str] = None
    patient_reported: Dict[str, Any]
    established_information: List[Dict[str, Any]]
    unknown_information: Optional[str] = None
    contradictions: Optional[str] = None
    intake_summary: Optional[str] = None
    escalation_reason: Optional[str] = None
    conversation_history: List[Dict[str, Any]]

class EscalateRequest(BaseModel):
    reason: str
