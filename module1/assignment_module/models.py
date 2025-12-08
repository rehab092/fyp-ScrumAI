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
    skills = models.JSONField(default=list, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


