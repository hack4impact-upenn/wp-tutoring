"""Admin accounts, invites, and session endpoints."""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone as tz
from typing import Any

import hmac
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from tutoring.common import (
    admin_account_status,
    admin_public_view,
    invite_expires_at,
    now_iso,
    oid_or_400,
)
from tutoring.mongo import get_db
from tutoring.structures.schemas import (
    AdminInvitePayload,
    AdminLoginPayload,
    AdminPayload,
    CompleteInvitePayload,
)
from tutoring.utils.email_invites import build_invite_url, send_admin_invite_email
from tutoring.utils.jwt import create_token, get_current_admin, hash_password

log = logging.getLogger(__name__)

router = APIRouter(tags=["admins"])


@router.get("/api/admins")
def list_admins(_admin: dict[str, str] = Depends(get_current_admin)) -> list[dict[str, Any]]:
    db = get_db()
    return [admin_public_view(dict(a)) for a in db.admins.find().sort("_id", -1)]


@router.post("/api/admins", status_code=201)
def create_admin(
    payload: AdminPayload,
    _caller: dict[str, str] = Depends(get_current_admin),
) -> dict[str, Any]:
    db = get_db()
    if not payload.name.strip() or not payload.email.strip():
        raise HTTPException(status_code=400, detail="name and email are required")
    existing = db.admins.find_one({"email": payload.email.strip().lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Admin with this email already exists")
    doc = {
        "name": payload.name.strip(),
        "email": payload.email.strip().lower(),
        "password": hash_password(payload.password),
        "role": payload.role,
        "accountStatus": "created",
        "createdAt": now_iso(),
    }
    result = db.admins.insert_one(doc)
    inserted = db.admins.find_one({"_id": result.inserted_id})
    if not inserted:
        raise HTTPException(status_code=500, detail="Failed to create admin")
    return admin_public_view(dict(inserted))


@router.post("/api/admins/invite")
def invite_admin(
    payload: AdminInvitePayload,
    _caller: dict[str, str] = Depends(get_current_admin),
) -> dict[str, Any]:
    db = get_db()
    name = payload.name.strip()
    email = payload.email.strip().lower()
    if not name or not email:
        raise HTTPException(status_code=400, detail="name and email are required")

    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_password(raw_token)
    invited_at = now_iso()
    expires_at = invite_expires_at()

    existing = db.admins.find_one({"email": email})
    if existing:
        if admin_account_status(dict(existing)) == "created":
            raise HTTPException(status_code=409, detail="An admin with this email already exists")
        db.admins.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "name": name,
                    "accountStatus": "invited",
                    "inviteTokenHash": token_hash,
                    "inviteExpiresAt": expires_at,
                    "invitedAt": invited_at,
                },
                "$unset": {"password": ""},
            },
        )
        updated = db.admins.find_one({"_id": existing["_id"]})
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to update invite")
    else:
        doc = {
            "name": name,
            "email": email,
            "role": "admin",
            "accountStatus": "invited",
            "inviteTokenHash": token_hash,
            "inviteExpiresAt": expires_at,
            "invitedAt": invited_at,
            "createdAt": invited_at,
        }
        result = db.admins.insert_one(doc)
        updated = db.admins.find_one({"_id": result.inserted_id})
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to create invite")

    invite_url = build_invite_url(raw_token)
    try:
        emailed = send_admin_invite_email(email, name, invite_url)
    except RuntimeError:
        log.warning("invite_admin: email delivery failed for %s (see tutoring.utils.email_invites logs)", email)
        raise HTTPException(
            status_code=502,
            detail="Invite was saved but the invitation email could not be sent. Check server logs and Resend domain settings.",
        ) from None

    log.info(
        "invite_admin: invite saved for %s emailSent=%s (if false, check API response inviteUrl or server logs)",
        email,
        emailed,
    )
    out: dict[str, Any] = {**admin_public_view(dict(updated)), "emailSent": emailed}
    if not emailed:
        out["inviteUrl"] = invite_url
    return out


