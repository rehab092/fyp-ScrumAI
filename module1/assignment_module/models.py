from django.db import models

class TeamMember(models.Model):
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=200)
    skills = models.JSONField(default=list)

    capacityHours = models.IntegerField(default=40)       # total weekly hours
    assignedHours = models.IntegerField(default=0)        # auto-updated based on tasks
    status = models.CharField(max_length=50, default="available")

    def __str__(self):
        return self.name
