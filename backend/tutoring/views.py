import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Tutor, Student, Section, Assignment, LastSemesterPair
from .matching import run_matching, SUBJECTS


def current_semester():
    from datetime import datetime
    d = datetime.now()
    return f"{d.year}-S{'2' if d.month >= 6 else '1'}"


def _tutor_dict(t):
    return {
        'id': t.id,
        'name': t.name,
        'email': t.email,
        'phone': t.phone or '',
        'availability': t.availability or '',
        'subjects': t.subjects or '',
        'grade_levels': t.grade_levels or '',
        'previous_student_ids': t.previous_student_ids or '',
        'preferences': t.preferences or '',
    }


def _student_dict(s):
    return {
        'id': s.id,
        'name': s.name,
        'email': s.email,
        'phone': s.phone or '',
        'grade_level': s.grade_level,
        'subjects_needed': s.subjects_needed or '',
        'sibling_ids': s.sibling_ids or '',
        'previous_tutor_id': s.previous_tutor_id,
        'availability': s.availability or '',
        'constraints': s.constraints or '',
    }


@csrf_exempt
def api_tutors(request):
    if request.method == 'GET':
        tutors = [_tutor_dict(t) for t in Tutor.objects.all()]
        return JsonResponse(tutors, safe=False)
    if request.method != 'POST':
        return JsonResponse({}, status=405)
    return _api_tutors_create(request)


@csrf_exempt
def _api_tutors_create(request):
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        body = {}
    name = (body.get('name') or '').strip()
    email = (body.get('email') or '').strip()
    if not name or not email:
        return JsonResponse({'error': 'Name and email required'}, status=400)
    subjects = body.get('subjects')
    if isinstance(subjects, list):
        subjects = ', '.join(str(s) for s in subjects)
    else:
        subjects = subjects or ''
    grade_levels = body.get('grade_levels')
    if isinstance(grade_levels, list):
        grade_levels = ', '.join(str(g) for g in grade_levels)
    else:
        grade_levels = grade_levels or ''
    prev_ids = body.get('previous_student_ids')
    if isinstance(prev_ids, list):
        prev_ids = ','.join(str(p) for p in prev_ids)
    else:
        prev_ids = prev_ids or ''
    t = Tutor.objects.create(
        name=name,
        email=email,
        phone=(body.get('phone') or '')[:64],
        availability=body.get('availability') or '',
        subjects=subjects,
        grade_levels=grade_levels,
        previous_student_ids=prev_ids,
        preferences=body.get('preferences') or '',
    )
    return JsonResponse({'id': t.id, 'message': 'Tutor application submitted.'})


@csrf_exempt
def api_students(request):
    if request.method == 'GET':
        students = [_student_dict(s) for s in Student.objects.all()]
        return JsonResponse(students, safe=False)
    if request.method != 'POST':
        return JsonResponse({}, status=405)
    return _api_students_create(request)


@csrf_exempt
def _api_students_create(request):
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        body = {}
    name = (body.get('name') or '').strip()
    email = (body.get('email') or '').strip()
    if not name or not email:
        return JsonResponse({'error': 'Name and email required'}, status=400)
    grade_level = body.get('grade_level')
    if grade_level is not None and grade_level != '':
        try:
            grade_level = int(grade_level)
        except (TypeError, ValueError):
            grade_level = None
    else:
        grade_level = None
    subjects_needed = body.get('subjects_needed')
    if isinstance(subjects_needed, list):
        subjects_needed = ', '.join(str(s) for s in subjects_needed)
    else:
        subjects_needed = subjects_needed or ''
    sibling_ids = body.get('sibling_ids')
    if isinstance(sibling_ids, list):
        sibling_ids = ','.join(str(x) for x in sibling_ids)
    else:
        sibling_ids = sibling_ids or ''
    prev_tutor = body.get('previous_tutor_id')
    if prev_tutor is not None and prev_tutor != '':
        try:
            prev_tutor = int(prev_tutor)
        except (TypeError, ValueError):
            prev_tutor = None
    else:
        prev_tutor = None
    s = Student.objects.create(
        name=name,
        email=email,
        phone=(body.get('phone') or '')[:64],
        grade_level=grade_level,
        subjects_needed=subjects_needed,
        sibling_ids=sibling_ids,
        previous_tutor_id=prev_tutor,
        availability=body.get('availability') or '',
        constraints=body.get('constraints') or '',
    )
    return JsonResponse({'id': s.id, 'message': 'Student application submitted.'})


