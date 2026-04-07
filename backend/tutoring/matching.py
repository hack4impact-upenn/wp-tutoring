"""
Matching for West Philadelphia Tutoring Project.

OR-Tools CP-SAT — partial matching (maximize assignments), capacity, overlap (hard),
gender preference (soft), designated-tutor objective bonus (soft), sibling same-tutor equality, relaxation passes.

Legacy greedy matcher is retained as `run_matching` for reference/tests.
"""

from __future__ import annotations

import re
from collections import defaultdict
from typing import Any

from ortools.sat.python import cp_model

SUBJECTS = ["Algebra", "Geometry", "Precalculus", "Calculus AB", "Calculus BC", "Other"]

# Soft-score weights (schema / product plan)
WEIGHT_AGE_MATCH = 100
WEIGHT_SUBJECT_MATCH = 80
WEIGHT_AP_IB = 50
WEIGHT_PREFERRED_TIME = 20
WEIGHT_GENDER_MATCH = 55

# Partial matching: prioritize number of assignments, then soft scores / designated tutor.
# Must exceed the maximum possible soft-score sum for one edge (~305 without preferred-tutor line).
WEIGHT_EACH_ASSIGNED_PAIR = 10_000
# Objective-only bonus: tutee names this tutor via requiredTutorId, preferredTutorId, or previousTutorIds.
WEIGHT_SPECIFIC_TUTOR_PAIR = 5_000


def parse_list(s):
    if not s:
        return []
    return [x.strip() for x in str(s).split(",") if x.strip()]


def subject_score(qualified, needed):
    q = set(parse_list(qualified))
    q_lower = {x.lower() for x in q}
    n = parse_list(needed)
    n_lower = [x.lower() for x in n]
    score = 0
    for s in n_lower:
        if s in q_lower:
            score += 2
        elif "other" in q_lower or any("other" in x for x in n_lower):
            score += 1
    return score


def grade_match(tutor_grades, student_grade):
    grades = []
    for g in parse_list(tutor_grades):
        try:
            grades.append(int(g))
        except ValueError:
            pass
    if not grades:
        return True
    try:
        return int(student_grade) in grades
    except (TypeError, ValueError):
        return False


def _norm_slot(day: str, time: str) -> tuple[str, str]:
    d = (day or "").strip()
    if d:
        d = d[0].upper() + d[1:].lower() if len(d) > 1 else d.upper()
    t = (time or "").strip()
    return (d, t)


def availability_slots(doc: dict[str, Any], key: str = "availability") -> set[tuple[str, str]]:
    out: set[tuple[str, str]] = set()
    for slot in doc.get(key) or []:
        if isinstance(slot, dict):
            out.add(_norm_slot(slot.get("day", ""), slot.get("time", "")))
    return out


def has_time_overlap(tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]) -> bool:
    ta = availability_slots(tutor_doc, "availability")
    tb = availability_slots(tutee_doc, "availability")
    if not ta or not tb:
        return False
    return bool(ta & tb)


def _tutor_oid_str(tutor_doc: dict[str, Any]) -> str:
    oid = tutor_doc.get("_id")
    if oid is None:
        return ""
    return str(oid)


def _tutee_gender_preference(tutee_doc: dict[str, Any]) -> str:
    """Coalesce canonical requiredGender and legacy genderPreference."""
    g = tutee_doc.get("requiredGender")
    if g is None or not str(g).strip():
        g = tutee_doc.get("genderPreference") or "Any"
    return str(g).strip()


def gender_allows(tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]) -> bool:
    """True if tutor satisfies the student's gender preference (Unknown tutor never matches a specific ask)."""
    req = _tutee_gender_preference(tutee_doc)
    if req.lower() in ("any", "no preference", ""):
        return True
    tg = (tutor_doc.get("tutorGender") or "Unknown").strip()
    if tg.lower() == "unknown":
        return False
    return tg.lower() == req.lower()


def gender_match_bonus(tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]) -> bool:
    """Soft: student asked for a specific gender and tutor is known to match."""
    req = _tutee_gender_preference(tutee_doc)
    if req.lower() in ("any", "no preference", ""):
        return False
    tg = (tutor_doc.get("tutorGender") or "Unknown").strip()
    if tg.lower() == "unknown":
        return False
    return tg.lower() == req.lower()


def pair_allowed_hard(tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]) -> bool:
    """Hard feasibility: shared availability only (gender is a soft objective)."""
    return has_time_overlap(tutor_doc, tutee_doc)


