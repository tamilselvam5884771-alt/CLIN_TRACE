from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="staff")
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    intake_sessions = relationship("IntakeSession", back_populates="user", cascade="all, delete-orphan")



class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    contact_number = Column(String(50), nullable=True)
    medical_history_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    intake_sessions = relationship("IntakeSession", back_populates="patient", cascade="all, delete-orphan")


class IntakeSession(Base):
    __tablename__ = "intake_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), nullable=False, default="active")
    chief_complaint = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    patient = relationship("Patient", back_populates="intake_sessions")
    user = relationship("User", back_populates="intake_sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    extractions = relationship("Extraction", back_populates="session", cascade="all, delete-orphan")
    triage_notes = relationship("TriageNote", back_populates="session", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("intake_sessions.id"), nullable=False)
    sender = Column(String(50), nullable=False)  # 'patient', 'assistant', 'system', 'clinician'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    session = relationship("IntakeSession", back_populates="messages")


class Extraction(Base):
    __tablename__ = "extractions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("intake_sessions.id"), nullable=False)
    extracted_symptom = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=True)
    duration = Column(String(100), nullable=True)
    additional_context = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    session = relationship("IntakeSession", back_populates="extractions")


class TriageNote(Base):
    __tablename__ = "triage_notes"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("intake_sessions.id"), nullable=False)
    priority_level = Column(String(50), nullable=True)  # 'Emergency', 'Urgent', 'Non-Urgent'
    summary = Column(Text, nullable=True)
    reasoning = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    session = relationship("IntakeSession", back_populates="triage_notes")

