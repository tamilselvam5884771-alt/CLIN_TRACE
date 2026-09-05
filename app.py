import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.config import settings
from backend.database import init_db, SessionLocal
from backend.services.auth_service import seed_demo_users

from backend.routes.health import router as health_router
from backend.routes.auth import router as auth_router
from backend.routes.intake import router as intake_router
from backend.routes.triage_notes import router as triage_notes_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    
    # Seed demo authentication accounts (nurse@clintrace.demo & doctor@clintrace.demo)
    db = SessionLocal()
    try:
        seed_demo_users(db)
    finally:
        db.close()
        
    yield

app = FastAPI(
    title="ClinTrace API",
    description="Explainable Patient Intake & Triage Assistant Backend",
    version="0.1.0",
    lifespan=lifespan
)

# CORS Configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(intake_router)
app.include_router(triage_notes_router)

@app.get("/")
def root():
    return {
        "name": "ClinTrace Backend API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/health",
        "rules": "/api/rules"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False
    )