def _tutor_capacity(tutor_doc: dict[str, Any]) -> int:
    try:
        c = int(tutor_doc.get("maxCapacity", 1))
    except (TypeError, ValueError):
        c = 1
    return max(1, c)


def find_tutor_index_by_id(tutor_docs: list[dict[str, Any]], tutor_id_str: str | None) -> int | None:
    if not tutor_id_str:
        return None
    for i, t in enumerate(tutor_docs):
        if _tutor_oid_str(t) == str(tutor_id_str).strip():
            return i
    return None


_GRADE_WORDS = [
    ("kindergarten", "K"),
    ("1st", "1"),
    ("2nd", "2"),
    ("3rd", "3"),
    ("4th", "4"),
    ("5th", "5"),
    ("6th", "6"),
    ("7th", "7"),
    ("8th", "8"),
    ("9th", "9"),
    ("10th", "10"),
    ("11th", "11"),
    ("12th", "12"),
]


def tutee_grade_to_pref_token(grade: str | None) -> str | None:
    """Map tutee `grade` / studentGrade text to tokens used in tutor gradePrefs (K, 1..12)."""
    if grade is None:
        return None
    g = str(grade).strip().lower()
    if not g:
        return None
    if g in ("k", "kindergarten"):
        return "K"
    for word, token in _GRADE_WORDS:
        if word in g:
            return token
    m = re.search(r"\b(\d{1,2})\b", g)
    if m:
        n = int(m.group(1))
        if 1 <= n <= 12:
            return str(n)
    return None


def _norm_subject_set(items: list[str] | None) -> set[str]:
    return {str(x).strip().lower() for x in (items or []) if str(x).strip()}


def subject_match_bonus(tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]) -> bool:
    t_sub = _norm_subject_set(tutor_doc.get("subjectList") or tutor_doc.get("subjects"))
    s_need = _norm_subject_set(tutee_doc.get("subjectNeeds") or tutee_doc.get("subjects"))
    if not t_sub or not s_need:
        return False
    return bool(t_sub & s_need)


def age_match_bonus(tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]) -> bool:
    prefs = {str(x).strip() for x in (tutor_doc.get("gradePrefs") or [])}
    token = tutee_grade_to_pref_token(tutee_doc.get("grade")) or tutee_grade_to_pref_token(
        tutee_doc.get("studentGrade")
    )
    if not token or not prefs:
        return False
    return token in prefs


_ADVANCED_NEED_RE = re.compile(
    r"ap\b|ib\b|precalc|pre-calc|calculus|trig|honors",
    re.IGNORECASE,
)


def ap_ib_bonus(tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]) -> bool:
    if not tutor_doc.get("apIbReady"):
        return False
    needs = " ".join(tutee_doc.get("subjectNeeds") or tutee_doc.get("subjects") or [])
    if _ADVANCED_NEED_RE.search(needs):
        return True
    tok = tutee_grade_to_pref_token(tutee_doc.get("grade")) or tutee_grade_to_pref_token(
        tutee_doc.get("studentGrade")
    )
    if tok in ("11", "12"):
        return True
    return False


def preferred_time_bonus(tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]) -> bool:
    pref = tutee_doc.get("preferredTimeSlots") or []
    if not pref:
        return False
    tutor_a = availability_slots(tutor_doc, "availability")
    tutee_a = availability_slots(tutee_doc, "availability")
    pref_s = availability_slots({"availability": pref}, "availability")
    common = tutor_a & tutee_a
    return bool(common & pref_s)


def pair_score_breakdown(
    tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]
) -> list[dict[str, Any]]:
    """
    Ordered soft-score components for an allowed (tutor, tutee) pair.
    Used for explainability; `pair_weight` is the sum of `points`.
    """
    items: list[dict[str, Any]] = []
    if age_match_bonus(tutor_doc, tutee_doc):
        items.append(
            {
                "code": "age_match",
                "points": WEIGHT_AGE_MATCH,
                "label": "Student grade is within tutor grade preferences",
            }
        )
    if gender_match_bonus(tutor_doc, tutee_doc):
        items.append(
            {
                "code": "gender_match",
                "points": WEIGHT_GENDER_MATCH,
                "label": "Tutor gender matches student preference",
            }
        )
    if subject_match_bonus(tutor_doc, tutee_doc):
        items.append(
            {
                "code": "subject_match",
                "points": WEIGHT_SUBJECT_MATCH,
                "label": "At least one subject need matches tutor subject list",
            }
        )
    if ap_ib_bonus(tutor_doc, tutee_doc):
        items.append(
            {
                "code": "ap_ib_readiness",
                "points": WEIGHT_AP_IB,
                "label": "Tutor is AP/IB-ready and student needs or level fit advanced work",
            }
        )
    if preferred_time_bonus(tutor_doc, tutee_doc):
        items.append(
            {
                "code": "preferred_time",
                "points": WEIGHT_PREFERRED_TIME,
                "label": "Shared slot includes a student preferred time",
            }
        )
    return items


