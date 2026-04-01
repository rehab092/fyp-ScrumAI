from django.urls import path

from .views import (
    get_project_delay_context,
    list_alerts,
    list_projects_delay_summary,
    resolve_alert,
    run_engine,
    upsert_task_progress,
)


urlpatterns = [
    path("projects/", list_projects_delay_summary, name="list_projects_delay_summary"),
    path("task-progress/upsert/", upsert_task_progress, name="upsert_task_progress"),
    path("engine/run/", run_engine, name="run_delay_engine"),
    path("project/<int:project_id>/context/", get_project_delay_context, name="get_project_delay_context"),
    path("alerts/", list_alerts, name="list_delay_alerts"),
    path("alerts/<int:alert_id>/resolve/", resolve_alert, name="resolve_delay_alert"),
]
