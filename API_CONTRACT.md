# ClinTrace API Contract & Specification (Phase 4 Freeze)

This document specifies the frozen REST API contract for **ClinTrace**. The React frontend (Phase 5+) integrates exclusively with the endpoints documented below.

Base URL: `http://localhost:8000`

---

## Table of Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health & DB connection status check | No |
| `GET` | `/api/rules` | List all active deterministic clinical rules | No |
| `POST` | `/api/auth/login` | Local authentication login | No |
| `POST` | `/api/auth/logout` | Local session logout | No |
| `GET` | `/api/auth/me` | Fetch authenticated user details | Yes (Bearer) |
| `POST` | `/api/intake` | Submit initial patient intake complaint | No |
| `POST` | `/api/intake/{id}/followup` | Submit follow-up response to active intake | No |
| `GET` | `/api/triage-notes` | Nurse Queue / Dashboard case listing (with filters) | No / Optional |
| `GET` | `/api/triage-notes/{id}` | Fetch full detailed case view for a single triage note | No / Optional |
| `POST` | `/api/triage-notes/{id}/escalate` | Manually escalate a triage note | Yes (Bearer) |

---

## Endpoint Details & JSON Payloads

### 1. `GET /api/health`
Checks API service and SQLite database connection health.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected",
  "service": "ClinTrace Backend API",
  "version": "0.1.0",
  "timestamp": "2026-09-05T05:50:17.719727Z"
}
```

---

### 2. `GET /api/rules`
Returns all deterministic clinical rules defined in `data/rules.json`.

**Response (200 OK):**
```json
[
  {
    "rule_id": "CHEST-01",
    "name": "Severe Chest Pain",
    "description": "Chest pain marked as severe or acute",
    "priority": 100,
    "urgency": "Emergency",
    "department": "Emergency Medicine",
    "conditions": {
      "symptoms": ["chest pain", "chest tightness", "angina"],
      "severity_levels": ["severe", "critical", "extreme", "high", "8/10", "9/10", "10/10"]
    },
    "reason": "Severe chest pain reported, indicating potential acute cardiac or pulmonary emergency."
  }
]
```

---

### 3. `POST /api/auth/login`
Authenticates a user using seeded demo credentials.

**Request Body:**
```json
{
  "username_or_email": "nurse@clintrace.demo",
  "password": "demo123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "nurse_demo",
    "email": "nurse@clintrace.demo",
    "role": "nurse",
    "created_at": "2026-09-05T11:38:00Z",
    "updated_at": "2026-09-05T11:38:00Z"
  }
}
```

---

### 4. `GET /api/auth/me`
Fetches current authenticated user info.

**Headers:**
`Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "nurse_demo",
  "email": "nurse@clintrace.demo",
  "role": "nurse",
  "created_at": "2026-09-05T11:38:00Z",
  "updated_at": "2026-09-05T11:38:00Z"
}
```

---

### 5. `POST /api/intake`
Submits initial patient complaint. Performs Gemini extraction and deterministic Python triage rule evaluation.

**Request Body:**
```json
{
  "patient_name": "Alice Johnson",
  "description": "I have been suffering from severe crushing chest pain since morning."
}
```

**Response (201 Created - ROUTED):**
```json
{
  "session_id": 1,
  "status": "ROUTED",
  "urgency": "Emergency",
  "department": "Emergency Medicine",
  "rule_id": "CHEST-01",
  "rule_name": "Severe Chest Pain",
  "reason": "Rule [CHEST-01 - Severe Chest Pain] matched. Reason: Severe chest pain reported, indicating potential acute cardiac or pulmonary emergency. Matched Patient Facts: [Chest pain (severity: severe, duration: 1 days)].",
  "follow_up_questions": null,
  "extractions": [
    {
      "symptom": "Chest pain",
      "severity": "severe",
      "duration_days": 1,
      "additional_context": "I have been suffering from severe crushing chest pain since morning."
    }
  ],
  "triage_note_id": 1
}
```

**Response (201 Created - NEEDS_FOLLOW_UP):**
```json
{
  "session_id": 2,
  "status": "NEEDS_FOLLOW_UP",
  "urgency": null,
  "department": null,
  "rule_id": null,
  "rule_name": null,
  "reason": null,
  "follow_up_questions": [
    "How long have you had these symptoms and how severe are they (mild, moderate, or severe)?"
  ],
  "extractions": [],
  "triage_note_id": null
}
```

---

### 6. `POST /api/intake/{id}/followup`
Submits follow-up answer for an active intake session.

**Request Body:**
```json
{
  "answer": "The stomach pain is very severe and started yesterday."
}
```

**Response (200 OK):**
```json
{
  "session_id": 2,
  "status": "ROUTED",
  "urgency": "Emergency",
  "department": "Emergency Medicine",
  "rule_id": "ABD-01",
  "rule_name": "Severe Abdominal Pain",
  "reason": "Rule [ABD-01 - Severe Abdominal Pain] matched...",
  "extractions": [...],
  "triage_note_id": 2
}
```

---

### 7. `GET /api/triage-notes`
Nurse dashboard queue query endpoint.

**Query Parameters:**
- `urgency` (optional): `Emergency`, `Urgent`, `Standard`, `Non-Urgent`
- `status` (optional): `ROUTED`, `ESCALATED`, `NEEDS_FOLLOW_UP`
- `department` (optional): `Emergency Medicine`, `General Medicine`, etc.

**Response (200 OK):**
```json
[
  {
    "case_id": 1,
    "created_at": "2026-09-05T11:40:00Z",
    "urgency": "Emergency",
    "department": "Emergency Medicine",
    "status": "ROUTED",
    "rule_id": "CHEST-01",
    "rule_name": "Severe Chest Pain",
    "exact_rule_reason": "Rule [CHEST-01 - Severe Chest Pain] matched...",
    "patient_reported": {
      "patient_id": 1,
      "name": "Alice Johnson",
      "chief_complaint": "I have been suffering from severe crushing chest pain since morning."
    },
    "established_information": [
      {
        "symptom": "Chest pain",
        "severity": "severe",
        "duration": "1 days",
        "additional_context": "..."
      }
    ],
    "unknown_information": "None identified",
    "contradictions": "None detected",
    "intake_summary": "Chief complaint: I have been suffering from severe crushing chest pain since morning.",
    "escalation_reason": null,
    "conversation_history": [
      {
        "id": 1,
        "sender": "patient",
        "content": "I have been suffering from severe crushing chest pain since morning.",
        "timestamp": "2026-09-05T11:40:00Z"
      }
    ]
  }
]
```

---

### 8. `POST /api/triage-notes/{id}/escalate`
Manually escalates a case to duty clinician review.

**Request Body:**
```json
{
  "reason": "Clinician observed pale skin and sweating upon patient arrival."
}
```

**Response (200 OK):**
```json
{
  "case_id": 1,
  "status": "ESCALATED",
  "escalation_reason": "MANUALLY ESCALATED: Clinician observed pale skin and sweating upon patient arrival...",
  ...
}
```