def pair_score_explanation(tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]) -> dict[str, Any]:
    """Structured explanation payload for API / persistence."""
    breakdown = pair_score_breakdown(tutor_doc, tutee_doc)
    total = sum(b["points"] for b in breakdown)
    return {
        "totalSoftScore": total,
        "breakdown": breakdown,
        "summary": "; ".join(b["label"] for b in breakdown) if breakdown else "No soft bonuses",
    }


def pair_weight(tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]) -> int:
    """Total soft score for (tutor, tutee) when hard feasibility is satisfied elsewhere."""
    return sum(b["points"] for b in pair_score_breakdown(tutor_doc, tutee_doc))


def _tutee_previous_tutor_id_set(tutee_doc: dict[str, Any]) -> set[str]:
    raw = tutee_doc.get("previousTutorIds") or []
    if not isinstance(raw, list):
        return set()
    return {str(x).strip() for x in raw if str(x).strip()}


def specific_tutor_objective_bonus(tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]) -> int:
    """
    Large objective weight when this pair is a designated tutor for the tutee:
    requiredTutorId, preferredTutorId, or membership in previousTutorIds (at most once per edge).
    """
    tid = _tutor_oid_str(tutor_doc)
    if not tid:
        return 0
    rid = tutee_doc.get("requiredTutorId")
    if rid and str(rid).strip() == tid:
        return WEIGHT_SPECIFIC_TUTOR_PAIR
    pref = tutee_doc.get("preferredTutorId")
    if pref and str(pref).strip() == tid:
        return WEIGHT_SPECIFIC_TUTOR_PAIR
    if tid in _tutee_previous_tutor_id_set(tutee_doc):
        return WEIGHT_SPECIFIC_TUTOR_PAIR
    return 0


def specific_tutor_assignment_reason(
    tutor_doc: dict[str, Any], tutee_doc: dict[str, Any]
) -> str | None:
    """Reason tag when assignment hits the designated-tutor objective (for API / logs)."""
    tid = _tutor_oid_str(tutor_doc)
    if not tid:
        return None
    rid = tutee_doc.get("requiredTutorId")
    if rid and str(rid).strip() == tid:
        if tutee_doc.get("returningStatus") == "required":
            return "required_returning"
        return "required_tutor"
    pref = tutee_doc.get("preferredTutorId")
    if pref and str(pref).strip() == tid:
        return "preferred_tutor"
    if tid in _tutee_previous_tutor_id_set(tutee_doc):
        return "previous_tutor"
    return None


def family_same_tutor_feasible(
    tutor_docs: list[dict[str, Any]],
    tutee_docs: list[dict[str, Any]],
    family_js: list[int],
) -> bool:
    """Some single tutor has enough capacity and is allowed with every sibling."""
    k = len(family_js)
    if k < 2:
        return True
    for i, tdoc in enumerate(tutor_docs):
        if _tutor_capacity(tdoc) < k:
            continue
        ok = True
        for j in family_js:
            if not pair_allowed_hard(tdoc, tutee_docs[j]):
                ok = False
                break
        if ok:
            return True
    return False


def sibling_required_tutor_conflict(tutee_docs: list[dict[str, Any]], family_js: list[int]) -> bool:
    pins: list[str] = []
    for j in family_js:
        s = tutee_docs[j]
        if s.get("returningStatus") != "required":
            continue
        rid = s.get("requiredTutorId")
        if rid:
            pins.append(str(rid).strip())
    return len(pins) >= 2 and len(set(pins)) > 1


