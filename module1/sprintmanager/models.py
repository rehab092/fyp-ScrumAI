from django.db import models

# Create your models here.
from django.db import models
from assignment_module.models import AdminWorkspace, ManagementUser
from userstorymanager.models import Backlog


class Sprint(models.Model):
    workspace = models.ForeignKey(AdminWorkspace, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    goal = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.workspace.workspaceName})"


class SprintItem(models.Model):
    sprint = models.ForeignKey(Sprint, on_delete=models.CASCADE, related_name='items')
    task = models.ForeignKey(Backlog, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sprint.name} -> {self.task.tasks}"