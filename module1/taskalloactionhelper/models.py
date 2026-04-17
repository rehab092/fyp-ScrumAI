from django.db import models
from django.contrib.postgres.fields import JSONField
from django.utils import timezone
from assignment_module.models import AdminWorkspace, TeamMember, ManagementUser
from userstorymanager.models import Backlog
from sprintmanager.models import Sprint


class TaskSuggestion(models.Model):
    """
    Stores suggested developer assignments for tasks.
    Created by suggestion engine, approved/modified by Scrum Master.
    """
    SUGGESTION_STATUS = [
        ('PENDING', 'Awaiting SM Review'),
        ('APPROVED', 'Approved by SM'),
        ('REJECTED', 'Rejected by SM'),
        ('MANUALLY_CHANGED', 'SM Changed Developer'),
    ]
    
    workspace_fk = models.ForeignKey(AdminWorkspace, on_delete=models.CASCADE, related_name='task_suggestions')
    sprint_fk = models.ForeignKey(Sprint, on_delete=models.CASCADE, related_name='task_suggestions')
    task_fk = models.ForeignKey(Backlog, on_delete=models.CASCADE, related_name='suggestions')
    
    # Suggested Developer
    suggested_developer_fk = models.ForeignKey(
        TeamMember, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='suggestions_received'
    )
    
    # Scoring
    skill_match_score = models.FloatField(default=0)  # 0-100
    capacity_score = models.FloatField(default=0)  # 0-100
    workload_score = models.FloatField(default=0)  # 0-100
    experience_score = models.FloatField(default=0)  # 0-100
    blocker_score = models.FloatField(default=0)  # 0-100
    urgency_score = models.FloatField(default=0)  # 0-100
    overall_rank = models.FloatField(default=0)  # Final composite score 0-100
    
    # Ranking Details
    skill_match_details = models.JSONField(default=dict, blank=True)  # {skill: {score, match_type}, ...}
    alternative_developers = models.JSONField(default=list, blank=True)  # [{id, name, score}, ...]
    rejected_developers = models.JSONField(default=list, blank=True)  # [developer_id, ...] - Track rejected developers
    
    # Workflow
    status = models.CharField(max_length=50, choices=SUGGESTION_STATUS, default='PENDING')
    suggested_at = models.DateTimeField(auto_now_add=True)
    sm_reviewed_at = models.DateTimeField(null=True, blank=True)
    sm_reviewed_by_fk = models.ForeignKey(
        ManagementUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_suggestions'
    )
    
    # If manually changed
    manually_assigned_to_fk = models.ForeignKey(
        TeamMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='manual_assignments_received'
    )
    change_reason = models.TextField(null=True, blank=True)
    
    class Meta:
        unique_together = ('sprint_fk', 'task_fk')
        ordering = ['-overall_rank']  # Highest scores first
    
    def __str__(self):
        return f"Suggestion:{self.task_fk.task_id}→{self.suggested_developer_fk.name if self.suggested_developer_fk else 'Unassigned'}"


