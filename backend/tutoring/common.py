"""Shared helpers: time/semester, Mongo fragments, admin DTOs, and small HTTP utilities."""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from bson import ObjectId
from fastapi import HTTPException
from pymongo.collection import Collection

INVITE_VALID_DAYS = 7


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def invite_expires_at() -> str:
    return (datetime.now(timezone.utc) + timedelta(days=INVITE_VALID_DAYS)).isoformat()


def current_semester() -> str:
    d = datetime.now(timezone.utc)
    return f"{d.year}-S{'2' if d.month >= 6 else '1'}"


def accepted_for_matching_filter() -> dict[str, Any]:
    """Legacy docs without applicationStatus are treated as accepted."""
    return {"$or": [{"applicationStatus": "accepted"}, {"applicationStatus": {"$exists": False}}]}


def accepted_for_matching_filter_for_draft(draft_oid: ObjectId) -> dict[str, Any]:
    """Who may be included in CP-SAT for this draft.

    Includes **accepted** and **pending** (new signups and default status on new drafts).
    Excludes **waitlist** and any other status.
    Per-draft ``draftApplicationStatus`` overrides legacy ``applicationStatus`` when set.
    """
    d = str(draft_oid)
    ok = {"$in": ["accepted", "pending"]}
    legacy_ok = {"$in": ["accepted", "pending"]}
    return {
        "$or": [
            {f"draftApplicationStatus.{d}": ok},
            {
                "$and": [
                    {f"draftApplicationStatus.{d}": {"$exists": False}},
                    {"$or": [{"applicationStatus": legacy_ok}, {"applicationStatus": {"$exists": False}}]},
                ],
            },
        ],
    }


def admin_account_status(doc: dict[str, Any]) -> Literal["invited", "created"]:
    explicit = doc.get("accountStatus")
    if explicit == "invited":
        return "invited"
    if explicit == "created":
        return "created"
    return "created" if doc.get("password") else "invited"


def admin_public_view(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "_id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "role": doc.get("role", "admin"),
        "accountStatus": admin_account_status(doc),
        "invitedAt": doc.get("invitedAt"),
        "createdAt": doc.get("createdAt"),
    }


def oid_or_400(raw: str, *, detail: str) -> ObjectId:
    try:
        return ObjectId(raw)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=detail) from exc


def patch_application_status_for_draft(
    collection: Collection,
    oid: ObjectId,
    draft_hex: str,
    application_status: str,
    *,
    normalize: Callable[[dict[str, Any], str | None], dict[str, Any]],
    not_found_detail: str,
) -> dict[str, Any]:
    """Set status for one tutor/tutee within one matching draft (does not change global applicationStatus)."""
    from tutoring.structures.documents import serialize

    field = f"draftApplicationStatus.{draft_hex}"
    result = collection.update_one(
        {"_id": oid},
        {"$set": {field: application_status, "updatedAt": now_iso()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=not_found_detail)
    updated = collection.find_one({"_id": oid})
    if not updated:
        raise HTTPException(status_code=404, detail=not_found_detail)
    return serialize(normalize(dict(updated), draft_hex))


def mark_all_applications_pending_for_draft(db: Any, draft_oid: ObjectId) -> None:
    """Set per-draft application status to pending on every tutor and tutee for a new draft."""
    key = f"draftApplicationStatus.{str(draft_oid)}"
    db.tutorApplications.update_many({}, {"$set": {key: "pending"}})
    db.tuteeApplications.update_many({}, {"$set": {key: "pending"}})
