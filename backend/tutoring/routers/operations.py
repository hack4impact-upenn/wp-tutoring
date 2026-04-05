"""Sections, matching, assignments, and reference data."""

from __future__ import annotations

from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from tutoring.common import accepted_for_matching_filter, current_semester, now_iso
from tutoring.matching import SUBJECTS, run_matching_cpsat
from tutoring.mongo import get_db
from tutoring.structures.documents import (
    normalize_tutee_doc,
    normalize_tutor_doc,
    serialize,
)
from tutoring.structures.schemas import (
    LastSemesterPairsPayload,
    OverridePayload,
    ReassignMatchPayload,
    RunMatchingPayload,
    SectionPayload,
)
from tutoring.utils.jwt import get_current_admin

router = APIRouter(tags=["operations"])


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


@router.get("/api/assignments")
def list_assignments(semester: str | None = None) -> list[dict[str, Any]]:
    db = get_db()
    semester = semester or current_semester()
    rows = list(db.matches.find({"semester": semester, "status": "active"}).sort("_id", 1))
    out: list[dict[str, Any]] = []
    for row in rows:
        tutor = db.tutorApplications.find_one({"_id": row["tutor_id"]}) if row.get("tutor_id") else None
        tutee = db.tuteeApplications.find_one({"_id": row["student_id"]}) if row.get("student_id") else None
        t_snap = serialize(normalize_tutor_doc(dict(tutor))) if tutor else None
        s_snap = serialize(normalize_tutee_doc(dict(tutee))) if tutee else None
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


@router.post("/api/run-matching")
def run_matching_endpoint(payload: RunMatchingPayload) -> dict[str, Any]:
    db = get_db()
    semester = payload.semester or current_semester()

    af = accepted_for_matching_filter()
    tutor_docs = [normalize_tutor_doc(dict(t)) for t in db.tutorApplications.find(af)]
    tutee_docs = [normalize_tutee_doc(dict(t)) for t in db.tuteeApplications.find(af)]
    section_docs = list(db.sections.find())
    if not section_docs:
        sid = db.sections.insert_one({"name": "Section A", "time_block": "TBD"}).inserted_id
        section_docs = [{"_id": sid, "name": "Section A", "time_block": "TBD"}]

    tutor_map: dict[int, Any] = {i: t["_id"] for i, t in enumerate(tutor_docs)}
    student_map: dict[int, Any] = {j: s["_id"] for j, s in enumerate(tutee_docs)}

    result = run_matching_cpsat(tutor_docs=tutor_docs, tutee_docs=tutee_docs)
    db.matches.delete_many({"semester": semester})

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
    db.matches.delete_many({"student_id": student_oid, "semester": semester})

    db.matches.insert_one(
        {
            "tutor_id": tutor_oid,
            "student_id": student_oid,
            "section_id": section_id,
            "semester": semester,
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
    try:
        tutor_oid = ObjectId(payload.tutor_id)
        student_oid = ObjectId(payload.student_id)
        section_oid = ObjectId(payload.section_id) if payload.section_id else None
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid object id") from exc

    db.matches.delete_many({"student_id": student_oid, "semester": semester})
    db.matches.insert_one(
        {
            "tutor_id": tutor_oid,
            "student_id": student_oid,
            "section_id": section_oid,
            "semester": semester,
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
