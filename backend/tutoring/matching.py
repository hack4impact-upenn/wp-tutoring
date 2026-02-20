"""
Matching algorithm for West Philadelphia Tutoring Project.
Priorities: 1) previous pairs, 2) siblings same section, 3) subject/level fit.
"""

SUBJECTS = ['Algebra', 'Geometry', 'Precalculus', 'Calculus AB', 'Calculus BC', 'Other']


def parse_list(s):
    if not s:
        return []
    return [x.strip() for x in str(s).split(',') if x.strip()]


def subject_score(qualified, needed):
    q = set(parse_list(qualified))
    q_lower = {x.lower() for x in q}
    n = parse_list(needed)
    n_lower = [x.lower() for x in n]
    score = 0
    for s in n_lower:
        if s in q_lower:
            score += 2
        elif 'other' in q_lower or any('other' in x for x in n_lower):
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
    section_slots = {s['id']: [] for s in (sections or [])}
    log = []

    def tutor_by_id(tid):
        return next((t for t in tutors if t['id'] == tid), None)

    def student_by_id(sid):
        return next((s for s in students if s['id'] == sid), None)

    # 1) Restore previous semester pairs
    for pair in last_semester_pairs:
        tutor_id = pair['tutor_id']
        student_id = pair['student_id']
        tutor = tutor_by_id(tutor_id)
        student = student_by_id(student_id)
        if not tutor or not student or tutor_id in used_tutor or student_id in used_student:
            continue
        section_id = sections[0]['id'] if sections else None
        assignments.append({
            'tutor_id': tutor_id,
            'student_id': student_id,
            'section_id': section_id,
            'reason': 'previous_pair',
        })
        used_tutor.add(tutor_id)
        used_student.add(student_id)
        if section_id is not None:
            section_slots[section_id].append(student_id)
        log.append(f'Matched tutor {tutor_id} with student {student_id} (previous pair)')

    # 2) Siblings in same section
    sibling_groups = {}
    for s in students:
        if s['id'] in used_student:
            continue
        sib_ids = []
        for x in parse_list(s.get('sibling_ids') or ''):
            try:
                sib_ids.append(int(x))
            except ValueError:
                pass
        if not sib_ids:
            continue
        key = '-'.join(str(x) for x in sorted([s['id']] + sib_ids))
        if key not in sibling_groups:
            sibling_groups[key] = [x for x in [s['id']] + sib_ids if x not in used_student]

    for ids in sibling_groups.values():
        if not ids:
            continue
        section_id = sections[0]['id'] if sections else None
        for student_id in ids:
            student = student_by_id(student_id)
            if not student or student_id in used_student:
                continue
            best_tutor = None
            best_score = -1
            for t in tutors:
                if t['id'] in used_tutor:
                    continue
                score = subject_score(t.get('subjects') or '', student.get('subjects_needed') or '')
                grade_ok = grade_match(t.get('grade_levels') or '', student.get('grade_level'))
                if grade_ok and score > best_score:
                    best_score = score
                    best_tutor = t
            if best_tutor:
                assignments.append({
                    'tutor_id': best_tutor['id'],
                    'student_id': student_id,
                    'section_id': section_id,
                    'reason': 'sibling_same_section',
                })
                used_tutor.add(best_tutor['id'])
                used_student.add(student_id)
                if section_id is not None:
                    section_slots[section_id].append(student_id)
                log.append(f"Matched tutor {best_tutor['id']} with student {student_id} (sibling group, section {section_id})")

    # 3) Remaining: best subject/level fit
    remaining_students = [s for s in students if s['id'] not in used_student]
    for student in remaining_students:
        best = None
        best_score = -1
        for t in tutors:
            if t['id'] in used_tutor:
                continue
            score = subject_score(t.get('subjects') or '', student.get('subjects_needed') or '')
            grade_ok = grade_match(t.get('grade_levels') or '', student.get('grade_level'))
            if grade_ok and score > best_score:
                best_score = score
                best = t
        if best:
            section_id = sections[0]['id'] if sections else None
            assignments.append({
                'tutor_id': best['id'],
                'student_id': student['id'],
                'section_id': section_id,
                'reason': 'subject_fit',
            })
            used_tutor.add(best['id'])
            used_student.add(student['id'])
            if section_id is not None:
                section_slots[section_id].append(student['id'])
            log.append(f"Matched tutor {best['id']} with student {student['id']} (subject/level fit)")

    unassigned_tutors = [t['id'] for t in tutors if t['id'] not in used_tutor]
    unassigned_students = [s['id'] for s in students if s['id'] not in used_student]

    return {
        'assignments': assignments,
        'unassigned_tutors': unassigned_tutors,
        'unassigned_students': unassigned_students,
        'log': log,
    }
