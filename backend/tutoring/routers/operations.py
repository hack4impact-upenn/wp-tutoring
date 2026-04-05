"""Sections, matching, assignments, drafts, and reference data."""

from __future__ import annotations

from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from tutoring.common import (
    accepted_for_matching_filter_for_draft,
    current_semester,
    mark_all_applications_pending_for_draft,
    now_iso,
    oid_or_400,
)
from tutoring.matching import SUBJECTS, pair_allowed_hard, pair_weight, run_matching_cpsat
from tutoring.mongo import get_db
from tutoring.structures.documents import (
    normalize_tutee_doc,
    normalize_tutor_doc,
    serialize,
)
from tutoring.structures.schemas import (
    CreateDraftPayload,
    DuplicateDraftPayload,
    LastSemesterPairsPayload,
    IndividualMatchPayload,
    OverridePayload,
    ReassignMatchPayload,
    RunMatchingPayload,
    SectionPayload,
    UpdateDraftPayload,
)
from tutoring.utils.jwt import get_current_admin

router = APIRouter(tags=["operations"])


def serialize_assignments_for_draft(
    db: Any,
    draft_oid: ObjectId,
    semester: str,
) -> list[dict[str, Any]]:
    draft_hex = str(draft_oid)
    rows = list(
        db.matches.find({"semester": semester, "status": "active", "draft_id": draft_oid}).sort("_id", 1)
    )
    out: list[dict[str, Any]] = []
    for row in rows:
        tutor = db.tutorApplications.find_one({"_id": row["tutor_id"]}) if row.get("tutor_id") else None
        tutee = db.tuteeApplications.find_one({"_id": row["student_id"]}) if row.get("student_id") else None
        t_snap = serialize(normalize_tutor_doc(dict(tutor), draft_hex)) if tutor else None
        s_snap = serialize(normalize_tutee_doc(dict(tutee), draft_hex)) if tutee else None
        out.append(
            {
                "id": str(row["_id"]),
                "tutor_id": str(row.get("tutor_id")) if row.get("tutor_id") else None,
                "student_id": str(row.get("student_id")) if row.get("student_id") else None,
                "section_id": str(row.get("section_id")) if row.get("section_id") else None,
                "semester": row.get("semester"),
                "manual_override": bool(row.get("manual_override", False)),
                "pairScore": row.get("pairScore"),
                "scoreExplanation": row.get("scoreExplanation"),
                "reason": row.get("reason"),
                "tutor_name": f"{(tutor or {}).get('firstName', '')} {(tutor or {}).get('lastName', '')}".strip(),
                "tutor_email": (tutor or {}).get("email"),
                "student_name": f"{(tutee or {}).get('studentFirstName', '')} {(tutee or {}).get('studentLastName', '')}".strip(),
                "student_email": (tutee or {}).get("parentEmail"),
                "tutorDetail": t_snap,
                "tuteeDetail": s_snap,
            }
        )
    return out


@router.get("/api/sections")
def list_sections() -> list[dict[str, Any]]:
    db = get_db()
    return [serialize(s) for s in db.sections.find().sort("_id", 1)]


@router.post("/api/sections")
def create_section(payload: SectionPayload) -> dict[str, Any]:
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Section name required")
    db = get_db()
    doc = {"name": payload.name.strip(), "time_block": (payload.time_block or "").strip()}
    result = db.sections.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


# ── Drafts ───────────────────────────────────────────────────────────


@router.get("/api/drafts")
def list_drafts(semester: str | None = None) -> list[dict[str, Any]]:
    db = get_db()
    sem = semester or current_semester()
    docs = list(db.matching_drafts.find({"semester": sem}).sort("createdAt", 1))
    return [serialize(d) for d in docs]


