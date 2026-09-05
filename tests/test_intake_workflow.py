import pytest

def test_simple_intake_emergency_chest_pain(client):
    payload = {
        "patient_name": "Alice Johnson",
        "description": "I have been suffering from severe crushing chest pain since morning."
    }
    response = client.post("/api/intake", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "ROUTED"
    assert data["urgency"] == "Emergency"
    assert data["department"] == "Emergency Medicine"
    assert data["rule_id"] == "CHEST-01"
    assert data["triage_note_id"] is not None


def test_followup_intake_workflow(client):
    # 1. Initial vague intake
    init_res = client.post("/api/intake", json={"patient_name": "Bob Marley", "description": "stomach"})
    assert init_res.status_code == 201
    init_data = init_res.json()

    assert init_data["status"] == "NEEDS_FOLLOW_UP"
    session_id = init_data["session_id"]
    assert len(init_data["follow_up_questions"]) > 0

    # 2. Provide follow-up answer
    followup_res = client.post(
        f"/api/intake/{session_id}/followup",
        json={"answer": "I have severe stomach pain for 1 day."}
    )
    assert followup_res.status_code == 200
    followup_data = followup_res.json()

    assert followup_data["status"] == "ROUTED"
    assert followup_data["urgency"] == "Emergency"
    assert followup_data["department"] == "Emergency Medicine"
    assert followup_data["rule_id"] == "ABD-01"


def test_urgent_routing_persistent_fever(client):
    payload = {
        "patient_name": "Charlie Brown",
        "description": "I have high fever lasting for 4 days."
    }
    response = client.post("/api/intake", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "ROUTED"
    assert data["urgency"] == "Urgent"
    assert data["department"] == "General Medicine"
    assert data["rule_id"] == "FEVER-02"


def test_contradiction_escalation(client):
    payload = {
        "patient_name": "Diana Prince",
        "description": "I feel fine and have no pain at all, but I am in severe crushing pain."
    }
    response = client.post("/api/intake", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "ESCALATED"
    assert "Contradictory" in data["reason"]


def test_manual_escalation(client):
    # 1. Create a routed intake
    payload = {
        "patient_name": "Edward Elric",
        "description": "I have had a mild sore throat for 1 day."

    }
    init_res = client.post("/api/intake", json=payload)
    triage_note_id = init_res.json()["triage_note_id"]

    # 2. Perform manual escalation
    esc_res = client.post(
        f"/api/triage-notes/{triage_note_id}/escalate",
        json={"reason": "Clinician observed pale skin and diaphoresis upon arrival."}
    )
    assert esc_res.status_code == 200
    esc_data = esc_res.json()

    assert esc_data["status"] == "ESCALATED"
    assert "MANUALLY ESCALATED" in esc_data["exact_rule_reason"]


def test_triage_note_retrieval_and_filtering(client):
    # Create emergency case
    client.post("/api/intake", json={"patient_name": "Frank Castle", "description": "Severe chest pain"})
    # Create non-urgent case
    client.post("/api/intake", json={"patient_name": "Grace Hopper", "description": "Minor cut injury on finger"})

    # 1. Get all triage notes
    all_notes = client.get("/api/triage-notes").json()
    assert len(all_notes) >= 2

    # 2. Filter by urgency=Emergency
    emergency_notes = client.get("/api/triage-notes?urgency=Emergency").json()
    assert len(emergency_notes) >= 1
    assert all(n["urgency"] == "Emergency" for n in emergency_notes)

    # 3. Get single triage note detail
    single_note = client.get(f"/api/triage-notes/{all_notes[0]['case_id']}").json()
    assert "case_id" in single_note
    assert "established_information" in single_note
    assert "conversation_history" in single_note


def test_get_rules_endpoint(client):
    response = client.get("/api/rules")
    assert response.status_code == 200
    rules = response.json()
    assert len(rules) >= 5
    rule_ids = [r["rule_id"] for r in rules]
    assert "CHEST-01" in rule_ids
    assert "FEVER-02" in rule_ids
