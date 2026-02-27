from django.urls import path
from . import views

urlpatterns = [
    path('tutors', views.api_tutors),
    path('tutors/', views.api_tutors),
    path('tutors/lookup', views.api_tutors_lookup),
    path('tutees', views.api_tutees),
    path('tutees/', views.api_tutees),
    path('students', views.api_tutees),
    path('students/', views.api_tutees),
    path('sections', views.api_sections_list),
    path('sections/', views.api_sections_create),
    path('assignments', views.api_assignments_list),
    path('assignments/override', views.api_assignments_override),
    path('run-matching', views.api_run_matching),
    path('last-semester-pairs', views.api_last_semester_pairs),
    path('subjects', views.api_subjects),
]