@router.post("/api/drafts")
def create_draft(
    payload: CreateDraftPayload,
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, Any]:
    db = get_db()
    sem = payload.semester or current_semester()
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Draft name required")
    doc = {
        "name": payload.name.strip(),
        "semester": sem,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    result = db.matching_drafts.insert_one(doc)
    doc["_id"] = result.inserted_id
    mark_all_applications_pending_for_draft(db, result.inserted_id)
    return serialize(doc)


@router.patch("/api/drafts/{draft_id}")
def rename_draft(
    draft_id: str,
    payload: UpdateDraftPayload,
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, Any]:
    db = get_db()
    draft_oid = oid_or_400(draft_id, detail="Invalid draft_id")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Draft name required")
    result = db.matching_drafts.find_one_and_update(
        {"_id": draft_oid},
        {"$set": {"name": payload.name.strip(), "updatedAt": now_iso()}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Draft not found")
    return serialize(result)


@router.delete("/api/drafts/{draft_id}")
def delete_draft(
    draft_id: str,
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, bool]:
    db = get_db()
    draft_oid = oid_or_400(draft_id, detail="Invalid draft_id")
    existing = db.matching_drafts.find_one({"_id": draft_oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Draft not found")
    db.matches.delete_many({"draft_id": draft_oid})
    db.matching_drafts.delete_one({"_id": draft_oid})
    return {"ok": True}


@router.post("/api/drafts/{draft_id}/duplicate")
def duplicate_draft(
    draft_id: str,
    payload: DuplicateDraftPayload,
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, Any]:
    db = get_db()
    source_oid = oid_or_400(draft_id, detail="Invalid draft_id")
    source = db.matching_drafts.find_one({"_id": source_oid})
    if not source:
        raise HTTPException(status_code=404, detail="Source draft not found")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Draft name required")

    new_draft = {
        "name": payload.name.strip(),
        "semester": source["semester"],
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    new_draft_id = db.matching_drafts.insert_one(new_draft).inserted_id
    mark_all_applications_pending_for_draft(db, new_draft_id)

    source_matches = list(db.matches.find({"draft_id": source_oid}))
    if source_matches:
        for m in source_matches:
            m.pop("_id")
            m["draft_id"] = new_draft_id
            m["createdAt"] = now_iso()
        db.matches.insert_many(source_matches)

    new_draft["_id"] = new_draft_id
    return serialize(new_draft)


# ── Admin dashboard (single round-trip) ─────────────────────────────


@router.get("/api/admin/dashboard/workspace")
def admin_dashboard_workspace(
    draft_id: str | None = Query(None, description="When omitted, uses the first draft for this semester."),
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, Any]:
    """Drafts, tutors, tutees, and assignments for one draft in one response (aligned counts)."""
    db = get_db()
    sem = current_semester()
    drafts_raw = list(db.matching_drafts.find({"semester": sem}).sort("createdAt", 1))
    drafts_ser = [serialize(d) for d in drafts_raw]

    active_oid: ObjectId | None = None
    list_sem: str = sem

    if draft_id and draft_id.strip():
        active_oid = oid_or_400(draft_id.strip(), detail="Invalid draft_id")
        ddoc = db.matching_drafts.find_one({"_id": active_oid})
        if not ddoc:
            raise HTTPException(status_code=404, detail="Draft not found")
        list_sem = str(ddoc.get("semester") or sem)
    elif drafts_raw:
        active_oid = drafts_raw[0]["_id"]
        list_sem = str(drafts_raw[0].get("semester") or sem)

    dkey: str | None = str(active_oid) if active_oid is not None else None
    tutors = [
        serialize(normalize_tutor_doc(dict(t), dkey)) for t in db.tutorApplications.find().sort("_id", -1)
    ]
    tutees = [
        serialize(normalize_tutee_doc(dict(t), dkey)) for t in db.tuteeApplications.find().sort("_id", -1)
    ]

    assignments: list[dict[str, Any]] = []
    active_draft_id_str: str | None = str(active_oid) if active_oid is not None else None
    if active_oid is not None:
        assignments = serialize_assignments_for_draft(db, active_oid, list_sem)

    return {
        "drafts": drafts_ser,
        "tutors": tutors,
        "tutees": tutees,
        "assignments": assignments,
        "activeDraftId": active_draft_id_str,
    }


# ── Assignments ──────────────────────────────────────────────────────


@router.get("/api/assignments")
def list_assignments(draft_id: str, semester: str | None = None) -> list[dict[str, Any]]:
    db = get_db()
    semester = semester or current_semester()
    draft_oid = oid_or_400(draft_id, detail="Invalid draft_id")
    return serialize_assignments_for_draft(db, draft_oid, semester)


@router.post("/api/assignments/individual-match")
def individual_match(
    payload: IndividualMatchPayload,
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, Any]:
    """Pairwise soft score and hard eligibility for individual-match preview (same rules as CP-SAT edges)."""
    db = get_db()
    resolved_sem = payload.semester or current_semester()
    draft_oid = oid_or_400(payload.draft_id, detail="Invalid draft_id")
    tmp_rows: list[dict[str, Any]] = []

    if payload.fixed_tutor_id:
        try:
            anchor_oid = ObjectId(str(payload.fixed_tutor_id).strip())
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid fixed_tutor_id") from exc
        raw_anchor = db.tutorApplications.find_one({"_id": anchor_oid})
        if not raw_anchor:
            raise HTTPException(status_code=404, detail="Tutor not found")
        anchor_tutor = normalize_tutor_doc(dict(raw_anchor), str(draft_oid))

        for cid in payload.candidate_tutee_ids:
            cs = str(cid).strip()
            if not cs:
                continue
            try:
                coid = ObjectId(cs)
            except Exception:
                continue
            raw_c = db.tuteeApplications.find_one({"_id": coid})
            if not raw_c:
                continue
            tutee_d = normalize_tutee_doc(dict(raw_c), str(draft_oid))
            eligible = pair_allowed_hard(anchor_tutor, tutee_d)
            soft = pair_weight(anchor_tutor, tutee_d)
            name = (
                f"{raw_c.get('studentFirstName', '')} {raw_c.get('studentLastName', '')}".strip() or "—"
            )
            email = str(raw_c.get("parentEmail") or "")
            tmp_rows.append(
                {
                    "id": cs,
                    "name": name,
                    "email": email,
                    "eligible": eligible,
                    "correlation_points": soft if eligible else None,
                    "current_tutee_count": None,
                    "_soft": soft,
                }
            )
    elif payload.fixed_tutee_id:
        try:
            anchor_oid = ObjectId(str(payload.fixed_tutee_id).strip())
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid fixed_tutee_id") from exc
        raw_anchor = db.tuteeApplications.find_one({"_id": anchor_oid})
        if not raw_anchor:
            raise HTTPException(status_code=404, detail="Tutee not found")
        anchor_tutee = normalize_tutee_doc(dict(raw_anchor), str(draft_oid))

        for cid in payload.candidate_tutor_ids:
            cs = str(cid).strip()
            if not cs:
                continue
            try:
                coid = ObjectId(cs)
            except Exception:
                continue
            raw_c = db.tutorApplications.find_one({"_id": coid})
            if not raw_c:
                continue
            tutor_d = normalize_tutor_doc(dict(raw_c), str(draft_oid))
            eligible = pair_allowed_hard(tutor_d, anchor_tutee)
            soft = pair_weight(tutor_d, anchor_tutee)
            name = f"{raw_c.get('firstName', '')} {raw_c.get('lastName', '')}".strip() or "—"
            email = str(raw_c.get("email") or "")
            tutee_count = db.matches.count_documents(
                {"tutor_id": coid, "semester": resolved_sem, "status": "active", "draft_id": draft_oid},
            )
            tmp_rows.append(
                {
                    "id": cs,
                    "name": name,
                    "email": email,
                    "eligible": eligible,
                    "correlation_points": soft if eligible else None,
                    "current_tutee_count": tutee_count,
                    "_soft": soft,
                }
            )

    tmp_rows.sort(key=lambda r: (0 if r["eligible"] else 1, -r["_soft"]))
    candidates = [{k: v for k, v in r.items() if k != "_soft"} for r in tmp_rows]
    return {"candidates": candidates}


@router.post("/api/run-matching")
def run_matching_endpoint(payload: RunMatchingPayload) -> dict[str, Any]:
    db = get_db()
    semester = payload.semester or current_semester()
    draft_oid = oid_or_400(payload.draft_id, detail="Invalid draft_id")

    # Verify the draft exists
    if not db.matching_drafts.find_one({"_id": draft_oid}):
        raise HTTPException(status_code=404, detail="Draft not found")

    af = accepted_for_matching_filter_for_draft(draft_oid)
    tutor_docs = [normalize_tutor_doc(dict(t), str(draft_oid)) for t in db.tutorApplications.find(af)]
    tutee_docs = [normalize_tutee_doc(dict(t), str(draft_oid)) for t in db.tuteeApplications.find(af)]
    section_docs = list(db.sections.find())
    if not section_docs:
        sid = db.sections.insert_one({"name": "Section A", "time_block": "TBD"}).inserted_id
        section_docs = [{"_id": sid, "name": "Section A", "time_block": "TBD"}]

    tutor_map: dict[int, Any] = {i: t["_id"] for i, t in enumerate(tutor_docs)}
    student_map: dict[int, Any] = {j: s["_id"] for j, s in enumerate(tutee_docs)}

    result = run_matching_cpsat(tutor_docs=tutor_docs, tutee_docs=tutee_docs)
    db.matches.delete_many({"semester": semester, "draft_id": draft_oid})

    inserted = 0
    default_section_oid = section_docs[0]["_id"] if section_docs else None
    for a in result["assignments"]:
        ti = a.get("tutor_index")
        sj = a.get("student_index")
        tutor_oid = tutor_map.get(ti) if ti is not None else None
        student_oid = student_map.get(sj) if sj is not None else None
        if not tutor_oid or not student_oid:
            continue
        expl = a.get("explanation")
        db.matches.insert_one(
            {
                "tutor_id": tutor_oid,
                "student_id": student_oid,
                "section_id": default_section_oid,
                "semester": semester,
                "draft_id": draft_oid,
                "manual_override": False,
                "status": "active",
                "reason": a.get("reason", "cpsat"),
                "pairScore": a.get("score"),
                "scoreExplanation": expl,
                "createdAt": now_iso(),
            }
        )
        inserted += 1

    assignment_summaries: list[dict[str, Any]] = []
    for a in result["assignments"]:
        ti = a.get("tutor_index")
        sj = a.get("student_index")
        assignment_summaries.append(
            {
                "tutorId": str(tutor_map[ti]) if ti is not None and ti in tutor_map else None,
                "studentId": str(student_map[sj]) if sj is not None and sj in student_map else None,
                "tutorIndex": ti,
                "studentIndex": sj,
                "pairScore": a.get("score"),
                "reason": a.get("reason"),
                "explanation": a.get("explanation"),
            }
        )

    return {
        "semester": semester,
        "assignmentsCount": inserted,
        "assignments": assignment_summaries,
        "unassignedTutors": len(result["unassigned_tutors"]),
        "unassignedStudents": len(result["unassigned_students"]),
        "matchingMode": result.get("matching_mode"),
        "assignedStudentCount": result.get("assigned_student_count", inserted),
        "totalStudentCount": result.get("total_student_count"),
        "log": result["log"],
        "relaxationLog": result.get("relaxation_log", []),
        "solverStatus": result.get("solver_status"),
        "objectiveValue": result.get("objective_value"),
    }


@router.post("/api/assignments/reassign")
def reassign_match(
    payload: ReassignMatchPayload,
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, bool]:
    db = get_db()
    draft_oid = oid_or_400(payload.draft_id, detail="Invalid draft_id")
    try:
        match_oid = ObjectId(payload.match_id)
        tutor_oid = ObjectId(payload.tutor_id)
        student_oid = ObjectId(payload.student_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid object id") from exc

    existing = db.matches.find_one({"_id": match_oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Match not found")

    semester = payload.semester or existing.get("semester") or current_semester()
    section_id = existing.get("section_id")

    db.matches.delete_one({"_id": match_oid})
    db.matches.delete_many({"student_id": student_oid, "semester": semester, "draft_id": draft_oid})

    db.matches.insert_one(
        {
            "tutor_id": tutor_oid,
            "student_id": student_oid,
            "section_id": section_id,
            "semester": semester,
            "draft_id": draft_oid,
            "manual_override": True,
            "status": "active",
            "reason": "manual_reassign",
            "createdAt": now_iso(),
        }
    )
    return {"ok": True}


@router.post("/api/assignments/override")
def override_assignment(
    payload: OverridePayload,
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, bool]:
    db = get_db()
    semester = payload.semester or current_semester()
    draft_oid = oid_or_400(payload.draft_id, detail="Invalid draft_id")
    try:
        tutor_oid = ObjectId(payload.tutor_id)
        student_oid = ObjectId(payload.student_id)
        section_oid = ObjectId(payload.section_id) if payload.section_id else None
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid object id") from exc

    db.matches.delete_many({"student_id": student_oid, "semester": semester, "draft_id": draft_oid})
    db.matches.insert_one(
        {
            "tutor_id": tutor_oid,
            "student_id": student_oid,
            "section_id": section_oid,
            "semester": semester,
            "draft_id": draft_oid,
            "manual_override": True,
            "status": "active",
            "reason": "manual_override",
            "createdAt": now_iso(),
        }
    )
    return {"ok": True}


@router.post("/api/last-semester-pairs")
def set_last_semester_pairs(payload: LastSemesterPairsPayload) -> dict[str, bool]:
    db = get_db()
    db.lastSemesterPairs.delete_many({})
    rows = []
    for p in payload.pairs:
        if "tutor_id" in p and "student_id" in p:
            rows.append({"tutor_id": str(p["tutor_id"]), "student_id": str(p["student_id"])})
    if rows:
        db.lastSemesterPairs.insert_many(rows)
    return {"ok": True}


@router.get("/api/subjects")
def list_subjects() -> list[str]:
    return SUBJECTS
