"""WPTP API entrypoint."""

from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env before any code reads os.environ (Resend, JWT, Mongo, etc.)
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from tutoring.mongo import ensure_draft_migration
from tutoring.routers import admins, applications, health, operations

app = FastAPI(title="WPTP API", version="1.0.0")


@app.on_event("startup")
def _run_migrations():
    ensure_draft_migration()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(applications.router)
app.include_router(admins.router)
app.include_router(operations.router)
