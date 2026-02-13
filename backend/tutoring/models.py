from django.db import models


class Tutor(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=64, blank=True)
    availability = models.TextField(blank=True)
    subjects = models.TextField(blank=True)
    grade_levels = models.TextField(blank=True)
    previous_student_ids = models.TextField(blank=True)
    preferences = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']


class Student(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=64, blank=True)
    grade_level = models.IntegerField(null=True, blank=True)
    subjects_needed = models.TextField(blank=True)
    sibling_ids = models.TextField(blank=True)
    previous_tutor_id = models.IntegerField(null=True, blank=True)
    availability = models.TextField(blank=True)
    constraints = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']


class Section(models.Model):
    name = models.CharField(max_length=255)
    time_block = models.CharField(max_length=255, blank=True)


class Assignment(models.Model):
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True)
    semester = models.CharField(max_length=32)
    manual_override = models.BooleanField(default=False)


class LastSemesterPair(models.Model):
    tutor_id = models.IntegerField()
    student_id = models.IntegerField()

    class Meta:
        unique_together = [['tutor_id', 'student_id']]