@router.post("/api/admin/complete-invite")
def complete_invite(payload: CompleteInvitePayload) -> dict[str, Any]:
    db = get_db()
    token_hash = hash_password(payload.token.strip())
    admin = db.admins.find_one({"inviteTokenHash": token_hash})
    if not admin:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation")
    if admin_account_status(dict(admin)) != "invited":
        raise HTTPException(
            status_code=409,
            detail=(
                "An account has already been created with this invitation link. "
                "Sign in with the email from your invite and the password you set."
            ),
        )

    expires_raw = admin.get("inviteExpiresAt")
    if expires_raw:
        try:
            exp = datetime.fromisoformat(expires_raw.replace("Z", "+00:00"))
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=tz.utc)
            if datetime.now(tz.utc) > exp:
                raise HTTPException(status_code=400, detail="Invitation has expired")
        except HTTPException:
            raise
        except (TypeError, ValueError):
            pass

    pwd_hash = hash_password(payload.password)
    db.admins.update_one(
        {"_id": admin["_id"]},
        {
            "$set": {
                "password": pwd_hash,
                "accountStatus": "created",
            },
            "$unset": {"inviteExpiresAt": ""},
        },
    )
    updated = db.admins.find_one({"_id": admin["_id"]})
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to load admin after invite completion")
    admin_id = str(updated["_id"])
    email = str(updated.get("email") or admin.get("email") or "")
    session_token = create_token(admin_id, email)
    return {
        "ok": True,
        "token": session_token,
        "admin": {
            "_id": admin_id,
            "name": updated.get("name", ""),
            "email": updated.get("email", ""),
            "role": updated.get("role", "admin"),
        },
    }


@router.delete("/api/admins/{admin_id}/invite")
def delete_admin_invite(
    admin_id: str,
    current: dict[str, str] = Depends(get_current_admin),
) -> dict[str, bool]:
    """Remove a pending invitation (document must still be in invited status)."""
    db = get_db()
    oid = oid_or_400(admin_id, detail="Invalid admin id")
    if current.get("_id") == admin_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    doc = db.admins.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Admin not found")
    if admin_account_status(doc) != "invited":
        raise HTTPException(
            status_code=400,
            detail="Only pending invitations can be removed; this account is already active.",
        )
    db.admins.delete_one({"_id": oid})
    return {"ok": True}


@router.delete("/api/admins/{admin_id}")
def delete_admin(
    admin_id: str,
    current: dict[str, str] = Depends(get_current_admin),
) -> dict[str, bool]:
    db = get_db()
    oid = oid_or_400(admin_id, detail="Invalid admin id")
    if current.get("_id") == admin_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    result = db.admins.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"ok": True}


@router.post("/api/admin/login")
def admin_login(payload: AdminLoginPayload) -> dict[str, Any]:
    db = get_db()
    admin = db.admins.find_one({"email": payload.email.strip().lower()})
    if not admin:
        raise HTTPException(status_code=401, detail="No account found with this email")
    if admin.get("accountStatus") == "invited":
        raise HTTPException(
            status_code=401,
            detail="Complete your invitation using the link we emailed you before signing in.",
        )
    pwd_hash = admin.get("password")
    if not pwd_hash or not isinstance(pwd_hash, str):
        raise HTTPException(
            status_code=401,
            detail="Complete your invitation using the link we emailed you before signing in.",
        )
    if not hmac.compare_digest(pwd_hash, hash_password(payload.password)):
        raise HTTPException(status_code=401, detail="Incorrect password")
    admin_id = str(admin["_id"])
    token = create_token(admin_id, admin["email"])
    return {
        "ok": True,
        "token": token,
        "admin": {
            "_id": admin_id,
            "name": admin.get("name", ""),
            "email": admin.get("email", ""),
            "role": admin.get("role", "admin"),
        },
    }


@router.get("/api/admin/me")
def admin_me(current: dict[str, str] = Depends(get_current_admin)) -> dict[str, Any]:
    db = get_db()
    oid = oid_or_400(current["_id"], detail="Invalid admin id")
    admin = db.admins.find_one({"_id": oid})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return {
        "_id": str(admin["_id"]),
        "name": admin.get("name", ""),
        "email": admin.get("email", ""),
        "role": admin.get("role", "admin"),
    }
