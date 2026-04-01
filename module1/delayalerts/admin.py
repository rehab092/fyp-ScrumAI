from django.contrib import admin

from .models import DelayAlert, TaskProgress


@admin.register(TaskProgress)
class TaskProgressAdmin(admin.ModelAdmin):
    list_display = ("id", "workspace", "task", "sprint", "status", "deadline", "updated_at")
    list_filter = ("status", "workspace", "sprint")
    search_fields = ("task__tasks",)


@admin.register(DelayAlert)
class DelayAlertAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "workspace",
        "task",
        "source_task",
        "alert_type",
        "severity",
        "is_active",
        "detected_at",
    )
    list_filter = ("alert_type", "is_active", "workspace", "sprint")
    search_fields = ("task__tasks", "reason")