@require_http_methods(['GET'])
def api_sections_list(request):
    sections = [{'id': s.id, 'name': s.name, 'time_block': s.time_block or ''} for s in Section.objects.all()]
    return JsonResponse(sections, safe=False)


@require_http_methods(['GET'])
def api_assignments_list(request):
    semester = request.GET.get('semester') or current_semester()
    assignments = Assignment.objects.filter(semester=semester).select_related('tutor', 'student').order_by('section_id', 'tutor_id')
    out = []
    for a in assignments:
        out.append({
            'id': a.id,
            'tutor_id': a.tutor_id,
            'student_id': a.student_id,
            'section_id': a.section_id,
            'semester': a.semester,
            'manual_override': bool(a.manual_override),
            'tutor_name': a.tutor.name,
            'tutor_email': a.tutor.email,
            'student_name': a.student.name,
            'student_email': a.student.email,
        })
    return JsonResponse(out, safe=False)


@csrf_exempt
@require_http_methods(['POST'])
def api_sections_create(request):
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        body = {}
    name = (body.get('name') or '').strip()
    if not name:
        return JsonResponse({'error': 'Section name required'}, status=400)
    s = Section.objects.create(name=name, time_block=body.get('time_block') or '')
    return JsonResponse({'id': s.id})


@csrf_exempt
@require_http_methods(['POST'])
def api_run_matching(request):
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        body = {}
    semester = body.get('semester') or current_semester()

    tutors = [_tutor_dict(t) for t in Tutor.objects.all()]
    students = [_student_dict(s) for s in Student.objects.all()]
    sections = [{'id': s.id, 'name': s.name, 'time_block': s.time_block or ''} for s in Section.objects.all()]

    if not sections:
        sec = Section.objects.create(name='Section A', time_block='TBD')
        sections = [{'id': sec.id, 'name': sec.name, 'time_block': sec.time_block or ''}]

    last_pairs = [{'tutor_id': p.tutor_id, 'student_id': p.student_id} for p in LastSemesterPair.objects.all()]

    result = run_matching(tutors=tutors, students=students, sections=sections, last_semester_pairs=last_pairs)

    Assignment.objects.filter(semester=semester).delete()
    for a in result['assignments']:
        Assignment.objects.create(
            tutor_id=a['tutor_id'],
            student_id=a['student_id'],
            section_id=a.get('section_id'),
            semester=semester,
            manual_override=False,
        )

    return JsonResponse({
        'semester': semester,
        'assignmentsCount': len(result['assignments']),
        'unassignedTutors': len(result['unassigned_tutors']),
        'unassignedStudents': len(result['unassigned_students']),
        'log': result['log'],
    })


@csrf_exempt
@require_http_methods(['POST'])
def api_assignments_override(request):
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        body = {}
    semester = body.get('semester') or current_semester()
    tutor_id = body.get('tutor_id')
    student_id = body.get('student_id')
    section_id = body.get('section_id')
    if not tutor_id or not student_id:
        return JsonResponse({'error': 'tutor_id and student_id required'}, status=400)
    Assignment.objects.filter(student_id=student_id, semester=semester).delete()
    Assignment.objects.create(
        tutor_id=int(tutor_id),
        student_id=int(student_id),
        section_id=int(section_id) if section_id else None,
        semester=semester,
        manual_override=True,
    )
    return JsonResponse({'ok': True})


@csrf_exempt
@require_http_methods(['POST'])
def api_last_semester_pairs(request):
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        body = {}
    LastSemesterPair.objects.all().delete()
    for p in body.get('pairs') or []:
        LastSemesterPair.objects.create(tutor_id=p['tutor_id'], student_id=p['student_id'])
    return JsonResponse({'ok': True})


@require_http_methods(['GET'])
def api_subjects(request):
    return JsonResponse(SUBJECTS, safe=False)
