from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr

# Health check response schema
class HealthCheckResponse(BaseModel):
    status: str
    database: str
    service: str
    version: str
    timestamp: datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str
    role: str = "staff"

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

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

# IntakeSession Schemas
class IntakeSessionBase(BaseModel):
    patient_id: int
    user_id: Optional[int] = None
    status: str = "active"
    chief_complaint: Optional[str] = None

class IntakeSessionCreate(IntakeSessionBase):
    pass

class IntakeSessionResponse(IntakeSessionBase):
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
class ExtractionBase(BaseModel):
    session_id: int
    extracted_symptom: str
    severity: Optional[str] = None
    duration: Optional[str] = None
    additional_context: Optional[str] = None

class ExtractionCreate(ExtractionBase):
    pass

class ExtractionResponse(ExtractionBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Triage Note Schemas
class TriageNoteBase(BaseModel):
    session_id: int
    priority_level: Optional[str] = None
    summary: Optional[str] = None
    reasoning: Optional[str] = None
    recommended_action: Optional[str] = None

class TriageNoteCreate(TriageNoteBase):
    pass

class TriageNoteResponse(TriageNoteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Deterministic Triage Engine Schemas
class ExtractionFact(BaseModel):
    symptom: str
    severity: Optional[str] = None
    duration_days: Optional[int] = None
    additional_context: Optional[str] = None

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

