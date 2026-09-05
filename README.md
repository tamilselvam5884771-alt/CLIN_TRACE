# ClinTrace Backend Foundation (Phase 1)

ClinTrace is an explainable Patient Intake & Triage Assistant designed for clinical settings. Phase 1 establishes the core backend foundation, database architecture, configuration, health endpoint, and unit tests.

## Tech Stack

- **Python**: 3.11+
- **Framework**: FastAPI
- **ASGI Server**: Uvicorn
- **Database**: SQLite with SQLAlchemy ORM
- **Validation**: Pydantic
- **Environment**: python-dotenv
- **Testing**: pytest & httpx

## Project Structure

```
CLIN_TRACE/
├── app.py                  # Main entry point to launch FastAPI server
├── requirements.txt        # Project dependencies
├── README.md               # Documentation
├── .env.example            # Sample environment variables template
├── .env                    # Local environment variables (git-ignored)
├── .gitignore              # Files & directories excluded from version control
├── backend/
│   ├── __init__.py
│   ├── config.py           # Environment configuration loader
│   ├── database.py         # SQLAlchemy engine, session maker, init_db()
│   ├── models.py           # ORM models (users, patients, intake_sessions, etc.)
│   ├── schemas.py          # Pydantic schemas
│   ├── routes/
│   │   ├── __init__.py
│   │   └── health.py       # GET /api/health endpoint
│   └── services/
│       └── __init__.py
├── data/
│   └── .gitkeep            # Directory for SQLite database storage
└── tests/
    ├── __init__.py
    ├── conftest.py         # Pytest fixtures and DB setup
    ├── test_health.py      # Health endpoint test suite
    ├── test_database.py    # Database creation & connection test suite
    └── test_models.py      # Model CRUD & relationships test suite
```

## Setup & Installation

1. Create and activate virtual environment (optional if using global python):
   ```bash
   python -m venv .venv
   # Windows PowerShell:
   .\.venv\Scripts\Activate.ps1
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

## Running the Application

To start the FastAPI server on `http://localhost:8000`:

```bash
python app.py
```

The API will be available at:
- Health Check: `http://localhost:8000/api/health`
- Swagger Documentation: `http://localhost:8000/docs`

## Running Tests

Run the test suite using `pytest`:

```bash
pytest
```
