from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
import json
from pathlib import Path

from backend.database import get_db
from backend.models import TriageNote, IntakeSession, Patient, Message, Extraction
from backend.schemas import TriageNoteDetailResponse, EscalateRequest
from backend.services.triage_engine import RULES_FILE_PATH

router = APIRouter(prefix="/api", tags=["Triage Notes & Nurse Queue"])


@router.get("/rules")
def get_all_rules():
    """
    Returns all active deterministic clinical rules from data/rules.json.
    """
    if not RULES_FILE_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rules storage file rules.json not found."
        )
    with open(RULES_FILE_PATH, "r", encoding="utf-8") as f:
        rules = json.load(f)
    return rules


@router.get("/triage-notes", response_model=List[TriageNoteDetailResponse])
def list_triage_notes(
    urgency: Optional[str] = Query(None, description="Filter by urgency level (Emergency, Urgent, Standard, Non-Urgent)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (ROUTED, ESCALATED, NEEDS_FOLLOW_UP)"),
    department: Optional[str] = Query(None, description="Filter by clinical department"),
    db: Session = Depends(get_db)
):
    """
    Nurse Dashboard Queue Endpoint.
    Lists triage notes sorted newest first with optional filters for urgency, status, and department.
    """
    query = db.query(TriageNote).join(IntakeSession, TriageNote.session_id == IntakeSession.id)

    if urgency:
        query = query.filter(TriageNote.priority_level == urgency)
    if status_filter:
        query = query.filter(IntakeSession.status == status_filter.lower())
    if department:
        query = query.filter(TriageNote.recommended_action.contains(department))

    notes = query.order_by(TriageNote.created_at.desc()).all()

    results = []
    for note in notes:
        results.append(_format_triage_note_detail(note, db))
    return results


@router.get("/triage-notes/{note_id}", response_model=TriageNoteDetailResponse)
def get_triage_note_detail(note_id: int, db: Session = Depends(get_db)):
    """
    Retrieves full detailed case view for a single triage note.
    """
    note = db.query(TriageNote).filter(TriageNote.id == note_id).first()
    if not note:
        # Fallback check if passed ID is session_id
        note = db.query(TriageNote).filter(TriageNote.session_id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Triage note {note_id} not found."
        )

    return _format_triage_note_detail(note, db)


@router.post("/triage-notes/{note_id}/escalate", response_model=TriageNoteDetailResponse)
def manual_escalate_triage_note(note_id: int, payload: EscalateRequest, db: Session = Depends(get_db)):
    """
    Manual Escalation Endpoint.
    Allows a nurse or clinician to manually escalate a triage note with an explicit escalation reason.
    """
    note = db.query(TriageNote).filter(TriageNote.id == note_id).first()
    if not note:
        note = db.query(TriageNote).filter(TriageNote.session_id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Triage note {note_id} not found."
        )

    session = db.query(IntakeSession).filter(IntakeSession.id == note.session_id).first()
    if session:
        session.status = "escalated"

    note.reasoning = f"MANUALLY ESCALATED: {payload.reason} (Previous reasoning: {note.reasoning})"
    db.commit()
    db.refresh(note)

    return _format_triage_note_detail(note, db)


def _format_triage_note_detail(note: TriageNote, db: Session) -> TriageNoteDetailResponse:
    """Helper method to format DB models into complete TriageNoteDetailResponse contract."""
    session = db.query(IntakeSession).filter(IntakeSession.id == note.session_id).first()
    patient = db.query(Patient).filter(Patient.id == session.patient_id).first() if session else None
    messages = db.query(Message).filter(Message.session_id == note.session_id).order_by(Message.created_at.asc()).all() if session else []
    extractions = db.query(Extraction).filter(Extraction.session_id == note.session_id).all() if session else []

    # Extract rule_id and rule_name if present in reasoning string
    rule_id = None
    rule_name = None
    if note.reasoning and "Rule [" in note.reasoning:
        try:
            rule_part = note.reasoning.split("Rule [")[1].split("]")[0]
            if " - " in rule_part:
                rule_id, rule_name = rule_part.split(" - ", 1)
            else:
                rule_id = rule_part
        except Exception:
            pass

    # Extract department from recommended_action
    department = None
    if note.recommended_action and "Route to " in note.recommended_action:
        department = note.recommended_action.replace("Route to ", "").strip()

    established_info = [
        {
            "symptom": ext.extracted_symptom,
            "severity": ext.severity,
            "duration": ext.duration,
            "additional_context": ext.additional_context
        }
        for ext in extractions
    ]

    conv_history = [
        {
            "id": m.id,
            "sender": m.sender,
            "content": m.content,
            "timestamp": m.created_at.isoformat()
        }
        for m in messages
    ]

    patient_reported_dict = {
        "patient_id": patient.id if patient else None,
        "name": f"{patient.first_name} {patient.last_name}" if patient else "Anonymous",
        "chief_complaint": session.chief_complaint if session else None
    }

    status_str = session.status.upper() if session else "UNKNOWN"

    return TriageNoteDetailResponse(
        case_id=note.id,
        created_at=note.created_at,
        urgency=note.priority_level,
        department=department,
        status=status_str,
        rule_id=rule_id,
        rule_name=rule_name,
        exact_rule_reason=note.reasoning,
        patient_reported=patient_reported_dict,
        established_information=established_info,
        unknown_information="None identified" if status_str == "ROUTED" else "Incomplete details or manual escalation",
        contradictions="None detected",
        intake_summary=note.summary,
        escalation_reason=note.reasoning if status_str == "ESCALATED" else None,
        conversation_history=conv_history
    )
