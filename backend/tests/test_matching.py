"""Fixture tests for CP-SAT matching, score breakdown, and explanations."""

from __future__ import annotations

from bson import ObjectId

from tutoring.matching import (
    WEIGHT_PREFERRED_TUTOR,
    WEIGHT_SUBJECT_MATCH,
    gender_allows,
    pair_allowed_hard,
    pair_score_breakdown,
    pair_score_explanation,
    pair_weight,
    run_matching_cpsat,
)


def _tutor(oid: ObjectId | None = None, **kwargs: object) -> dict:
    d: dict = {
        "_id": oid or ObjectId(),
        "availability": [{"day": "Monday", "time": "4:00 PM"}],
        "subjectList": ["Math"],
        "gradePrefs": ["5"],
        "tutorGender": "Female",
        "maxCapacity": 2,
        "apIbReady": False,
    }
    d.update(kwargs)
    return d


def _tutee(oid: ObjectId | None = None, **kwargs: object) -> dict:
    d: dict = {
        "_id": oid or ObjectId(),
        "availability": [{"day": "Monday", "time": "4:00 PM"}],
        "subjectNeeds": ["Math"],
        "grade": "5th Grade",
        "requiredGender": "Any",
        "returningStatus": "none",
        "familyId": None,
    }
    d.update(kwargs)
    return d


def test_pair_weight_matches_breakdown_sum() -> None:
    t = _tutor()
    s = _tutee()
    bd = pair_score_breakdown(t, s)
    assert sum(x["points"] for x in bd) == pair_weight(t, s)
    expl = pair_score_explanation(t, s)
    assert expl["totalSoftScore"] == pair_weight(t, s)
    codes = {x["code"] for x in bd}
    assert "age_match" in codes
    assert "subject_match" in codes


def test_pair_score_explanation_preferred_tutor() -> None:
    tid = ObjectId()
    t = _tutor(tid)
    s = _tutee(preferredTutorId=str(tid))
    expl = pair_score_explanation(t, s)
    codes = [x["code"] for x in expl["breakdown"]]
    assert "preferred_tutor" in codes
    assert WEIGHT_PREFERRED_TUTOR in [x["points"] for x in expl["breakdown"]]


def test_gender_strict_blocks_pair() -> None:
    t = _tutor(tutorGender="Male")
    s = _tutee(requiredGender="Female")
    assert not gender_allows(t, s)
    assert not pair_allowed_hard(t, s)


def test_required_returning_pin_and_reason() -> None:
    tid = ObjectId()
    t = _tutor(tid)
    s = _tutee(requiredTutorId=str(tid), returningStatus="required")
    r = run_matching_cpsat([t], [s])
    assert r["solver_status"] == "OPTIMAL"
    assert len(r["assignments"]) == 1
    a = r["assignments"][0]
    assert a["reason"] == "required_returning"
    assert "explanation" in a
    assert a["explanation"]["totalSoftScore"] == a["score"]


def test_relax_returning_then_assign_alternate_tutor() -> None:
    bad_id = ObjectId()
    good_id = ObjectId()
    bad_t = _tutor(bad_id)
    good_t = _tutor(
        good_id,
        availability=[{"day": "Tuesday", "time": "4:00 PM"}],
    )
    s = _tutee(
        requiredTutorId=str(bad_id),
        returningStatus="required",
        availability=[{"day": "Tuesday", "time": "4:00 PM"}],
    )
    r = run_matching_cpsat([bad_t, good_t], [s])
    assert any("Relax" in line for line in r["relaxation_log"])
    assert r["solver_status"] == "OPTIMAL"
    assert r["assignments"][0]["tutor_index"] == 1
    assert "explanation" in r["assignments"][0]


def test_siblings_same_tutor() -> None:
    fam = "family-a"
    t = _tutor(maxCapacity=2)
    sa = _tutee(familyId=fam)
    sb = _tutee(familyId=fam)
    r = run_matching_cpsat([t], [sa, sb])
    assert r["solver_status"] == "OPTIMAL"
    assert r["assignments"][0]["tutor_index"] == r["assignments"][1]["tutor_index"]


def test_partial_matching_assigns_up_to_capacity() -> None:
    """Three tutees, one tutor cap 1 — only one assignment; still OPTIMAL."""
    t = _tutor(maxCapacity=1)
    s1, s2, s3 = _tutee(), _tutee(), _tutee()
    r = run_matching_cpsat([t], [s1, s2, s3])
    assert r["solver_status"] in ("OPTIMAL", "FEASIBLE")
    assert len(r["assignments"]) == 1
    assert len(r["unassigned_students"]) == 2


def test_no_tutors_returns_optimal_zero_assignments() -> None:
    r = run_matching_cpsat([], [_tutee()])
    assert r["solver_status"] == "OPTIMAL"
    assert r["assignments"] == []
    assert len(r["unassigned_students"]) == 1


def test_sibling_constraint_relaxed_when_insufficient_capacity() -> None:
    fam = "family-b"
    t = _tutor(maxCapacity=1)
    t2 = _tutor(
        availability=[{"day": "Monday", "time": "4:00 PM"}],
        tutorGender="Female",
        maxCapacity=1,
    )
    sa = _tutee(familyId=fam)
    sb = _tutee(familyId=fam)
    r = run_matching_cpsat([t, t2], [sa, sb])
    assert any("Sibling constraint relaxed" in x for x in r["relaxation_log"])
    assert r["solver_status"] == "OPTIMAL"


def test_breakdown_codes_distinct() -> None:
    t = _tutor(apIbReady=True, subjectList=["Math", "Calculus AB"])
    s = _tutee(
        subjectNeeds=["Calculus AB"],
        preferredTimeSlots=[{"day": "Monday", "time": "4:00 PM"}],
    )
    bd = pair_score_breakdown(t, s)
    codes = [x["code"] for x in bd]
    assert len(codes) == len(set(codes))
    assert "ap_ib_readiness" in codes
    assert "subject_match" in codes
    assert WEIGHT_SUBJECT_MATCH in [x["points"] for x in bd]
