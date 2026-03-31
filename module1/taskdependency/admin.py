from django.contrib import admin

from .models import TaskDependency


@admin.register(TaskDependency)
class TaskDependencyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "project",
        "predecessor_task",
        "successor_task",
        "dependency_type",
        "confidence",
        "source",
        "updated_at",
    )
    list_filter = ("dependency_type", "source", "project")
    search_fields = ("reason",)
