from django.urls import path

from .views import get_project_dependencies, recompute_project_dependencies


urlpatterns = [
    path("project/<int:project_id>/", get_project_dependencies, name="get_project_dependencies"),
    # Optional manual recompute endpoint for debugging/backfill.
    path("project/<int:project_id>/recompute/", recompute_project_dependencies, name="recompute_project_dependencies"),
]
