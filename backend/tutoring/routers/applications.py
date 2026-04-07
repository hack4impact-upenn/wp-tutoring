"""Tutor and tutee application endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from tutoring.common import oid_or_400, patch_application_status_for_draft
from tutoring.mongo import get_db
from tutoring.structures.documents import (
    normalize_tutee_doc,
    normalize_tutor_doc,
    serialize,
    tutee_application_doc_from_payload,
    tutor_application_doc_from_payload,
)
from tutoring.common import now_iso
from tutoring.structures.schemas import ApplicationStatusPayload, BulkAcceptPayload, TuteePayload, TutorPayload
from tutoring.utils.jwt import get_current_admin

router = APIRouter(tags=["applications"])


@router.get("/api/tutors")
def list_tutors() -> list[dict[str, Any]]:
    db = get_db()
    return [serialize(normalize_tutor_doc(t)) for t in db.tutorApplications.find().sort("_id", -1)]


@router.post("/api/tutors", status_code=201)
def create_tutor(payload: TutorPayload) -> dict[str, Any]:
    db = get_db()

    doc = tutor_application_doc_from_payload(payload)

    if not doc["firstName"] or not doc["lastName"] or not doc["email"]:
        raise HTTPException(status_code=400, detail="firstName, lastName, and email are required")

    penn_id = doc["pennId"]
    if penn_id:
        existing = db.tutorApplications.find_one({"pennId": penn_id})
        if existing:
            db.tutorApplications.replace_one({"_id": existing["_id"]}, doc)
            doc["_id"] = str(existing["_id"])
            return serialize(normalize_tutor_doc(doc))

    result = db.tutorApplications.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return serialize(normalize_tutor_doc(doc))


@router.get("/api/tutors/lookup")
def lookup_tutor(pennId: str = Query(..., min_length=1)) -> dict[str, Any]:
    db = get_db()
    tutor = db.tutorApplications.find_one({"pennId": pennId.strip()})
    if not tutor:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize(normalize_tutor_doc(tutor))


@router.get("/api/tutees")
def list_tutees() -> list[dict[str, Any]]:
    db = get_db()
    return [serialize(normalize_tutee_doc(t)) for t in db.tuteeApplications.find().sort("_id", -1)]


@router.get("/api/tutees/lookup")
def lookup_tutee(parentEmail: str = Query(..., min_length=3)) -> dict[str, Any]:
    db = get_db()
    tutee = db.tuteeApplications.find_one(
        {"parentEmail": parentEmail.strip().lower()},
        sort=[("_id", -1)],
    )
    if not tutee:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize(normalize_tutee_doc(tutee))


@router.get("/api/students")
def list_students_alias() -> list[dict[str, Any]]:
    return list_tutees()


@router.post("/api/tutees", status_code=201)
def create_tutee(payload: TuteePayload) -> dict[str, Any]:
    db = get_db()

    doc = tutee_application_doc_from_payload(payload)

    if not doc["studentFirstName"] or not doc["studentLastName"] or not doc["parentEmail"]:
        raise HTTPException(
            status_code=400,
            detail="studentFirstName, studentLastName, and parentEmail are required",
        )

    result = db.tuteeApplications.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return serialize(normalize_tutee_doc(doc))


@router.post("/api/applications/accept-all")
def accept_all(
    payload: BulkAcceptPayload,
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, Any]:
    """Set applicationStatus to 'accepted' for every tutor or tutee in a given draft."""
    db = get_db()
    draft_oid = oid_or_400(payload.draft_id.strip(), detail="Invalid draft_id")
    if not db.matching_drafts.find_one({"_id": draft_oid}):
        raise HTTPException(status_code=404, detail="Draft not found")

    draft_hex = str(draft_oid)
    field = f"draftApplicationStatus.{draft_hex}"
    coll = db.tutorApplications if payload.collection == "tutors" else db.tuteeApplications

    result = coll.update_many(
        {field: {"$ne": "accepted"}},
        {"$set": {field: "accepted", "updatedAt": now_iso()}},
    )
    return {"ok": True, "modifiedCount": result.modified_count}


@router.patch("/api/tutors/{tutor_id}")
def patch_tutor_status(
    tutor_id: str,
    payload: ApplicationStatusPayload,
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, Any]:
    db = get_db()
    oid = oid_or_400(tutor_id, detail="Invalid tutor id")
    draft_oid = oid_or_400(payload.draft_id.strip(), detail="Invalid draft_id")
    if not db.matching_drafts.find_one({"_id": draft_oid}):
        raise HTTPException(status_code=404, detail="Draft not found")
    return patch_application_status_for_draft(
        db.tutorApplications,
        oid,
        str(draft_oid),
        payload.applicationStatus,
        normalize=normalize_tutor_doc,
        not_found_detail="Tutor not found",
    )


@router.patch("/api/tutees/{tutee_id}")
def patch_tutee_status(
    tutee_id: str,
    payload: ApplicationStatusPayload,
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, Any]:
    db = get_db()
    oid = oid_or_400(tutee_id, detail="Invalid tutee id")
    draft_oid = oid_or_400(payload.draft_id.strip(), detail="Invalid draft_id")
    if not db.matching_drafts.find_one({"_id": draft_oid}):
        raise HTTPException(status_code=404, detail="Draft not found")
    return patch_application_status_for_draft(
        db.tuteeApplications,
        oid,
        str(draft_oid),
        payload.applicationStatus,
        normalize=normalize_tutee_doc,
        not_found_detail="Tutee not found",
    )
