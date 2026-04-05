"""Pydantic request/response models for the HTTP API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, Field, model_validator


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
    additionalNotes: str | None = ""
    requiredTutorId: str | None = None
    preferredTutorId: str | None = None
    familyId: str | None = None
    requiredGender: str = "Any"
    returningStatus: str = "none"
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


class AdminInvitePayload(BaseModel):
    name: str
    email: EmailStr


class CompleteInvitePayload(BaseModel):
    token: str = Field(..., min_length=16)
    password: str = Field(..., min_length=8)


class SectionPayload(BaseModel):
    name: str
    time_block: str | None = ""


class ApplicationStatusPayload(BaseModel):
    applicationStatus: Literal["accepted", "pending", "waitlist"]
    draft_id: str


class BulkAcceptPayload(BaseModel):
    draft_id: str
    collection: Literal["tutors", "tutees"]


class RunMatchingPayload(BaseModel):
    semester: str | None = None
    draft_id: str


class OverridePayload(BaseModel):
    semester: str | None = None
    tutor_id: str
    student_id: str
    section_id: str | None = None
    draft_id: str


class ReassignMatchPayload(BaseModel):
    match_id: str
    tutor_id: str
    student_id: str
    semester: str | None = None
    draft_id: str


class LastSemesterPairsPayload(BaseModel):
    pairs: list[dict[str, str]]


class IndividualMatchPayload(BaseModel):
    """Preview pairwise matcher scores for an individual admin pairing (same rules as CP-SAT edges)."""

    fixed_tutor_id: str | None = None
    fixed_tutee_id: str | None = None
    candidate_tutor_ids: list[str] = Field(default_factory=list)
    candidate_tutee_ids: list[str] = Field(default_factory=list)
    semester: str | None = None
    draft_id: str

    @model_validator(mode="after")
    def exactly_one_anchor(self) -> IndividualMatchPayload:
        has_tutor = bool(self.fixed_tutor_id and str(self.fixed_tutor_id).strip())
        has_tutee = bool(self.fixed_tutee_id and str(self.fixed_tutee_id).strip())
        if has_tutor == has_tutee:
            raise ValueError("Exactly one of fixed_tutor_id or fixed_tutee_id must be provided")
        return self


# ── Drafts ──────────────────────────────────────────────────────────

class CreateDraftPayload(BaseModel):
    name: str
    semester: str | None = None


class UpdateDraftPayload(BaseModel):
    name: str


class DuplicateDraftPayload(BaseModel):
    name: str
