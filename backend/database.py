import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings

# Handle SQLite directory creation if using SQLite DB file
database_url = settings.DATABASE_URL

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    
    # Extract file path from sqlite:///...
    db_path_str = database_url.replace("sqlite:///", "")
    if db_path_str and db_path_str != ":memory:":
        db_path = Path(db_path_str)
        if not db_path.is_absolute():
            # Resolve relative to root directory
            root_dir = Path(__file__).resolve().parent.parent
            db_path = root_dir / db_path
        
        # Ensure target directory exists
        db_path.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    database_url,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency generator for FastAPI routes to yield a database session per request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Creates all database tables defined in SQLAlchemy models if they do not exist.
    """
    import backend.models  # Ensure all models are imported before metadata creation
    Base.metadata.create_all(bind=engine)