class AssignmentApprovalWorkflow(models.Model):
    """
    Tracks the approval workflow: SM approval → Developer acceptance.
    """
    WORKFLOW_STATUS = [
        ('SM_PENDING', 'Awaiting SM Approval'),
        ('SM_APPROVED', 'SM Approved'),
        ('SM_REJECTED', 'SM Rejected'),
        ('DEV_PENDING', 'Awaiting Developer Response'),
        ('DEV_ACCEPTED', 'Developer Accepted'),
        ('DEV_REJECTED', 'Developer Rejected'),
        ('ACTIVE', 'Assignment Active'),
        ('CANCELLED', 'Assignment Cancelled'),
    ]
    
    workspace_fk = models.ForeignKey(AdminWorkspace, on_delete=models.CASCADE, related_name='approval_workflows')
    task_suggestion_fk = models.OneToOneField(
        TaskSuggestion, 
        on_delete=models.CASCADE, 
        related_name='approval_workflow'
    )
    
    # Current state
    current_status = models.CharField(max_length=50, choices=WORKFLOW_STATUS, default='SM_PENDING')
    
    # SM Review
    sm_review_timestamp = models.DateTimeField(null=True, blank=True)
    sm_approval_notes = models.TextField(null=True, blank=True)
    sm_approved_developer_fk = models.ForeignKey(
        TeamMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sm_approvals'
    )
    
    # Developer Response
    developer_notification_sent = models.DateTimeField(null=True, blank=True)
    developer_response_timestamp = models.DateTimeField(null=True, blank=True)
    developer_response = models.CharField(
        max_length=10,
        choices=[('ACCEPT', 'Accept'), ('REJECT', 'Reject')],
        null=True,
        blank=True
    )
    developer_rejection_reason = models.TextField(null=True, blank=True)
    
    # Redirect if rejected
    alternative_suggestions_generated = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Workflow:{self.task_suggestion_fk.task_fk}→{self.current_status}"


class DeveloperWorkload(models.Model):
    """
    Tracks current workload and capacity of each developer per sprint.
    Updated when tasks are assigned or completed.
    """
    workspace_fk = models.ForeignKey(AdminWorkspace, on_delete=models.CASCADE, related_name='developer_workloads')
    developer_fk = models.ForeignKey(
        TeamMember, 
        on_delete=models.CASCADE, 
        related_name='workload_history'
    )
    sprint_fk = models.ForeignKey(Sprint, on_delete=models.CASCADE, related_name='developer_workloads')
    
    # Capacity
    total_capacity_hours = models.FloatField(default=0)  # For this sprint
    assigned_hours = models.FloatField(default=0)  # Sum of assigned task hours
    completed_hours = models.FloatField(default=0)  # Sum of completed task hours
    in_progress_hours = models.FloatField(default=0)  # Sum of in-progress task hours
    
    # Calculated fields
    available_hours = models.FloatField(default=0)  # = total_capacity - assigned_hours
    utilization_percentage = models.FloatField(default=0)  # = (assigned_hours / total_capacity) * 100
    
    # Related tasks (as JSON arrays)
    active_tasks = models.JSONField(default=list, blank=True)  # [task_id, task_id, ...]
    blocked_tasks = models.JSONField(default=list, blank=True)  # Tasks blocked by dependencies
    delayed_tasks = models.JSONField(default=list, blank=True)  # Overdue tasks
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('developer_fk', 'sprint_fk')
    
    def calculate_metrics(self):
        """Recalculate workload metrics."""
        if self.total_capacity_hours > 0:
            self.available_hours = self.total_capacity_hours - self.assigned_hours
            self.utilization_percentage = (self.assigned_hours / self.total_capacity_hours) * 100
        else:
            self.available_hours = 0
            self.utilization_percentage = 0
        self.save()
    
    def __str__(self):
        return f"Workload:{self.developer_fk.name}→{self.utilization_percentage:.1f}%"


class TicketStatusHistory(models.Model):
    """
    Track status changes for audit trail and delay detection.
    Jira-like ticket status workflow.
    """
    STATUS_CHOICES = [
        ('TO_DO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('BLOCKED', 'Blocked'),
        ('DONE', 'Done'),
        ('DELAYED', 'Delayed'),
    ]
    
    task_fk = models.ForeignKey(Backlog, on_delete=models.CASCADE, related_name='status_history')
    sprint_fk = models.ForeignKey(
        Sprint, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='ticket_status_history'
    )
    
    old_status = models.CharField(max_length=20, choices=STATUS_CHOICES, null=True, blank=True)
    new_status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    
    changed_by_fk = models.ForeignKey(
        TeamMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Developer who made the status change"
    )
    
    timestamp = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(null=True, blank=True, help_text="Why was status changed")
    progress_percentage = models.IntegerField(null=True, blank=True)  # 0-100
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Status:{self.task_fk}→{self.new_status}"
