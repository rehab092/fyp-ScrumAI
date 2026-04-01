from django.db import models


class TaskProgress(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_IN_PROGRESS = "IN_PROGRESS"
    STATUS_COMPLETED = "COMPLETED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETED, "Completed"),
    ]

    workspace = models.ForeignKey("assignment_module.AdminWorkspace", on_delete=models.CASCADE)
    task = models.ForeignKey("userstorymanager.Backlog", on_delete=models.CASCADE)
    sprint = models.ForeignKey("sprintmanager.Sprint", on_delete=models.SET_NULL, null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    deadline = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "task", "sprint"],
                name="uniq_task_progress_workspace_task_sprint",
            )
        ]
        indexes = [
            models.Index(fields=["workspace", "status"]),
            models.Index(fields=["workspace", "deadline"]),
        ]

    def __str__(self):
        return f"{self.workspace_id}:{self.task_id} [{self.status}]"


class DelayAlert(models.Model):
    TYPE_DIRECT = "DIRECT"
    TYPE_CASCADE = "CASCADE"
    TYPE_CHAIN = "CHAIN"

    ALERT_TYPE_CHOICES = [
        (TYPE_DIRECT, "Direct Delay"),
        (TYPE_CASCADE, "Cascade Delay"),
        (TYPE_CHAIN, "Chain Delay"),
    ]

    workspace = models.ForeignKey("assignment_module.AdminWorkspace", on_delete=models.CASCADE)
    sprint = models.ForeignKey("sprintmanager.Sprint", on_delete=models.SET_NULL, null=True, blank=True)

    task = models.ForeignKey("userstorymanager.Backlog", on_delete=models.CASCADE, related_name="delay_alerts")
    source_task = models.ForeignKey(
        "userstorymanager.Backlog",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="propagated_delay_alerts",
    )

    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    reason = models.TextField()
    severity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    detected_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["workspace", "is_active"]),
            models.Index(fields=["workspace", "task", "source_task"]),
        ]

    def __str__(self):
        return f"{self.task_id} - {self.alert_type}"
