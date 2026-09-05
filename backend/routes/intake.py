from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models import Patient, IntakeSession, Message, Extraction, TriageNote
from backend.schemas import (
    IntakeRequest,
    FollowupRequest,
    IntakeWorkflowResponse,
    TriageInput,
    ExtractionFact
)
from backend.services.gemini_service import gemini_service
from backend.services.triage_engine import TriageEngine

router = APIRouter(prefix="/api/intake", tags=["Intake Workflow"])
triage_engine = TriageEngine()


@router.post("", response_model=IntakeWorkflowResponse, status_code=status.HTTP_201_CREATED)
def start_intake(payload: IntakeRequest, db: Session = Depends(get_db)):
    """
    Initial Patient Intake Endpoint.
    Receives patient name and chief complaint description.
    Invokes Gemini extraction, determines missing details/follow-ups, or evaluates deterministic triage rule engine.
    """
    if not payload.patient_name or not payload.description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="patient_name and description are required."
        )

    # 1. Find or create patient
    name_parts = payload.patient_name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else "Unknown"

    patient = db.query(Patient).filter(
        Patient.first_name == first_name, Patient.last_name == last_name
    ).first()

    if not patient:
        patient = Patient(first_name=first_name, last_name=last_name)
        db.add(patient)
        db.commit()
        db.refresh(patient)

    # 2. Create intake session
    session = IntakeSession(
        patient_id=patient.id,
        status="active",
        chief_complaint=payload.description
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 3. Store initial message
    msg = Message(
        session_id=session.id,
        sender="patient",
        content=payload.description
    )
    db.add(msg)
    db.commit()

    # 4. Call Gemini clinical extraction service
    extracted_data = gemini_service.extract_clinical_info(payload.description)
    extractions: List[ExtractionFact] = extracted_data.get("extractions", [])

    # Save extractions to database
    for fact in extractions:
        db_ext = Extraction(
            session_id=session.id,
            extracted_symptom=fact.symptom,
            severity=fact.severity,
            duration=f"{fact.duration_days} days" if fact.duration_days is not None else None,
            additional_context=fact.additional_context
        )
        db.add(db_ext)
    db.commit()

    # 5. Check if follow-up question is required (Limit follow-ups to prevent infinite loops)
    has_missing_info = extracted_data.get("has_missing_info", False)
    follow_up_qs = extracted_data.get("follow_up_questions", [])

    if has_missing_info and follow_up_qs:
        session.status = "needs_followup"
        db.commit()

        # Save assistant message asking follow up
        assistant_msg = Message(
            session_id=session.id,
            sender="assistant",
            content=follow_up_qs[0]
        )
        db.add(assistant_msg)
        db.commit()

        return IntakeWorkflowResponse(
            session_id=session.id,
            status="NEEDS_FOLLOW_UP",
            follow_up_questions=follow_up_qs,
            extractions=extractions
        )

    # 6. Run Deterministic Python Triage Engine
    triage_input = TriageInput(
        extractions=extractions,
        confidence_score=extracted_data.get("confidence_score", 1.0),
        has_contradiction=extracted_data.get("has_contradiction", False),
        has_missing_info=has_missing_info,
        missing_info_reason=extracted_data.get("missing_info_reason")
    )
    triage_res = triage_engine.evaluate(triage_input)

    # 7. Persist TriageNote
    session.status = triage_res.status.lower()
    db.commit()

    triage_note = TriageNote(
        session_id=session.id,
        priority_level=triage_res.urgency,
        summary=f"Chief complaint: {payload.description}",
        reasoning=triage_res.reason,
        recommended_action=f"Route to {triage_res.department}" if triage_res.department else "Escalate to duty clinician"
    )
    db.add(triage_note)
    db.commit()
    db.refresh(triage_note)

    return IntakeWorkflowResponse(
        session_id=session.id,
        status=triage_res.status,
        urgency=triage_res.urgency,
        department=triage_res.department,
        rule_id=triage_res.rule_id,
        rule_name=triage_res.rule_name,
        reason=triage_res.reason,
        extractions=extractions,
        triage_note_id=triage_note.id
    )


@router.post("/{session_id}/followup", response_model=IntakeWorkflowResponse)
def submit_followup(session_id: int, payload: FollowupRequest, db: Session = Depends(get_db)):
    """
    Submits follow-up answer to an active intake session.
    Merges clinical information, checks for contradictions or missing info, and runs deterministic triage engine.
    """
    session = db.query(IntakeSession).filter(IntakeSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Intake session {session_id} not found."
        )

    # Save patient follow-up answer message
    msg = Message(
        session_id=session.id,
        sender="patient",
        content=payload.answer
    )
    db.add(msg)
    db.commit()

    # Get full conversation history text
    messages = db.query(Message).filter(Message.session_id == session.id).order_by(Message.created_at.asc()).all()
    full_context = " ".join([m.content for m in messages if m.sender == "patient"])

    # Extract merged clinical info using Gemini service
    extracted_data = gemini_service.extract_clinical_info(full_context)
    extractions: List[ExtractionFact] = extracted_data.get("extractions", [])

    # Count previous follow up attempts
    patient_messages = [m for m in messages if m.sender == "patient"]
    followup_attempts = len(patient_messages) - 1

    has_missing_info = extracted_data.get("has_missing_info", False)
    follow_up_qs = extracted_data.get("follow_up_questions", [])

    # Ask next follow-up ONLY if missing info persists AND under max limits (max 2 follow-ups)
    if has_missing_info and follow_up_qs and followup_attempts < 2:
        session.status = "needs_followup"
        db.commit()

        assistant_msg = Message(
            session_id=session.id,
            sender="assistant",
            content=follow_up_qs[0]
        )
        db.add(assistant_msg)
        db.commit()

        return IntakeWorkflowResponse(
            session_id=session.id,
            status="NEEDS_FOLLOW_UP",
            follow_up_questions=follow_up_qs,
            extractions=extractions
        )

    # Evaluate deterministic rule engine
    triage_input = TriageInput(
        extractions=extractions,
        confidence_score=extracted_data.get("confidence_score", 1.0),
        has_contradiction=extracted_data.get("has_contradiction", False),
        has_missing_info=has_missing_info if followup_attempts < 2 else False,  # Force evaluation after max attempts
        missing_info_reason=extracted_data.get("missing_info_reason")
    )
    triage_res = triage_engine.evaluate(triage_input)

    session.status = triage_res.status.lower()
    db.commit()

    # Create or update TriageNote
    triage_note = db.query(TriageNote).filter(TriageNote.session_id == session.id).first()
    if not triage_note:
        triage_note = TriageNote(
            session_id=session.id,
            priority_level=triage_res.urgency,
            summary=f"Chief complaint & follow-up answers: {full_context[:200]}...",
            reasoning=triage_res.reason,
            recommended_action=f"Route to {triage_res.department}" if triage_res.department else "Escalate to duty clinician"
        )
        db.add(triage_note)
    else:
        triage_note.priority_level = triage_res.urgency
        triage_note.reasoning = triage_res.reason
        triage_note.recommended_action = f"Route to {triage_res.department}" if triage_res.department else "Escalate to duty clinician"

    db.commit()
    db.refresh(triage_note)

    return IntakeWorkflowResponse(
        session_id=session.id,
        status=triage_res.status,
        urgency=triage_res.urgency,
        department=triage_res.department,
        rule_id=triage_res.rule_id,
        rule_name=triage_res.rule_name,
        reason=triage_res.reason,
        extractions=extractions,
        triage_note_id=triage_note.id
    )
