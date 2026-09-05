TRACK_ID=PS06

# ClinTrace — Explainable Patient Intake & Triage Assistant

**ClinTrace** is an explainable Patient Intake & Clinical Triage Operations System designed for modern healthcare environments. It combines **Google Gemini 1.5/2.0 API** for natural language clinical entity extraction with a **100% deterministic Python clinical rule engine** for safety-governed urgency classification and department routing.

---

## 🏗️ Tech Stack

### Frontend Stack
- **Framework**: React 18 (Vite, TypeScript, Single Page Application)
- **Styling**: Vanilla CSS tokens & TailwindCSS (Custom Clinical Signal design system)
- **Motion & UI**: Framer Motion 11 (Reduced-motion accessible animations), Lucide React Icons
- **Routing**: React Router DOM v6

### Backend Stack
- **Framework**: FastAPI (Python 3.12, Asynchronous ASGI Server via Uvicorn)
- **Database**: SQLite (SQLAlchemy 2.0 ORM, Pydantic v2 validation models)
- **AI Service**: Google Gemini 1.5/2.0 Flash API (Strictly constrained for entity extraction)
- **Security & Auth**: JWT Tokens, Salted SHA-256 password hashing, CORS Middleware
- **Test Suite**: Pytest (30 comprehensive unit & API integration tests)

---

## ⚡ Quick Start (One-Command Launch)

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the application (Starts FastAPI server & serves production React SPA)
python app.py
```

Application URL: **`http://localhost:8000`**

### Access Links:
- **Patient Intake UI**: `http://localhost:8000/`
- **Nurse Operations Console**: `http://localhost:8000/nurse`
- **Swagger API Docs**: `http://localhost:8000/docs`
- **Health Endpoint**: `http://localhost:8000/api/health`
- **Rules Catalog**: `http://localhost:8000/api/rules`

### Staff Demo Account Credentials:
- **Username / Email**: `nurse@clintrace.demo`
- **Password**: `demo123`

---

## 🔄 End-to-End Workflow Diagram

```
[PATIENT] ──(1) Natural Language Complaint──► [REACT FRONTEND]
                                                    │
                                                    ▼ (POST /api/intake)
                                           [FASTAPI SERVER]
                                                    │
                             ┌──────────────────────┴──────────────────────┐
                             ▼                                             ▼
               [GEMINI 1.5/2.0 FLASH API]                       [DATABASE / STORAGE]
               (Extracts Facts & Symptoms)                       (Persists Intake Session)
                             │                                             │
                             └──────────────────────┬──────────────────────┘
                                                    │
                                                    ▼
                                    [MISSING INFO / QUESTION CHECK]
                                    ├─► If missing: Asks max 1-2 follow-up Qs
                                    └─► If complete: Calls Triage Engine
                                                    │
                                                    ▼
                                     [PYTHON DETERMINISTIC RULE ENGINE]
                                     (Evaluates data/rules.json Safety Rules)
                                                    │
                             ┌──────────────────────┴──────────────────────┐
                             ▼                                             ▼
                   [RULE MATCHED: ROUTED]                        [UNCERTAIN: ESCALATED]
                   Assigns Urgency Badge                         Shows "ESCALATED TO STAFF"
                   & Department Target                           Pushes to Urgent Nurse Queue
                             │                                             │
                             └──────────────────────┬──────────────────────┘
                                                    │
                                                    ▼
                                     [NURSE OPERATIONS CONSOLE]
                                     (Priority Queue, Metrics, & 5-Step Rule Trace)
```

---

## 🛡️ Clinical Safety & Governance Principles

1. **Strict LLM Boundary**: Gemini is **never** permitted to decide patient urgency, diagnosis, or department routing. Gemini extracts symptoms, severity, and duration parameters only.
2. **Deterministic Governance**: All triage classifications (`Emergency`, `Urgent`, `Standard`, `Non-Urgent`) and department assignments are computed exclusively by Python code executing static rules in `data/rules.json`.
3. **Safe Default Escalation**: Any patient input with contradictions, low extraction confidence (< 0.70), persistent missing info, or unmatched symptoms automatically triggers `ESCALATED TO STAFF` review.
4. **No Diagnosis**: ClinTrace clearly displays *"This is a routing recommendation, not a diagnosis"* across patient and staff interfaces.

---

## 📂 Project Structure

```
CLIN_TRACE/
├── app.py                  # Server entrypoint (serves FastAPI APIs & React SPA from frontend/dist)
├── requirements.txt        # Backend dependencies
├── README.md               # Complete project documentation & guide (TRACK_ID=PS06)
├── API_CONTRACT.md         # REST API contract specification
├── .env.example            # Environment configuration template
├── .gitignore              # Git ignore rules (.env, data/*.db, node_modules, etc.)
├── backend/
│   ├── config.py           # Environment settings loader
│   ├── database.py         # SQLAlchemy engine & session factory
│   ├── models.py           # ORM models (Patient, IntakeSession, Message, Extraction, TriageNote, User)
│   ├── schemas.py          # Pydantic schemas for API request/response validation
│   ├── routes/
│   │   ├── health.py       # Health check API (/api/health)
│   │   ├── auth.py         # Login, Logout, Me APIs (/api/auth/*)
│   │   ├── intake.py       # Intake submission & follow-up endpoints (/api/intake/*)
│   │   └── triage_notes.py # Nurse queue, rule catalog, & manual escalation endpoints (/api/triage-notes/*)
│   └── services/
│       ├── auth_service.py # Authentication, JWT generation, & password hashing
│       ├── gemini_service.py# Gemini API extraction service with offline fallback
│       └── triage_engine.py# Deterministic Python rule engine evaluator
├── data/
│   ├── rules.json          # Deterministic clinical safety rules
│   └── clintrace.db        # SQLite database
├── frontend/
│   ├── package.json        # Frontend React dependencies & build scripts
│   ├── vite.config.ts      # Vite bundler configuration
│   ├── src/
│   │   ├── api/client.ts   # API client for backend communication
│   │   ├── components/     # UI design system (ClinicalSignal, RuleTrace, Badge, Card, etc.)
│   │   ├── types/api.ts    # TypeScript interface definitions matching backend contract
│   │   └── views/          # Patient & Nurse views (PatientIntake, PatientResult, NurseLogin, NurseDashboard, NurseCaseDetail)
└── tests/                  # Pytest automated test suite (30 passed tests)
```

---

## 🧪 Running Automated Tests

Run the complete 30-test suite using `pytest`:

```bash
.venv\Scripts\pytest -v
```

