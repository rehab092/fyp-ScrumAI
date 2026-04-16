"""
Management command to create a test sprint for workspace 1, project 11
This creates SprintAssignment records with 2 user stories for testing
"""
from django.core.management.base import BaseCommand
from userstorymanager.models import SprintAssignment, UserStory, Project, ProductOwner, Backlog


class Command(BaseCommand):
    help = 'Create a test sprint with 2 user stories for workspace 1, project 11'

    def handle(self, *args, **options):
        try:
            # Get workspace 1, project 11
            project = Project.objects.get(id=11, workspace_id=1)
            self.stdout.write(f'✓ Found Project: {project.name} (ID: {project.id})')
            
            # Get product owner
            product_owner = project.owner
            self.stdout.write(f'✓ Product Owner: {product_owner.name}')
            
            # Get first 2 user stories for this project
            user_stories = UserStory.objects.filter(project=project)[:2]
            
            if len(user_stories) < 2:
                self.stdout.write(
                    self.style.WARNING(f'Warning: Only {len(user_stories)} user stories found, need 2')
                )
            
            # Determine sprint number (get max existing and add 1)
            existing_sprints = SprintAssignment.objects.filter(
                project=project
            ).values_list('sprint_number', flat=True).distinct()
            
            sprint_number = max(existing_sprints) + 1 if existing_sprints else 1
            self.stdout.write(f'✓ Creating Sprint: {sprint_number}')
            
            # Create SprintAssignment for each user story
            created_assignments = []
            for idx, user_story in enumerate(user_stories, 1):
                assignment, created = SprintAssignment.objects.get_or_create(
                    user_story=user_story,
                    sprint_number=sprint_number,
                    project=project,
                    defaults={
                        'product_owner': product_owner,
                        'priority': 'High' if idx == 1 else 'Medium',
                        'story_points': 13 if idx == 1 else 8
                    }
                )
                
                if created:
                    created_assignments.append(assignment)
                    self.stdout.write(f'  ✓ Created assignment for: {user_story.role}')
                    
                    # Show backlog items
                    backlog_items = Backlog.objects.filter(user_story=user_story)
                    self.stdout.write(f'    - Tasks in backlog: {backlog_items.count()}')
                    for task in backlog_items:
                        hours = task.estimated_hours or 0
                        skills = task.skills_required or 'Not specified'
                        self.stdout.write(f'      • {task.tasks[:50]}... ({hours}h) [{skills}]')
                else:
                    self.stdout.write(
                        self.style.WARNING(f'  ⚠ Assignment already exists for: {user_story.role}')
                    )
            
            # Print summary
            self.stdout.write('\n' + '='*70)
            self.stdout.write(self.style.SUCCESS('✓ Sprint Created Successfully!'))
            self.stdout.write('='*70)
            self.stdout.write(f'Workspace ID: 1')
            self.stdout.write(f'Project: {project.name} (ID: {project.id})')
            self.stdout.write(f'Sprint Number: {sprint_number}')
            self.stdout.write(f'User Stories: {len(created_assignments)}')
            
            # Calculate total hours and skills
            total_hours = 0
            all_skills = set()
            for assignment in created_assignments:
                backlog_items = Backlog.objects.filter(user_story=assignment.user_story)
                for backlog in backlog_items:
                    total_hours += backlog.estimated_hours or 0
                    if backlog.skills_required:
                        skills = [s.strip() for s in backlog.skills_required.split(',')]
                        all_skills.update(skills)
            
            self.stdout.write(f'Total Effort Hours: {total_hours}h')
            self.stdout.write(f'Required Skills: {", ".join(sorted(all_skills))}')
            self.stdout.write('='*70)
            self.stdout.write(self.style.SUCCESS('\n✓ Sprint is ready for task allocation!'))
            self.stdout.write('Frontend can now fetch this sprint using:')
            self.stdout.write(f'  Workspace-ID: 1')
            self.stdout.write(f'  project_id: 11')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error creating sprint: {str(e)}')
            )
            import traceback
            traceback.print_exc()
