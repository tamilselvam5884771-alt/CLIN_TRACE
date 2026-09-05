from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.schemas import HealthCheckResponse

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health", response_model=HealthCheckResponse, status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint to verify API and Database status.
    """
    db_status = "unhealthy"
    try:
        # Execute a simple query to verify database connectivity
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection error: {str(e)}"
        )

    return HealthCheckResponse(
        status="healthy",
        database=db_status,
        service="ClinTrace Backend API",
        version="0.1.0",
        timestamp=datetime.now(timezone.utc)
    )

