from backend.models import User, Patient, IntakeSession, Message, Extraction, TriageNote

def test_create_user(db_session):
    user = User(
        username="dr_smith",
        email="smith@clinic.org",
        role="clinician"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.username == "dr_smith"
    assert user.email == "smith@clinic.org"
    assert user.role == "clinician"
    assert user.created_at is not None

def test_create_patient(db_session):
    patient = Patient(
        first_name="Jane",
        last_name="Doe",
        date_of_birth="1985-04-12",
        gender="female",
        contact_number="+15550199",
        medical_history_summary="Asthma, hypertension"
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)

    assert patient.id is not None
    assert patient.first_name == "Jane"
    assert patient.last_name == "Doe"
    assert patient.created_at is not None

def test_create_intake_session_and_related_models(db_session):
    # 1. Create Patient & User
    user = User(username="staff_alex", email="alex@clinic.org", role="staff")
    patient = Patient(first_name="John", last_name="Smith", date_of_birth="1990-01-01")
    db_session.add_all([user, patient])
    db_session.commit()

    # 2. Create IntakeSession
    session = IntakeSession(
        patient_id=patient.id,
        user_id=user.id,
        status="active",
        chief_complaint="Severe chest pain and shortness of breath"
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    assert session.id is not None
    assert session.patient.first_name == "John"
    assert session.user.username == "staff_alex"

    # 3. Add Message
    msg = Message(
        session_id=session.id,
        sender="patient",
        content="I have been experiencing sharp chest pain since this morning."
    )
    db_session.add(msg)
    db_session.commit()

    # 4. Add Extraction
    ext = Extraction(
        session_id=session.id,
        extracted_symptom="Chest Pain",
        severity="8/10",
        duration="4 hours",
        additional_context="Radiating to left shoulder"
    )
    db_session.add(ext)
    db_session.commit()

    # 5. Add TriageNote
    note = TriageNote(
        session_id=session.id,
        priority_level="Emergency",
        summary="Patient exhibits symptoms indicative of possible acute coronary syndrome.",
        reasoning="Severe radiating chest pain with acute onset.",
        recommended_action="Immediate transfer to ER / Triage Room 1"
    )
    db_session.add(note)
    db_session.commit()

    # Refresh session to check relationships
    db_session.refresh(session)
    assert len(session.messages) == 1
    assert session.messages[0].content == "I have been experiencing sharp chest pain since this morning."
    assert len(session.extractions) == 1
    assert session.extractions[0].extracted_symptom == "Chest Pain"
    assert len(session.triage_notes) == 1
    assert session.triage_notes[0].priority_level == "Emergency"
