from django.contrib import admin
from .models import TaskSuggestion, AssignmentApprovalWorkflow, DeveloperWorkload, TicketStatusHistory


@admin.register(TaskSuggestion)
class TaskSuggestionAdmin(admin.ModelAdmin):
    list_display = ['task_fk', 'suggested_developer_fk', 'status', 'overall_rank', 'suggested_at']
    list_filter = ['status', 'suggested_at', 'workspace_fk']
    search_fields = ['task_fk__task_id', 'suggested_developer_fk__name']
    readonly_fields = ['suggested_at', 'overall_rank']


@admin.register(AssignmentApprovalWorkflow)
class AssignmentApprovalWorkflowAdmin(admin.ModelAdmin):
    list_display = ['task_suggestion_fk', 'current_status', 'created_at', 'updated_at']
    list_filter = ['current_status', 'created_at']
    search_fields = ['task_suggestion_fk__task_fk__task_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DeveloperWorkload)
class DeveloperWorkloadAdmin(admin.ModelAdmin):
    list_display = ['developer_fk', 'sprint_fk', 'utilization_percentage', 'available_hours', 'updated_at']
    list_filter = ['sprint_fk', 'workspace_fk']
    search_fields = ['developer_fk__name']
    readonly_fields = ['available_hours', 'utilization_percentage', 'updated_at']


@admin.register(TicketStatusHistory)
class TicketStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['task_fk', 'new_status', 'changed_by_fk', 'timestamp']
    list_filter = ['new_status', 'timestamp', 'sprint_fk']
    search_fields = ['task_fk__task_id', 'changed_by_fk__name']
    readonly_fields = ['timestamp']
