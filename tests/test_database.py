from backend.database import Base, engine, init_db
from backend.models import User, Patient, IntakeSession, Message, Extraction, TriageNote

def test_database_table_metadata():
    expected_tables = {
        "users",
        "patients",
        "intake_sessions",
        "messages",
        "extractions",
        "triage_notes"
    }
    actual_tables = set(Base.metadata.tables.keys())
    assert expected_tables.issubset(actual_tables), f"Missing tables: {expected_tables - actual_tables}"

def test_database_init(db_session):
    # init_db creates all tables without error
    init_db()
    assert True
