import json
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .mongo import get_db
from .models import Section, Assignment, LastSemesterPair
from .matching import run_matching, SUBJECTS


def current_semester():
    d = datetime.now()
    return f"{d.year}-S{'2' if d.month >= 6 else '1'}"


def _serialize(doc):
    """Convert a MongoDB document to JSON-safe dict."""
    if doc is None:
        return None
    doc['_id'] = str(doc['_id'])
    return doc


# --------------- Tutors (MongoDB) ---------------

@csrf_exempt
def api_tutors(request):
    if request.method == 'GET':
        db = get_db()
        tutors = [_serialize(t) for t in db.Tutors.find()]
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

    first = (body.get('firstName') or '').strip()
    last = (body.get('lastName') or '').strip()
    email = (body.get('email') or '').strip()
    if not first or not last or not email:
        return JsonResponse({'error': 'firstName, lastName, and email are required'}, status=400)

    doc = {
        'firstName': first,
        'lastName': last,
        'email': email,
        'pennId': (body.get('pennId') or '').strip(),
        'phone': (body.get('phone') or '').strip(),
        'year': body.get('year') or '',
        'availability': body.get('availability') or [],
        'format': body.get('format') or 'Either',
        'subjects': body.get('subjects') or [],
        'ageRanges': body.get('ageRanges') or [],
        'previousTuteeNames': body.get('previousTuteeNames') or '',
        'additionalNotes': body.get('additionalNotes') or '',
        'createdAt': datetime.utcnow().isoformat(),
    }

    db = get_db()
    penn_id = doc['pennId']
    if penn_id:
        existing = db.Tutors.find_one({'pennId': penn_id})
        if existing:
            db.Tutors.replace_one({'_id': existing['_id']}, doc)
            doc['_id'] = str(existing['_id'])
            return JsonResponse(doc)

    result = db.Tutors.insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return JsonResponse(doc, status=201)


@csrf_exempt
def api_tutors_lookup(request):
    if request.method != 'GET':
        return JsonResponse({}, status=405)
    penn_id = request.GET.get('pennId', '').strip()
    if not penn_id:
        return JsonResponse({'error': 'pennId query parameter required'}, status=400)
    db = get_db()
    tutor = db.Tutors.find_one({'pennId': penn_id})
    if tutor:
        return JsonResponse(_serialize(tutor))
    return JsonResponse({'error': 'Not found'}, status=404)


# --------------- Tutees (MongoDB) ---------------

@csrf_exempt
def api_tutees(request):
    if request.method == 'GET':
        db = get_db()
        tutees = [_serialize(t) for t in db.Tutees.find()]
        return JsonResponse(tutees, safe=False)
    if request.method != 'POST':
        return JsonResponse({}, status=405)
    return _api_tutees_create(request)


@csrf_exempt
def _api_tutees_create(request):
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        body = {}

    s_first = (body.get('studentFirstName') or '').strip()
    s_last = (body.get('studentLastName') or '').strip()
    p_email = (body.get('parentEmail') or '').strip()
    if not s_first or not s_last or not p_email:
        return JsonResponse({'error': 'studentFirstName, studentLastName, and parentEmail are required'}, status=400)

    doc = {
        'studentFirstName': s_first,
        'studentLastName': s_last,
        'studentAge': body.get('studentAge') or 0,
        'studentGrade': body.get('studentGrade') or '',
        'parentFirstName': (body.get('parentFirstName') or '').strip(),
        'parentLastName': (body.get('parentLastName') or '').strip(),
        'parentEmail': p_email,
        'parentPhone': (body.get('parentPhone') or '').strip(),
        'availability': body.get('availability') or [],
        'format': body.get('format') or 'Either',
        'subjects': body.get('subjects') or [],
        'genderPreference': body.get('genderPreference') or 'No Preference',
        'siblingNames': body.get('siblingNames') or '',
        'siblingPreference': body.get('siblingPreference') or 'No Preference',
        'previousTutorNames': body.get('previousTutorNames') or '',
        'additionalNotes': body.get('additionalNotes') or '',
        'createdAt': datetime.utcnow().isoformat(),
    }

    db = get_db()
    result = db.Tutees.insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return JsonResponse(doc, status=201)


# --------------- Legacy endpoints (Django ORM / SQLite) ---------------

def _tutor_dict_legacy(t):
    return {
        'id': t.id, 'name': t.name, 'email': t.email,
        'phone': t.phone or '', 'availability': t.availability or '',
        'subjects': t.subjects or '', 'grade_levels': t.grade_levels or '',
        'previous_student_ids': t.previous_student_ids or '',
        'preferences': t.preferences or '',
    }

def _student_dict_legacy(s):
    return {
        'id': s.id, 'name': s.name, 'email': s.email,
        'phone': s.phone or '', 'grade_level': s.grade_level,
        'subjects_needed': s.subjects_needed or '',
        'sibling_ids': s.sibling_ids or '',
        'previous_tutor_id': s.previous_tutor_id,
        'availability': s.availability or '',
        'constraints': s.constraints or '',
    }


@require_http_methods(['GET'])
def api_sections_list(request):
    sections = [{'id': s.id, 'name': s.name, 'time_block': s.time_block or ''} for s in Section.objects.all()]
    return JsonResponse(sections, safe=False)


@require_http_methods(['GET'])
def api_assignments_list(request):
    from .models import Tutor, Student
    semester = request.GET.get('semester') or current_semester()
    assignments = Assignment.objects.filter(semester=semester).select_related('tutor', 'student').order_by('section_id', 'tutor_id')
    out = []
    for a in assignments:
        out.append({
            'id': a.id, 'tutor_id': a.tutor_id, 'student_id': a.student_id,
            'section_id': a.section_id, 'semester': a.semester,
            'manual_override': bool(a.manual_override),
            'tutor_name': a.tutor.name, 'tutor_email': a.tutor.email,
            'student_name': a.student.name, 'student_email': a.student.email,
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
    from .models import Tutor, Student
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        body = {}
    semester = body.get('semester') or current_semester()
    tutors = [_tutor_dict_legacy(t) for t in Tutor.objects.all()]
    students = [_student_dict_legacy(s) for s in Student.objects.all()]
    sections = [{'id': s.id, 'name': s.name, 'time_block': s.time_block or ''} for s in Section.objects.all()]
    if not sections:
        sec = Section.objects.create(name='Section A', time_block='TBD')
        sections = [{'id': sec.id, 'name': sec.name, 'time_block': sec.time_block or ''}]
    last_pairs = [{'tutor_id': p.tutor_id, 'student_id': p.student_id} for p in LastSemesterPair.objects.all()]
    result = run_matching(tutors=tutors, students=students, sections=sections, last_semester_pairs=last_pairs)
    Assignment.objects.filter(semester=semester).delete()
    for a in result['assignments']:
        Assignment.objects.create(
            tutor_id=a['tutor_id'], student_id=a['student_id'],
            section_id=a.get('section_id'), semester=semester, manual_override=False,
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
        tutor_id=int(tutor_id), student_id=int(student_id),
        section_id=int(section_id) if section_id else None,
        semester=semester, manual_override=True,
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
