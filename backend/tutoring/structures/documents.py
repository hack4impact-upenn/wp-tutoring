"""Mongo document normalization and payload-to-document mapping."""

from __future__ import annotations

from typing import Any

from tutoring.common import now_iso
from tutoring.structures.schemas import TuteePayload, TutorPayload


def serialize(doc: dict[str, Any]) -> dict[str, Any]:
    out = dict(doc)
    if "_id" in out:
        out["_id"] = str(out["_id"])
    return out


def age_ranges_to_grade_prefs(age_ranges: list[str]) -> list[str]:
    mapping = {
        "K-3": ["K", "1", "2", "3"],
        "4-8": ["4", "5", "6", "7", "8"],
        "9-12": ["9", "10", "11", "12"],
    }
    out: list[str] = []
    for r in age_ranges:
        out.extend(mapping.get(r, []))
    return sorted(set(out))


def normalize_tutor_doc(doc: dict[str, Any]) -> dict[str, Any]:
    """Backfill canonical CP-SAT fields for legacy records."""
    out = dict(doc)
    out.setdefault("maxCapacity", 1)
    out.setdefault("tutorGender", "Unknown")
    out.setdefault("apIbReady", False)
    out.setdefault("returningStudentIds", [])
    out.setdefault("subjectList", out.get("subjects") or [])
    out.setdefault("gradePrefs", age_ranges_to_grade_prefs(out.get("ageRanges") or []))
    if "applicationStatus" not in out:
        out["applicationStatus"] = "accepted"
    return out


def normalize_tutee_doc(doc: dict[str, Any]) -> dict[str, Any]:
    """Backfill canonical CP-SAT fields for legacy records."""
    out = dict(doc)
    out.setdefault("requiredTutorId", None)
    out.setdefault("preferredTutorId", None)
    out.setdefault("familyId", None)
    out.setdefault("requiredGender", "Any")
    out.setdefault("returningStatus", "none")
    out.setdefault("subjectNeeds", out.get("subjects") or [])
    out.setdefault("grade", out.get("studentGrade") or "")
    out.setdefault("preferredTimeSlots", [])
    if "applicationStatus" not in out:
        out["applicationStatus"] = "accepted"
    return out


def tutor_application_doc_from_payload(payload: TutorPayload) -> dict[str, Any]:
    """Mongo document for a new or replaced tutor application (no _id)."""
    return {
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
        "maxCapacity": payload.maxCapacity,
        "tutorGender": payload.tutorGender,
        "apIbReady": payload.apIbReady,
        "returningStudentIds": payload.returningStudentIds,
        "subjectList": payload.subjectList or payload.subjects,
        "gradePrefs": payload.gradePrefs or age_ranges_to_grade_prefs(payload.ageRanges),
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
        "applicationStatus": "pending",
    }


def tutee_application_doc_from_payload(payload: TuteePayload) -> dict[str, Any]:
    """Mongo document for a new tutee application (no _id)."""
    return {
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
        "requiredTutorId": payload.requiredTutorId,
        "preferredTutorId": payload.preferredTutorId,
        "familyId": payload.familyId,
        "requiredGender": payload.requiredGender,
        "returningStatus": payload.returningStatus,
        "subjectNeeds": payload.subjectNeeds or payload.subjects,
        "grade": payload.grade or payload.studentGrade,
        "preferredTimeSlots": payload.preferredTimeSlots,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
        "applicationStatus": "pending",
    }
