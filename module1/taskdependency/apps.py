from django.apps import AppConfig


class TaskdependencyConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "taskdependency"

    def ready(self):
        # Optional hook for automatic dependency generation.
        # This remains inactive until this app is added to INSTALLED_APPS.
        try:
            from . import signals  # noqa: F401
        except Exception:
            # Avoid startup failure if dependencies are not wired yet.
            pass
