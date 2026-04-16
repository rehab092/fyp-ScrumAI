"""
Management command to add test sprint with user stories for ScrumAI workspace.
Usage: py manage.py add_test_sprint
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from assignment_module.models import AdminWorkspace
from userstorymanager.models import Project, ProductOwner, UserStory, Backlog
from sprintmanager.models import Sprint, SprintItem


class Command(BaseCommand):
    help = 'Add test sprint with 2 user stories for testing task allocation'

    def handle(self, *args, **options):
        try:
            # Get or create workspace (using "ScrumAI" workspace)
            workspace, created = AdminWorkspace.objects.get_or_create(
                workspaceName='ScrumAI',
                defaults={
                    'adminName': 'Test Admin',
                    'adminEmail': 'admin@test.com',
                    'password': 'hashed',
                    'companyName': 'Test Company',
                }
            )
            self.stdout.write(f"Workspace: {workspace.workspaceName} (ID: {workspace.id})")

            # Get or create product owner
            product_owner, created = ProductOwner.objects.get_or_create(
                email='po@test.com',
                defaults={
                    'name': 'Test PO',
                    'password': 'hashed',
                    'company_name': 'Test Company',
                    'workspace': workspace
                }
            )
            self.stdout.write(f"Product Owner: {product_owner.name}")

            # Get or create project
            project, created = Project.objects.get_or_create(
                name='Test Project',
                workspace_id=workspace.id,
                defaults={
                    'description': 'Test project for task allocation',
                    'owner': product_owner,
                }
            )
            self.stdout.write(f"Project: {project.name} (ID: {project.id})")

            # Create sprint for testing
            sprint_start = timezone.now().date()
            sprint_end = sprint_start + timedelta(days=14)
            
            sprint, created = Sprint.objects.get_or_create(
                name='Test Sprint - AI Suggestions',
                workspace=workspace,
                defaults={
                    'goal': 'Test sprint for AI-powered task allocation and skill matching',
                    'start_date': sprint_start,
                    'end_date': sprint_end,
                    'is_active': True,
                    'project_id': project.id,
                }
            )
            self.stdout.write(f"Sprint: {sprint.name} (ID: {sprint.id})")
            self.stdout.write(f"Sprint Duration: {sprint_start} to {sprint_end}")

            # Create user story 1
            user_story1, created = UserStory.objects.get_or_create(
                owner=product_owner,
                role='Backend Developer',
                goal='Implement REST API for user authentication',
                defaults={
                    'benefit': 'Users can securely login to the system',
                    'priority': 'High',
                    'story_points': 8,
                    'project_name': project.name,
                    'project': project,
                }
            )
            self.stdout.write(f"User Story 1: {user_story1.role} - {user_story1.goal}")

            # Create tasks for user story 1
            task1, created = Backlog.objects.get_or_create(
                project_id=str(project.id),
                task_id=1001,  # Unique task ID
                defaults={
                    'user_story': user_story1,
                    'tasks': 'Design JWT token implementation',
                    'subtasks': '1. Define token schema\n2. Create token generation service\n3. Add token validation',
                    'skills_required': 'Python,Django,JWT,API Design',
                    'estimated_hours': 5,
                }
            )
            if created:
                self.stdout.write(f"  └─ Task 1: {task1.tasks} (5h)")

            task2, created = Backlog.objects.get_or_create(
                project_id=str(project.id),
                task_id=1002,
                defaults={
                    'user_story': user_story1,
                    'tasks': 'Implement login endpoint with password hashing',
                    'subtasks': '1. Create login endpoint\n2. Add bcrypt hashing\n3. Return JWT token',
                    'skills_required': 'Python,Django,Security,PostgreSQL',
                    'estimated_hours': 6,
                }
            )
            if created:
                self.stdout.write(f"  └─ Task 2: {task2.tasks} (6h)")

            # Create user story 2
            user_story2, created = UserStory.objects.get_or_create(
                owner=product_owner,
                role='Frontend Developer',
                goal='Build responsive dashboard with real-time charts',
                defaults={
                    'benefit': 'Users can monitor project metrics in real-time',
                    'priority': 'High',
                    'story_points': 13,
                    'project_name': project.name,
                    'project': project,
                }
            )
            self.stdout.write(f"User Story 2: {user_story2.role} - {user_story2.goal}")

            # Create tasks for user story 2
            task3, created = Backlog.objects.get_or_create(
                project_id=str(project.id),
                task_id=1003,
                defaults={
                    'user_story': user_story2,
                    'tasks': 'Create dashboard layout with Tailwind CSS',
                    'subtasks': '1. Design responsive grid layout\n2. Add chart placeholders\n3. Implement dark mode',
                    'skills_required': 'React,Tailwind CSS,Responsive Design,JavaScript',
                    'estimated_hours': 4,
                }
            )
            if created:
                self.stdout.write(f"  └─ Task 3: {task3.tasks} (4h)")

            task4, created = Backlog.objects.get_or_create(
                project_id=str(project.id),
                task_id=1004,
                defaults={
                    'user_story': user_story2,
                    'tasks': 'Integrate Chart.js for real-time data visualization',
                    'subtasks': '1. Setup Chart.js library\n2. Create chart components\n3. Connect WebSocket for real-time updates',
                    'skills_required': 'React,Chart.js,D3.js,WebSocket,JavaScript,API Integration',
                    'estimated_hours': 7,
                }
            )
            if created:
                self.stdout.write(f"  └─ Task 4: {task4.tasks} (7h)")

            # Add tasks to sprint
            sprint_items = []
            for task in [task1, task2, task3, task4]:
                sprint_item, created = SprintItem.objects.get_or_create(
                    sprint=sprint,
                    task=task,
                    defaults={}
                )
                if created:
                    sprint_items.append(sprint_item)

            self.stdout.write(self.style.SUCCESS(
                f"\n✅ Successfully created test sprint!\n"
                f"   Sprint ID: {sprint.id}\n"
                f"   Sprint Name: {sprint.name}\n"
                f"   Tasks Added: {len(sprint_items)}\n"
                f"   Total Effort: 22 hours\n"
                f"   Workspace ID: {workspace.id}\n\n"
                f"   Use this in frontend:\n"
                f"   - Workspace-ID header: {workspace.id}\n"
                f"   - Sprint ID: {sprint.id}\n"
                f"   - Project ID: {project.id}"
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            import traceback
            traceback.print_exc()