def relax_returning_constraints(
    tutor_docs: list[dict[str, Any]],
    tutee_docs: list[dict[str, Any]],
    log: list[str],
) -> None:
    """Downgrade required→preferred when tutor missing or no shared availability with required tutor."""
    for j, s in enumerate(tutee_docs):
        if s.get("returningStatus") != "required":
            continue
        rid = s.get("requiredTutorId")
        if not rid:
            s["returningStatus"] = "preferred"
            log.append(
                f"Relax returning student index {j}: required but no requiredTutorId; status→preferred."
            )
            continue
        ti = find_tutor_index_by_id(tutor_docs, str(rid))
        if ti is None:
            s["returningStatus"] = "preferred"
            s.setdefault("preferredTutorId", str(rid))
            log.append(
                f"Relax returning student index {j}: required tutor id not found; status→preferred."
            )
            continue
        if not pair_allowed_hard(tutor_docs[ti], s):
            s["returningStatus"] = "preferred"
            s.setdefault("preferredTutorId", str(rid))
            log.append(
                f"Relax returning student index {j}: no shared availability with required tutor; status→preferred."
            )


def relax_returning_capacity(
    tutor_docs: list[dict[str, Any]],
    tutee_docs: list[dict[str, Any]],
    log: list[str],
) -> None:
    """If more students require the same tutor than capacity, downgrade excess to preferred."""
    required_by_tutor: dict[int, list[int]] = defaultdict(list)
    for j, s in enumerate(tutee_docs):
        if s.get("returningStatus") != "required":
            continue
        rid = s.get("requiredTutorId")
        if not rid:
            continue
        ti = find_tutor_index_by_id(tutor_docs, str(rid))
        if ti is None:
            continue
        required_by_tutor[ti].append(j)

    for ti, js in required_by_tutor.items():
        cap = _tutor_capacity(tutor_docs[ti])
        if len(js) <= cap:
            continue
        js_sorted = sorted(js)
        keep = js_sorted[:cap]
        drop = js_sorted[cap:]
        for j in drop:
            tutee_docs[j]["returningStatus"] = "preferred"
            rid = tutee_docs[j].get("requiredTutorId")
            if rid:
                tutee_docs[j].setdefault("preferredTutorId", str(rid))
            log.append(
                f"Relax returning student index {j}: required tutor index {ti} at capacity {cap}; "
                f"status→preferred (kept indices {keep})."
            )


def build_sibling_groups(
    tutor_docs: list[dict[str, Any]],
    tutee_docs: list[dict[str, Any]],
    log: list[str],
) -> list[list[int]]:
    """Families with shared familyId: same-tutor constraints if feasible."""
    families: dict[str, list[int]] = defaultdict(list)
    for j, s in enumerate(tutee_docs):
        fid = s.get("familyId")
        if fid is None or fid == "":
            continue
        families[str(fid)].append(j)

    groups: list[list[int]] = []
    for fid, js in families.items():
        if len(js) < 2:
            continue
        js_sorted = sorted(js)
        if sibling_required_tutor_conflict(tutee_docs, js_sorted):
            log.append(
                f"Sibling constraint relaxed for family {fid!r}: conflicting requiredTutorId across siblings."
            )
            continue
        if not family_same_tutor_feasible(tutor_docs, tutee_docs, js_sorted):
            log.append(
                f"Sibling constraint relaxed for family {fid!r}: no single tutor can cover all {len(js_sorted)} "
                f"siblings (time/gender/capacity)."
            )
            continue
        groups.append(js_sorted)
    return groups


