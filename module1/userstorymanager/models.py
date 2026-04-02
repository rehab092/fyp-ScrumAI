from django.db import models

class ProductOwner(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    company_name = models.CharField(max_length=150)

    created_at = models.DateTimeField(auto_now_add=True)
  # ForeignKey to AdminWorkspace in the `assignment` app.
    # Keep the DB column name `workspace_id` for backwards compatibility.
    workspace = models.ForeignKey(
        'assignment_module.AdminWorkspace',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='product_owners',
        db_column='workspace_id',
    )

    def __str__(self):
        return self.name


class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(ProductOwner, on_delete=models.CASCADE, related_name='projects')
    workspace_id=models.IntegerField(null=True, blank=True)  # Store workspace ID for easier querying

    def __str__(self):
        return self.name
    
class UserStory(models.Model):
    owner = models.ForeignKey(ProductOwner, on_delete=models.CASCADE, related_name='user_stories')
    role = models.CharField(max_length=100) 
    goal = models.TextField()
    benefit = models.TextField()
    priority = models.CharField(max_length=50)
    project_name = models.CharField(max_length=100)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='user_stories', null=True, blank=True)
    

    def __str__(self):
        return f"{self.project_name}"

class Backlog(models.Model):
    project_id = models.CharField(max_length=100)
    user_story = models.ForeignKey(
        UserStory,
        on_delete=models.CASCADE,
        related_name='backlog_items',
        db_column='user_story_id',
        null=True,
        blank=True,
    )
    task_id = models.AutoField(primary_key=True)
    tasks = models.TextField()
    subtasks = models.TextField()
    # New fields for Module 2: skills required and estimated hours
    skills_required = models.TextField(null=True, blank=True, default="")
    estimated_hours = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.project_id} - {self.task_id}"