import pytest
from backend.services.triage_engine import TriageEngine
from backend.schemas import TriageInput, ExtractionFact


@pytest.fixture
def engine():
    return TriageEngine()


def test_severe_chest_pain(engine):
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="Severe chest pain", severity="severe", duration_days=1)
        ],
        confidence_score=0.95
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ROUTED"
    assert result.rule_id == "CHEST-01"
    assert result.rule_name == "Severe Chest Pain"
    assert result.urgency == "Emergency"
    assert result.department == "Emergency Medicine"
    assert "CHEST-01" in result.reason
    assert len(result.matched_facts) == 1


def test_severe_breathing_difficulty(engine):
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="Shortness of breath", severity="severe", duration_days=1)
        ],
        confidence_score=0.92
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ROUTED"
    assert result.rule_id == "BREATH-01"
    assert result.rule_name == "Severe Breathing Difficulty"
    assert result.urgency == "Emergency"
    assert result.department == "Emergency Medicine"


def test_severe_injury(engine):
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="Trauma / Head Injury", severity="severe", duration_days=1)
        ],
        confidence_score=0.90
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ROUTED"
    assert result.rule_id == "INJURY-01"
    assert result.rule_name == "Severe Injury"
    assert result.urgency == "Emergency"
    assert result.department == "Emergency Medicine"


def test_persistent_fever(engine):
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="High fever", severity="moderate", duration_days=4)
        ],
        confidence_score=0.88
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ROUTED"
    assert result.rule_id == "FEVER-02"
    assert result.rule_name == "Persistent Fever"
    assert result.urgency == "Urgent"
    assert result.department == "General Medicine"
    assert "4 days" in result.reason


def test_severe_abdominal_pain(engine):
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="Abdominal pain", severity="severe", duration_days=1)
        ],
        confidence_score=0.91
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ROUTED"
    assert result.rule_id == "ABD-01"
    assert result.rule_name == "Severe Abdominal Pain"
    assert result.urgency == "Emergency"
    assert result.department == "Emergency Medicine"


def test_standard_case_recent_fever(engine):
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="Fever", severity="moderate", duration_days=1)
        ],
        confidence_score=0.85
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ROUTED"
    assert result.rule_id == "FEVER-01"
    assert result.urgency == "Standard"
    assert result.department == "General Medicine"


def test_non_urgent_case_minor_injury(engine):
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="Minor cut / injury", severity="mild", duration_days=1)
        ],
        confidence_score=0.90
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ROUTED"
    assert result.rule_id == "INJURY-02"
    assert result.urgency == "Non-Urgent"
    assert result.department == "Outpatient Clinic"


def test_missing_information_escalated(engine):
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="Chest pain")
        ],
        has_missing_info=True,
        missing_info_reason="Severity and onset time not provided by patient.",
        confidence_score=0.90
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ESCALATED"
    assert result.rule_id is None
    assert result.urgency is None
    assert "Insufficient information" in result.reason


def test_contradictory_information_escalated(engine):
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="No pain reported"),
            ExtractionFact(symptom="Severe chest pain", severity="severe")
        ],
        has_contradiction=True,
        confidence_score=0.90
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ESCALATED"
    assert result.rule_id is None
    assert "Contradictory" in result.reason


def test_low_confidence_escalated(engine):
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="Chest pain", severity="severe")
        ],
        confidence_score=0.50  # Below 0.70 threshold
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ESCALATED"
    assert result.rule_id is None
    assert "confidence score" in result.reason


def test_multiple_matching_rules_priority_precedence(engine):
    # Patient presents with both persistent fever (Urgent, Priority 60) AND severe chest pain (Emergency, Priority 100)
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="Fever", severity="moderate", duration_days=4),
            ExtractionFact(symptom="Severe chest pain", severity="severe", duration_days=1)
        ],
        confidence_score=0.95
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ROUTED"
    assert result.rule_id == "CHEST-01"
    assert result.urgency == "Emergency"
    assert result.department == "Emergency Medicine"


def test_unknown_unmatched_case_escalated(engine):
    triage_input = TriageInput(
        extractions=[
            ExtractionFact(symptom="Rare unexplained skin tingling", severity="mild", duration_days=30)
        ],
        confidence_score=0.85
    )
    result = engine.evaluate(triage_input)

    assert result.status == "ESCALATED"
    assert result.rule_id is None
    assert "No deterministic clinical rule matched" in result.reason