def run_matching_cpsat(
    tutor_docs: list[dict[str, Any]],
    tutee_docs: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    CP-SAT (partial): maximize the number of assignments, then soft scores and returning bias, subject to:
      - each tutee has at most one tutor with shared availability,
      - each tutor at most maxCapacity,
      - designated tutor (required / preferred / previous tutor ids) get objective bonus (no hard pin),
      - siblings with the same familyId share the same tutor (when not relaxed).

    tutor_docs / tutee_docs must include normalized canonical fields (see matching_schema_contract.md).
    Documents are copied; returning-status relaxations apply only in-memory for this solve.
    """
    tutor_work = [dict(t) for t in tutor_docs]
    tutee_work = [dict(t) for t in tutee_docs]
    relaxation_log: list[str] = []

    relax_returning_constraints(tutor_work, tutee_work, relaxation_log)
    relax_returning_capacity(tutor_work, tutee_work, relaxation_log)
    sibling_groups = build_sibling_groups(tutor_work, tutee_work, relaxation_log)

    return _solve_cpsat_core(
        tutor_work,
        tutee_work,
        sibling_groups,
        relaxation_log,
    )


def _solve_cpsat_core(
    tutor_docs: list[dict[str, Any]],
    tutee_docs: list[dict[str, Any]],
    sibling_groups: list[list[int]],
    relaxation_log: list[str],
) -> dict[str, Any]:
    n_t = len(tutor_docs)
    n_s = len(tutee_docs)

    if n_s == 0:
        return {
            "assignments": [],
            "unassigned_tutors": list(range(n_t)),
            "unassigned_students": [],
            "log": ["No students to match."],
            "solver_status": "OPTIMAL",
            "objective_value": 0.0,
            "cpsat_status": cp_model.OPTIMAL,
            "relaxation_log": list(relaxation_log),
            "matching_mode": "partial_max_assignments",
        }

    if n_t == 0:
        return {
            "assignments": [],
            "unassigned_tutors": [],
            "unassigned_students": list(range(n_s)),
            "log": ["No tutors available; zero assignments (partial matching)."],
            "solver_status": "OPTIMAL",
            "objective_value": 0.0,
            "cpsat_status": cp_model.OPTIMAL,
            "relaxation_log": list(relaxation_log),
            "matching_mode": "partial_max_assignments",
        }

    caps = [_tutor_capacity(t) for t in tutor_docs]

    model = cp_model.CpModel()
    x: dict[tuple[int, int], Any] = {}
    soft_weights: dict[tuple[int, int], int] = {}

    for i in range(n_t):
        for j in range(n_s):
            name = f"x_t{i}_s{j}"
            x[(i, j)] = model.NewBoolVar(name)
            if not pair_allowed_hard(tutor_docs[i], tutee_docs[j]):
                model.Add(x[(i, j)] == 0)
                soft_weights[(i, j)] = 0
            else:
                soft_weights[(i, j)] = pair_weight(tutor_docs[i], tutee_docs[j])

    for i in range(n_t):
        model.Add(sum(x[(i, j)] for j in range(n_s)) <= caps[i])

    for j in range(n_s):
        model.Add(sum(x[(i, j)] for i in range(n_t)) <= 1)

    for fam in sibling_groups:
        s0 = fam[0]
        for j in fam[1:]:
            for i in range(n_t):
                model.Add(x[(i, s0)] == x[(i, j)])

    obj = sum(
        (
            WEIGHT_EACH_ASSIGNED_PAIR
            + soft_weights[(i, j)]
            + specific_tutor_objective_bonus(tutor_docs[i], tutee_docs[j])
        )
        * x[(i, j)]
        for i in range(n_t)
        for j in range(n_s)
    )
    model.Maximize(obj)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 60.0
    status = solver.Solve(model)

    log: list[str] = []
    assignments: list[dict[str, Any]] = []

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        log.append(f"CP-SAT finished with status {solver.StatusName(status)} (infeasible or error).")
        return {
            "assignments": [],
            "unassigned_tutors": list(range(n_t)),
            "unassigned_students": list(range(n_s)),
            "log": log,
            "solver_status": solver.StatusName(status),
            "objective_value": None,
            "cpsat_status": status,
            "relaxation_log": list(relaxation_log),
            "matching_mode": "partial_max_assignments",
        }

    assigned_t = set()
    assigned_s = set()
    objective_value = float(solver.ObjectiveValue())

    for i in range(n_t):
        for j in range(n_s):
            if solver.Value(x[(i, j)]) == 1:
                w = soft_weights[(i, j)]
                reason = specific_tutor_assignment_reason(tutor_docs[i], tutee_docs[j]) or "cpsat"
                expl = pair_score_explanation(tutor_docs[i], tutee_docs[j])
                assignments.append(
                    {
                        "tutor_index": i,
                        "student_index": j,
                        "score": w,
                        "reason": reason,
                        "explanation": expl,
                    }
                )
                assigned_t.add(i)
                assigned_s.add(j)
                log.append(
                    f"Matched tutor index {i} to student index {j} (pair weight {w})."
                )

    unassigned_tutors = [i for i in range(n_t) if i not in assigned_t]
    unassigned_students = [j for j in range(n_s) if j not in assigned_s]

    n_assign = len(assignments)
    log.insert(
        0,
        f"CP-SAT {solver.StatusName(status)}; partial matching: {n_assign}/{n_s} students assigned; "
        f"objective {objective_value:.0f}",
    )

    full_log = list(relaxation_log) + ["---"] + log

    return {
        "assignments": assignments,
        "unassigned_tutors": unassigned_tutors,
        "unassigned_students": unassigned_students,
        "log": full_log,
        "solver_status": solver.StatusName(status),
        "objective_value": objective_value,
        "cpsat_status": status,
        "relaxation_log": list(relaxation_log),
        "matching_mode": "partial_max_assignments",
        "assigned_student_count": n_assign,
        "total_student_count": n_s,
    }


def run_matching(tutors, students, sections, last_semester_pairs=None):
    """
    Run matching. Expects lists of dicts with id, subjects, grade_levels, subjects_needed,
    sibling_ids, grade_level. sections list of dicts with id.
    last_semester_pairs list of dicts with tutor_id, student_id.
    Returns dict: assignments, unassigned_tutors, unassigned_students, log.
    """
    last_semester_pairs = last_semester_pairs or []
    assignments = []
    used_tutor = set()
    used_student = set()
    section_slots = {s["id"]: [] for s in (sections or [])}
    log = []

    def tutor_by_id(tid):
        return next((t for t in tutors if t["id"] == tid), None)

    def student_by_id(sid):
        return next((s for s in students if s["id"] == sid), None)

    # 1) Restore previous semester pairs
    for pair in last_semester_pairs:
        tutor_id = pair["tutor_id"]
        student_id = pair["student_id"]
        tutor = tutor_by_id(tutor_id)
        student = student_by_id(student_id)
        if not tutor or not student or tutor_id in used_tutor or student_id in used_student:
            continue
        section_id = sections[0]["id"] if sections else None
        assignments.append(
            {
                "tutor_id": tutor_id,
                "student_id": student_id,
                "section_id": section_id,
                "reason": "previous_pair",
            }
        )
        used_tutor.add(tutor_id)
        used_student.add(student_id)
        if section_id is not None:
            section_slots[section_id].append(student_id)
        log.append(f"Matched tutor {tutor_id} with student {student_id} (previous pair)")

    # 2) Siblings in same section
    sibling_groups = {}
    for s in students:
        if s["id"] in used_student:
            continue
        sib_ids = []
        for x in parse_list(s.get("sibling_ids") or ""):
            try:
                sib_ids.append(int(x))
            except ValueError:
                pass
        if not sib_ids:
            continue
        key = "-".join(str(x) for x in sorted([s["id"]] + sib_ids))
        if key not in sibling_groups:
            sibling_groups[key] = [x for x in [s["id"]] + sib_ids if x not in used_student]

    for ids in sibling_groups.values():
        if not ids:
            continue
        section_id = sections[0]["id"] if sections else None
        for student_id in ids:
            student = student_by_id(student_id)
            if not student or student_id in used_student:
                continue
            best_tutor = None
            best_score = -1
            for t in tutors:
                if t["id"] in used_tutor:
                    continue
                score = subject_score(t.get("subjects") or "", student.get("subjects_needed") or "")
                grade_ok = grade_match(t.get("grade_levels") or "", student.get("grade_level"))
                if grade_ok and score > best_score:
                    best_score = score
                    best_tutor = t
            if best_tutor:
                assignments.append(
                    {
                        "tutor_id": best_tutor["id"],
                        "student_id": student_id,
                        "section_id": section_id,
                        "reason": "sibling_same_section",
                    }
                )
                used_tutor.add(best_tutor["id"])
                used_student.add(student_id)
                if section_id is not None:
                    section_slots[section_id].append(student_id)
                log.append(
                    f"Matched tutor {best_tutor['id']} with student {student_id} (sibling group, section {section_id})"
                )

    # 3) Remaining: best subject/level fit
    remaining_students = [s for s in students if s["id"] not in used_student]
    for student in remaining_students:
        best = None
        best_score = -1
        for t in tutors:
            if t["id"] in used_tutor:
                continue
            score = subject_score(t.get("subjects") or "", student.get("subjects_needed") or "")
            grade_ok = grade_match(t.get("grade_levels") or "", student.get("grade_level"))
            if grade_ok and score > best_score:
                best_score = score
                best = t
        if best:
            section_id = sections[0]["id"] if sections else None
            assignments.append(
                {
                    "tutor_id": best["id"],
                    "student_id": student["id"],
                    "section_id": section_id,
                    "reason": "subject_fit",
                }
            )
            used_tutor.add(best["id"])
            used_student.add(student["id"])
            if section_id is not None:
                section_slots[section_id].append(student["id"])
            log.append(f"Matched tutor {best['id']} with student {student['id']} (subject/level fit)")

    unassigned_tutors = [t["id"] for t in tutors if t["id"] not in used_tutor]
    unassigned_students = [s["id"] for s in students if s["id"] not in used_student]

    return {
        "assignments": assignments,
        "unassigned_tutors": unassigned_tutors,
        "unassigned_students": unassigned_students,
        "log": log,
    }
