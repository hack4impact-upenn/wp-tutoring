from django.urls import path
from . import views

urlpatterns = [
    path('tutors', views.api_tutors),
    path('tutors/', views.api_tutors),
    path('students', views.api_students),
    path('students/', views.api_students),
    path('sections', views.api_sections_list),
    path('sections/', views.api_sections_create),
    path('assignments', views.api_assignments_list),
    path('assignments/override', views.api_assignments_override),
    path('run-matching', views.api_run_matching),
    path('last-semester-pairs', views.api_last_semester_pairs),
    path('subjects', views.api_subjects),
]
