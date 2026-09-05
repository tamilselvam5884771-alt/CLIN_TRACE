TRACK_ID=PS06

# ClinTrace - Explainable Patient Intake & Triage Assistant

ClinTrace is an explainable Patient Intake & Triage Assistant built for clinical settings. It features Gemini-powered clinical entity extraction combined with a 100% deterministic Python clinical rule engine to route patients safely and explainably to appropriate departments or escalate urgent/uncertain cases.

---

## One Command to Run

```bash
pip install -r requirements.txt
python app.py
```

Runs on: **`http://localhost:8000`**

- Swagger API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`
- Rules Catalog: `http://localhost:8000/api/rules`

---

## External API & Environment Configuration

ClinTrace exclusively uses **Google Gemini** for natural language understanding and clinical fact extraction.

- API Key is read from environment variable `GEMINI_API_KEY`.
- Never hardcode secrets. If `GEMINI_API_KEY` is omitted or API fails, the backend safely falls back without producing fake triage decisions.

```bash
# Set your Gemini API key (Linux/macOS)
export GEMINI_API_KEY="your_api_key_here"

# PowerShell (Windows)
$env:GEMINI_API_KEY="your_api_key_here"
```

---

## Phase-by-Phase Architecture & Status

### Phase 1 — Backend Foundation
- **Core Stack**: Python 3.11+, FastAPI, Uvicorn, SQLite, SQLAlchemy 2.0, Pydantic v2, python-dotenv, pytest.
- **Database Schema**: SQLite (`data/clintrace.db`) with 6 core ORM models (`users`, `patients`, `intake_sessions`, `messages`, `extractions`, `triage_notes`).
- **Health Check**: `GET /api/health` verifying API and SQLite DB connection status.

### Phase 3 — Deterministic Triage Engine
- **Strict Boundary**: Gemini extracts facts; Python decides triage.
- **Rule Storage (`data/rules.json`)**: Human-readable clinical rules with explicit numerical `priority`, `urgency`, `department`, `conditions`, and `reason`.
- **Triage Rules**:
  - `CHEST-01`: Severe Chest Pain $\rightarrow$ `Emergency` / `Emergency Medicine`
  - `BREATH-01`: Severe Breathing Difficulty $\rightarrow$ `Emergency` / `Emergency Medicine`
  - `INJURY-01`: Severe Injury $\rightarrow$ `Emergency` / `Emergency Medicine`
  - `ABD-01`: Severe Abdominal Pain $\rightarrow$ `Emergency` / `Emergency Medicine`
  - `FEVER-02`: Persistent Fever ($\ge$ 3 days) $\rightarrow$ `Urgent` / `General Medicine`
  - `FEVER-01`: Recent Mild Fever ($\le$ 2 days) $\rightarrow$ `Standard` / `General Medicine`
  - `INJURY-02`: Minor Injury $\rightarrow$ `Non-Urgent` / `Outpatient Clinic`
  - `ABD-02`: Mild Abdominal Discomfort $\rightarrow$ `Non-Urgent` / `General Medicine`
  - `GEN-01`: General Mild Symptoms $\rightarrow$ `Non-Urgent` / `Outpatient Clinic`
- **Safety Escalation**: Automatic escalation (`status: ESCALATED`) for contradictions, missing info, low confidence (< 0.70), or unmatched clinical profiles.

### Phase 4 — API Orchestration & Authentication (Backend Freeze)
- **Local Authentication**: Seeded demo accounts (`nurse@clintrace.demo` / `demo123`, `doctor@clintrace.demo` / `demo123`) using salted SHA-256 password hashing and JWT tokens.
- **Intake & Follow-up Workflow**:
  - `POST /api/intake`: Intake creation, entity extraction, missing info check (up to 2 follow-up questions), deterministic triage evaluation, and triage note generation.
  - `POST /api/intake/{id}/followup`: Answer merging, contradiction detection, follow-up limitation, and triage evaluation.
- **Nurse Queue Dashboard**:
  - `GET /api/triage-notes`: Sorted newest first with filters (`urgency`, `status`, `department`).
  - `GET /api/triage-notes/{id}`: Full case view.
  - `POST /api/triage-notes/{id}/escalate`: Manual case escalation by clinician.

---

## Project Structure

```
CLIN_TRACE/
├── app.py                  # Single-command server launcher (0.0.0.0:8000)
├── requirements.txt        # Backend dependencies
├── README.md               # Hackathon submission documentation (TRACK_ID=PS06)
├── API_CONTRACT.md         # Frozen REST API contract for frontend integration
├── .env.example            # Environment variables template
├── .env                    # Local environment variables (git-ignored)
├── .gitignore              # Ignored files (.env, data/*.db, .venv, etc.)
├── backend/
│   ├── __init__.py
│   ├── config.py           # Environment configuration loader
│   ├── database.py         # SQLAlchemy engine, session maker, init_db()
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schemas.py          # Pydantic validation models & API payloads
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py       # GET /api/health
│   │   ├── auth.py         # POST /api/auth/login, /api/auth/logout, GET /api/auth/me
│   │   ├── intake.py       # POST /api/intake, POST /api/intake/{id}/followup
│   │   └── triage_notes.py # GET /api/triage-notes, GET /api/rules, POST escalate
│   └── services/
│       ├── __init__.py
│       ├── auth_service.py # Hashing, JWT, and demo user seeder
│       ├── gemini_service.py# Gemini entity extraction with offline fallback
│       └── triage_engine.py# Deterministic Python rule engine
├── data/
│   ├── .gitkeep
│   ├── rules.json          # Deterministic clinical rules definition
│   └── clintrace.db        # SQLite database
└── tests/
    ├── __init__.py
    ├── conftest.py         # Pytest fixtures & in-memory database setup
    ├── test_health.py      # Health API unit tests
    ├── test_database.py    # Database initialization unit tests
    ├── test_models.py      # ORM model unit tests
    ├── test_triage_engine.py # Deterministic triage rule engine tests
    ├── test_auth.py        # Authentication unit tests
    └── test_intake_workflow.py # Intake & follow-up workflow unit tests
```

---

## Running Automated Tests

Run the complete 30-test suite using `pytest`:

```bash
pytest -v
```
