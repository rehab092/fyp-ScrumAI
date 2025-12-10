from django.db import models
from django.contrib.auth.hashers import make_password
from django.utils import timezone


class AdminWorkspace(models.Model):
    adminName = models.CharField(max_length=100)
    adminEmail = models.EmailField(unique=True)
    password = models.CharField(max_length=255)  # later you should hash it
    workspaceName = models.CharField(max_length=100)
    companyName = models.CharField(max_length=100)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.adminName} - {self.workspaceName}"


class TeamMember(models.Model):
    workspace = models.ForeignKey(
        AdminWorkspace,
        on_delete=models.CASCADE,
        related_name="team_members",
        null=True,
        blank=True,
    )

    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    # store HASHED password here
    password = models.CharField(max_length=255)

    # dev skills / tech stack
    skills = models.JSONField(default=list, blank=True)

    capacityHours = models.PositiveIntegerField(default=40)
    assignedHours = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="available")  # available / high_load / overloaded

    def __str__(self):
        return self.name



class InvitationToken(models.Model):
    workspace = models.ForeignKey(AdminWorkspace, on_delete=models.CASCADE, related_name="invites")

    email = models.EmailField(unique=False)
    token = models.CharField(max_length=255, unique=True)
    role = models.CharField(max_length=100)
    is_used = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} → {self.workspace.workspaceName}"


class ManagementUser(models.Model):
    ROLE_CHOICES = [
        ("SCRUM_MASTER", "Scrum Master"),
        ("PRODUCT_OWNER", "Product Owner"),
    ]

    workspace = models.ForeignKey(
        AdminWorkspace,
        on_delete=models.CASCADE,
        related_name="management_users",
        null=True,
        blank=True,
    )

    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"
    


# ---------------------------------------------
# TASK ASSIGNMENT MODEL
# ---------------------------------------------

from userstorymanager.models import Backlog  # ensure this matches your actual task model name

class TaskAssignment(models.Model):

    STATUS_CHOICES = [
        ("SUGGESTED", "Suggested"),
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
    ]

    workspace = models.ForeignKey(AdminWorkspace, on_delete=models.CASCADE)
    task = models.ForeignKey(Backlog, on_delete=models.CASCADE)
    member = models.ForeignKey(TeamMember, on_delete=models.CASCADE)

    sprint_id = models.IntegerField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="SUGGESTED")

    # timestamps
    suggested_at = models.DateTimeField(default=timezone.now)
    accepted_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    # metadata
    match_score = models.FloatField(null=True, blank=True)
    reason = models.TextField(null=True, blank=True)  # rejection reason
    source = models.CharField(max_length=20, default="MANUAL")  # MANUAL / AUTO

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "task", "sprint_id"],
                name="unique_task_per_sprint"
            )
        ]

    def __str__(self):
        return f"{self.task.tasks} → {self.member.name} ({self.status})"


class Notification(models.Model):
    workspace = models.ForeignKey(AdminWorkspace, on_delete=models.CASCADE)
    user_email = models.EmailField()  # we notify by email instead of linking 3 separate tables
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50)  # INFO, WARNING, SUCCESS, ALERT
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_email} - {self.title}"
