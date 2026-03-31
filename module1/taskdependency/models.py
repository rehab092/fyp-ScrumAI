from django.db import models


class TaskDependency(models.Model):
    SOURCE_CHOICES = [
        ("RULE", "Rule"),
        ("ML", "Machine Learning"),
        ("HYBRID", "Hybrid"),
    ]

    DEPENDENCY_CHOICES = [
        ("BLOCKS", "Blocks"),
        ("REQUIRES", "Requires"),
        ("RELATES", "Relates"),
    ]

    project = models.ForeignKey(
        "userstorymanager.Project",
        on_delete=models.CASCADE,
        related_name="task_dependencies",
    )
    predecessor_task = models.ForeignKey(
        "userstorymanager.Backlog",
        on_delete=models.CASCADE,
        related_name="as_predecessor_dependencies",
    )
    successor_task = models.ForeignKey(
        "userstorymanager.Backlog",
        on_delete=models.CASCADE,
        related_name="as_successor_dependencies",
    )

    dependency_type = models.CharField(max_length=20, choices=DEPENDENCY_CHOICES, default="BLOCKS")
    confidence = models.FloatField(default=0.0)
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default="HYBRID")
    reason = models.TextField(blank=True, null=True)
    mapper_version = models.CharField(max_length=50, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "predecessor_task", "successor_task"],
                name="uniq_project_task_dependency_pair",
            )
        ]
        indexes = [
            models.Index(fields=["project"]),
            models.Index(fields=["project", "dependency_type"]),
        ]

    def __str__(self):
        return f"{self.project_id}: {self.predecessor_task_id} -> {self.successor_task_id}"
