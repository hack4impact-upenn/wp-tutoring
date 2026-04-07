import hashlib
import os
from datetime import datetime, timezone, timedelta
from typing import Any

import jwt
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

from tutoring.mongo import get_db
from tutoring.matching import run_matching_cpsat, SUBJECTS

JWT_SECRET = os.environ.get("JWT_SECRET", "")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is not set in .env")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _create_token(admin_id: str, email: str) -> str:
    payload = {
        "sub": admin_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


_bearer_scheme = HTTPBearer()


def _get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme)) -> dict[str, str]:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"_id": payload["sub"], "email": payload["email"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


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


def _age_ranges_to_grade_prefs(age_ranges: list[str]) -> list[str]:
    mapping = {
        "K-3": ["K", "1", "2", "3"],
        "4-8": ["4", "5", "6", "7", "8"],
        "9-12": ["9", "10", "11", "12"],
    }
    out: list[str] = []
    for r in age_ranges:
        out.extend(mapping.get(r, []))
    return sorted(set(out))


def _normalize_tutor_doc(doc: dict[str, Any]) -> dict[str, Any]:
    """Backfill canonical CP-SAT fields for legacy records."""
    out = dict(doc)
    out.setdefault("maxCapacity", 1)
    out.setdefault("tutorGender", "Unknown")
    out.setdefault("apIbReady", False)
    out.setdefault("returningStudentIds", [])
    out.setdefault("subjectList", out.get("subjects") or [])
    out.setdefault("gradePrefs", _age_ranges_to_grade_prefs(out.get("ageRanges") or []))
    return out


def _sanitize_previous_tutor_ids(raw: list[Any] | None) -> list[str]:
    """Deduplicated list of valid Mongo ObjectId strings for tutee previous tutors."""
    seen: set[str] = set()
    out: list[str] = []
    for x in raw or []:
        s = str(x).strip()
        if not s or s in seen:
            continue
        try:
            ObjectId(s)
        except Exception:
            continue
        seen.add(s)
        out.append(s)
    return out


def _normalize_tutee_doc(doc: dict[str, Any]) -> dict[str, Any]:
    """Backfill canonical CP-SAT fields for legacy records."""
    out = dict(doc)
    out.setdefault("requiredTutorId", None)
    out.setdefault("preferredTutorId", None)
    out.setdefault("familyId", None)
    out.setdefault("requiredGender", "Any")
    out.setdefault("returningStatus", "none")  # one of: none, preferred, required
    out.setdefault("subjectNeeds", out.get("subjects") or [])
    out.setdefault("grade", out.get("studentGrade") or "")
    out.setdefault("preferredTimeSlots", [])
    pt = out.get("previousTutorIds")
    if not isinstance(pt, list):
        out["previousTutorIds"] = []
    else:
        out["previousTutorIds"] = _sanitize_previous_tutor_ids(pt)
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
    # Canonical CP-SAT fields
    maxCapacity: int = Field(default=1, ge=1)
    tutorGender: str = "Unknown"
    apIbReady: bool = False
    returningStudentIds: list[str] = Field(default_factory=list)
    gradePrefs: list[str] = Field(default_factory=list)
    subjectList: list[str] = Field(default_factory=list)


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
    previousTutorIds: list[str] = Field(default_factory=list)
    additionalNotes: str | None = ""
    # Canonical CP-SAT fields
    requiredTutorId: str | None = None
    preferredTutorId: str | None = None
    familyId: str | None = None
    requiredGender: str = "Any"  # Male, Female, Any
    returningStatus: str = "none"  # one of: none, preferred, required
    subjectNeeds: list[str] = Field(default_factory=list)
    grade: str | None = None
    preferredTimeSlots: list[dict[str, str]] = Field(default_factory=list)


class AdminPayload(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "admin"


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
    return [_serialize(_normalize_tutor_doc(t)) for t in db.tutorApplications.find().sort("_id", -1)]


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
        # Canonical CP-SAT fields
        "maxCapacity": payload.maxCapacity,
        "tutorGender": payload.tutorGender,
        "apIbReady": payload.apIbReady,
        "returningStudentIds": payload.returningStudentIds,
        "subjectList": payload.subjectList or payload.subjects,
        "gradePrefs": payload.gradePrefs or _age_ranges_to_grade_prefs(payload.ageRanges),
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
    return _serialize(_normalize_tutor_doc(tutor))


@app.get("/api/tutees")
def list_tutees() -> list[dict[str, Any]]:
    db = get_db()
    return [_serialize(_normalize_tutee_doc(t)) for t in db.tuteeApplications.find().sort("_id", -1)]


@app.get("/api/tutees/lookup")
def lookup_tutee(parentEmail: str = Query(..., min_length=3)) -> dict[str, Any]:
    db = get_db()
    tutee = db.tuteeApplications.find_one(
        {"parentEmail": parentEmail.strip().lower()},
        sort=[("_id", -1)],
    )
    if not tutee:
        raise HTTPException(status_code=404, detail="Not found")
    return _serialize(_normalize_tutee_doc(tutee))


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
        "previousTutorIds": _sanitize_previous_tutor_ids(payload.previousTutorIds),
        "additionalNotes": payload.additionalNotes or "",
        # Canonical CP-SAT fields
        "requiredTutorId": payload.requiredTutorId,
        "preferredTutorId": payload.preferredTutorId,
        "familyId": payload.familyId,
        "requiredGender": payload.requiredGender,
        "returningStatus": payload.returningStatus,
        "subjectNeeds": payload.subjectNeeds or payload.subjects,
        "grade": payload.grade or payload.studentGrade,
        "preferredTimeSlots": payload.preferredTimeSlots,
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


@app.get("/api/admins")
def list_admins() -> list[dict[str, Any]]:
    db = get_db()
    results = []
    for a in db.admins.find().sort("_id", -1):
        doc = _serialize(a)
        doc.pop("password", None)
        results.append(doc)
    return results


@app.post("/api/admins", status_code=201)
def create_admin(payload: AdminPayload) -> dict[str, Any]:
    db = get_db()
    if not payload.name.strip() or not payload.email.strip():
        raise HTTPException(status_code=400, detail="name and email are required")
    existing = db.admins.find_one({"email": payload.email.strip().lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Admin with this email already exists")
    doc = {
        "name": payload.name.strip(),
        "email": payload.email.strip().lower(),
        "password": _hash_password(payload.password),
        "role": payload.role,
        "createdAt": _now_iso(),
    }
    result = db.admins.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    del doc["password"]
    return doc


@app.delete("/api/admins/{admin_id}")
def delete_admin(admin_id: str) -> dict[str, bool]:
    db = get_db()
    try:
        oid = ObjectId(admin_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid admin id") from exc
    result = db.admins.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"ok": True}


@app.post("/api/admin/login")
def admin_login(payload: AdminLoginPayload) -> dict[str, Any]:
    db = get_db()
    admin = db.admins.find_one({"email": payload.email.strip().lower()})
    if not admin:
        raise HTTPException(status_code=401, detail="No account found with this email")
    if admin.get("password") != _hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Incorrect password")
    admin_id = str(admin["_id"])
    token = _create_token(admin_id, admin["email"])
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


@app.get("/api/admin/me")
def admin_me(current: dict[str, str] = Depends(_get_current_admin)) -> dict[str, Any]:
    db = get_db()
    admin = db.admins.find_one({"_id": ObjectId(current["_id"])})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return {
        "_id": str(admin["_id"]),
        "name": admin.get("name", ""),
        "email": admin.get("email", ""),
        "role": admin.get("role", "admin"),
    }


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
        t_snap = (
            _serialize(_normalize_tutor_doc(dict(tutor))) if tutor else None
        )
        s_snap = (
            _serialize(_normalize_tutee_doc(dict(tutee))) if tutee else None
        )
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


@app.post("/api/run-matching")
def run_matching_endpoint(payload: RunMatchingPayload) -> dict[str, Any]:
    db = get_db()
    semester = payload.semester or _current_semester()

    tutor_docs = [_normalize_tutor_doc(dict(t)) for t in db.tutorApplications.find()]
    tutee_docs = [_normalize_tutee_doc(dict(t)) for t in db.tuteeApplications.find()]
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
                "createdAt": _now_iso(),
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
