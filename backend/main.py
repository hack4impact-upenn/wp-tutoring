import os
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from tutoring.mongo import get_db
from tutoring.matching import run_matching, SUBJECTS


app = FastAPI(title="WPTP API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _serialize(doc: dict[str, Any]) -> dict[str, Any]:
    out = dict(doc)
    if "_id" in out:
        out["_id"] = str(out["_id"])
    return out


class TutorPayload(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    pennId: str | None = ""
    phone: str | None = ""
    year: str
    availability: list[dict[str, str]]
    format: str = "Either"
    subjects: list[str]
    ageRanges: list[str]
    previousTuteeNames: str | None = ""
    additionalNotes: str | None = ""


class TuteePayload(BaseModel):
    studentFirstName: str
    studentLastName: str
    studentAge: int = 0
    studentGrade: str
    parentFirstName: str
    parentLastName: str
    parentEmail: EmailStr
    parentPhone: str | None = ""
    availability: list[dict[str, str]]
    format: str = "Either"
    subjects: list[str]
    genderPreference: str = "No Preference"
    siblingNames: str | None = ""
    siblingPreference: str = "No Preference"
    previousTutorNames: str | None = ""
    additionalNotes: str | None = ""


class AdminLoginPayload(BaseModel):
    email: EmailStr
    password: str


class SectionPayload(BaseModel):
    name: str
    time_block: str | None = ""


class RunMatchingPayload(BaseModel):
    semester: str | None = None


class OverridePayload(BaseModel):
    semester: str | None = None
    tutor_id: str
    student_id: str
    section_id: str | None = None


class LastSemesterPairsPayload(BaseModel):
    pairs: list[dict[str, str]]


def _current_semester() -> str:
    d = datetime.now(timezone.utc)
    return f"{d.year}-S{'2' if d.month >= 6 else '1'}"


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/tutors")
def list_tutors() -> list[dict[str, Any]]:
    db = get_db()
    return [_serialize(t) for t in db.tutorApplications.find().sort("_id", -1)]


@app.post("/api/tutors", status_code=201)
def create_tutor(payload: TutorPayload) -> dict[str, Any]:
    db = get_db()

    doc = {
        "firstName": payload.firstName.strip(),
        "lastName": payload.lastName.strip(),
        "email": payload.email.strip().lower(),
        "pennId": (payload.pennId or "").strip(),
        "phone": (payload.phone or "").strip(),
        "year": payload.year,
        "availability": payload.availability,
        "format": payload.format,
        "subjects": payload.subjects,
        "ageRanges": payload.ageRanges,
        "previousTuteeNames": payload.previousTuteeNames or "",
        "additionalNotes": payload.additionalNotes or "",
        "createdAt": _now_iso(),
        "updatedAt": _now_iso(),
    }

    if not doc["firstName"] or not doc["lastName"] or not doc["email"]:
        raise HTTPException(status_code=400, detail="firstName, lastName, and email are required")

    penn_id = doc["pennId"]
    if penn_id:
        existing = db.tutorApplications.find_one({"pennId": penn_id})
        if existing:
            db.tutorApplications.replace_one({"_id": existing["_id"]}, doc)
            doc["_id"] = str(existing["_id"])
            return doc

    result = db.tutorApplications.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@app.get("/api/tutors/lookup")
def lookup_tutor(pennId: str = Query(..., min_length=1)) -> dict[str, Any]:
    db = get_db()
    tutor = db.tutorApplications.find_one({"pennId": pennId.strip()})
    if not tutor:
        raise HTTPException(status_code=404, detail="Not found")
    return _serialize(tutor)


@app.get("/api/tutees")
def list_tutees() -> list[dict[str, Any]]:
    db = get_db()
    return [_serialize(t) for t in db.tuteeApplications.find().sort("_id", -1)]


@app.get("/api/tutees/lookup")
def lookup_tutee(parentEmail: str = Query(..., min_length=3)) -> dict[str, Any]:
    db = get_db()
    tutee = db.tuteeApplications.find_one(
        {"parentEmail": parentEmail.strip().lower()},
        sort=[("_id", -1)],
    )
    if not tutee:
        raise HTTPException(status_code=404, detail="Not found")
    return _serialize(tutee)


@app.get("/api/students")
def list_students_alias() -> list[dict[str, Any]]:
    return list_tutees()


@app.post("/api/tutees", status_code=201)
def create_tutee(payload: TuteePayload) -> dict[str, Any]:
    db = get_db()

    doc = {
        "studentFirstName": payload.studentFirstName.strip(),
        "studentLastName": payload.studentLastName.strip(),
        "studentAge": payload.studentAge,
        "studentGrade": payload.studentGrade,
        "parentFirstName": payload.parentFirstName.strip(),
        "parentLastName": payload.parentLastName.strip(),
        "parentEmail": payload.parentEmail.strip().lower(),
        "parentPhone": (payload.parentPhone or "").strip(),
        "availability": payload.availability,
        "format": payload.format,
        "subjects": payload.subjects,
        "genderPreference": payload.genderPreference,
        "siblingNames": payload.siblingNames or "",
        "siblingPreference": payload.siblingPreference,
        "previousTutorNames": payload.previousTutorNames or "",
        "additionalNotes": payload.additionalNotes or "",
        "createdAt": _now_iso(),
        "updatedAt": _now_iso(),
    }

    if not doc["studentFirstName"] or not doc["studentLastName"] or not doc["parentEmail"]:
        raise HTTPException(
            status_code=400,
            detail="studentFirstName, studentLastName, and parentEmail are required",
        )

    result = db.tuteeApplications.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@app.post("/api/admin/login")
def admin_login(payload: AdminLoginPayload) -> dict[str, bool]:
    expected_email = os.environ.get("ADMIN_EMAIL", "admin@wptp.edu").lower()
    expected_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    if payload.email.lower() != expected_email or payload.password != expected_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"ok": True}


@app.get("/api/sections")
def list_sections() -> list[dict[str, Any]]:
    db = get_db()
    return [_serialize(s) for s in db.sections.find().sort("_id", 1)]


@app.post("/api/sections")
def create_section(payload: SectionPayload) -> dict[str, Any]:
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Section name required")
    db = get_db()
    doc = {"name": payload.name.strip(), "time_block": (payload.time_block or "").strip()}
    result = db.sections.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@app.get("/api/assignments")
def list_assignments(semester: str | None = None) -> list[dict[str, Any]]:
    db = get_db()
    semester = semester or _current_semester()
    rows = list(db.matches.find({"semester": semester, "status": "active"}).sort("_id", 1))
    out: list[dict[str, Any]] = []
    for row in rows:
        tutor = db.tutorApplications.find_one({"_id": row["tutor_id"]}) if row.get("tutor_id") else None
        tutee = db.tuteeApplications.find_one({"_id": row["student_id"]}) if row.get("student_id") else None
        out.append(
            {
                "id": str(row["_id"]),
                "tutor_id": str(row.get("tutor_id")) if row.get("tutor_id") else None,
                "student_id": str(row.get("student_id")) if row.get("student_id") else None,
                "section_id": str(row.get("section_id")) if row.get("section_id") else None,
                "semester": row.get("semester"),
                "manual_override": bool(row.get("manual_override", False)),
                "tutor_name": f"{(tutor or {}).get('firstName', '')} {(tutor or {}).get('lastName', '')}".strip(),
                "tutor_email": (tutor or {}).get("email"),
                "student_name": f"{(tutee or {}).get('studentFirstName', '')} {(tutee or {}).get('studentLastName', '')}".strip(),
                "student_email": (tutee or {}).get("parentEmail"),
            }
        )
    return out


@app.post("/api/run-matching")
def run_matching_endpoint(payload: RunMatchingPayload) -> dict[str, Any]:
    db = get_db()
    semester = payload.semester or _current_semester()

    tutor_docs = list(db.tutorApplications.find())
    tutee_docs = list(db.tuteeApplications.find())
    section_docs = list(db.sections.find())
    if not section_docs:
        sid = db.sections.insert_one({"name": "Section A", "time_block": "TBD"}).inserted_id
        section_docs = [{"_id": sid, "name": "Section A", "time_block": "TBD"}]

    tutor_map: dict[int, Any] = {}
    student_map: dict[int, Any] = {}
    tutors = []
    students = []

    for idx, t in enumerate(tutor_docs, start=1):
        tutor_map[idx] = t["_id"]
        tutors.append(
            {
                "id": idx,
                "subjects": ", ".join(t.get("subjects") or []),
                "grade_levels": ", ".join(
                    {"K-3": "1,2,3", "4-8": "4,5,6,7,8", "9-12": "9,10,11,12"}.get(x, "")
                    for x in (t.get("ageRanges") or [])
                ),
            }
        )

    for idx, s in enumerate(tutee_docs, start=1):
        student_map[idx] = s["_id"]
        grade = s.get("studentGrade", "")
        digits = "".join(ch for ch in str(grade) if ch.isdigit())
        students.append(
            {
                "id": idx,
                "subjects_needed": ", ".join(s.get("subjects") or []),
                "grade_level": int(digits) if digits else None,
                "sibling_ids": "",
            }
        )

    sections = [{"id": i + 1, "name": sec.get("name", ""), "time_block": sec.get("time_block", "")} for i, sec in enumerate(section_docs)]
    last_pairs = []
    for p in db.lastSemesterPairs.find():
        try:
            last_pairs.append({"tutor_id": int(p["tutor_id"]), "student_id": int(p["student_id"])})
        except Exception:
            continue

    result = run_matching(tutors=tutors, students=students, sections=sections, last_semester_pairs=last_pairs)
    db.matches.delete_many({"semester": semester})

    inserted = 0
    for a in result["assignments"]:
        tutor_oid = tutor_map.get(a["tutor_id"])
        student_oid = student_map.get(a["student_id"])
        section_oid = section_docs[(a.get("section_id", 1) - 1)]["_id"] if section_docs else None
        if not tutor_oid or not student_oid:
            continue
        db.matches.insert_one(
            {
                "tutor_id": tutor_oid,
                "student_id": student_oid,
                "section_id": section_oid,
                "semester": semester,
                "manual_override": False,
                "status": "active",
                "reason": a.get("reason", "subject_fit"),
                "createdAt": _now_iso(),
            }
        )
        inserted += 1

    return {
        "semester": semester,
        "assignmentsCount": inserted,
        "unassignedTutors": len(result["unassigned_tutors"]),
        "unassignedStudents": len(result["unassigned_students"]),
        "log": result["log"],
    }


@app.post("/api/assignments/override")
def override_assignment(payload: OverridePayload) -> dict[str, bool]:
    db = get_db()
    semester = payload.semester or _current_semester()
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
            "createdAt": _now_iso(),
        }
    )
    return {"ok": True}


@app.post("/api/last-semester-pairs")
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


@app.get("/api/subjects")
def list_subjects() -> list[str]:
    return SUBJECTS
