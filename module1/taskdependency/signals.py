from django.db.models.signals import post_save
from django.dispatch import receiver

from userstorymanager.models import Backlog
from .services.mapper import compute_and_store_project_dependencies


@receiver(post_save, sender=Backlog)
def run_dependency_mapper_after_task_create(sender, instance, created, **kwargs):
    # Requirement: dependency mapping runs automatically after backlog task creation.
    if not created:
        return

    # Backlog.project_id is stored as a string in current schema.
    try:
        project_id = int(instance.project_id)
    except (TypeError, ValueError):
        return

    # Defensive call: no exception should bubble into existing task creation flow.
    try:
        compute_and_store_project_dependencies(project_id=project_id, overwrite=True)
    except Exception:
        pass
