"""
Assignment Suggestion Engine
Generates optimal assignment suggestions for sprint tasks.
Considers: skills, capacity, workload balance, urgency, dependencies.
"""
from django.utils import timezone
from django.db.models import Sum, Q
from datetime import timedelta
from .skill_matcher import SkillMatcher
from taskalloactionhelper.models import TaskSuggestion, DeveloperWorkload
from assignment_module.models import TeamMember
from sprintmanager.models import SprintItem


class AssignmentSuggestionEngine:
    """
    Generates optimal assignment suggestions for sprint tasks.
    Creates ranked suggestions based on multiple factors.
    """
    
    def __init__(self):
        self.skill_matcher = SkillMatcher()
    
    def generate_sprint_suggestions(self, sprint_id, workspace_id, overwrite=False):
        """
        Generate assignment suggestions for all tasks in sprint.
        
        Args:
            sprint_id: Sprint to generate suggestions for
            workspace_id: Workspace context
            overwrite: If True, regenerate even if suggestions exist
            
        Returns:
            List of created TaskSuggestion objects
        """
        sprint = SprintItem.objects.filter(sprint_id=sprint_id).first().sprint
        sprint_items = SprintItem.objects.filter(sprint=sprint)
        team_members = TeamMember.objects.filter(workspace_id=workspace_id)
        
        # Get or create workload records for all developers
        workloads = {}
        for dev in team_members:
            workload, created = DeveloperWorkload.objects.get_or_create(
                developer_fk=dev,
                sprint_fk=sprint,
                workspace_fk_id=workspace_id
            )
            workload.calculate_metrics()
            workloads[dev.id] = workload
        
        suggestions = []
        
        for sprint_item in sprint_items:
            task = sprint_item.task
            
            # Skip if suggestion already exists and not overwriting
            if not overwrite:
                existing = TaskSuggestion.objects.filter(
                    sprint_fk=sprint,
                    task_fk=task
                ).first()
                if existing:
                    suggestions.append(existing)
                    continue
            
            # Score each developer
            developer_scores = []
            
            for dev in team_members:
                # 1. Skill match (0-100)
                skill_result = self.skill_matcher.match_task_to_developer(task, dev)
                skill_score = skill_result['overall_score']
                
                # Skip if skill score too low (not viable)
                if skill_score < 30:
                    continue
                
                # 2. Capacity availability (0-100)
                workload = workloads[dev.id]
                capacity_score = self._calculate_capacity_score(workload, task.estimated_hours)
                
                # Skip if no capacity at all
                if capacity_score == 0:
                    continue
                
                # 3. Workload balance score (0-100)
                workload_score = self._calculate_workload_balance_score(workload)
                
                # 4. Experience level match (0-100)
                experience_score = self._calculate_experience_match(dev)
                
                # 5. Dependency/blocker impact (0-100)
                blocker_score = self._calculate_blocker_score(task)
                
                # 6. Urgency factor (0-100)
                urgency_score = self._calculate_urgency_score(task, sprint)
                
                # COMPOSITE SCORE (weighted average)
                composite = (
                    skill_score * 0.40 +      # Skills most important
                    capacity_score * 0.25 +   # Must have capacity
                    workload_score * 0.15 +   # Balance load
                    experience_score * 0.10 + # Experience helps
                    blocker_score * 0.05 +    # Blockages matter
                    urgency_score * 0.05      # Urgency consideration
                )
                
                developer_scores.append({
                    'developer': dev,
                    'composite_score': round(composite, 2),
                    'skill_score': round(skill_score, 2),
                    'capacity_score': round(capacity_score, 2),
                    'workload_score': round(workload_score, 2),
                    'experience_score': round(experience_score, 2),
                    'blocker_score': round(blocker_score, 2),
                    'urgency_score': round(urgency_score, 2),
                    'skill_details': skill_result['skill_breakdown'],
                    'available_hours': round(workload.available_hours, 1),
                })
            
            # Sort by composite score
            developer_scores.sort(key=lambda x: x['composite_score'], reverse=True)
            
            if developer_scores:
                # Create suggestion with top developer
                top_dev = developer_scores[0]
                
                # Always delete existing suggestion for this sprint+task before creating new one
                TaskSuggestion.objects.filter(
                    sprint_fk=sprint,
                    task_fk=task
                ).delete()
                
                suggestion = TaskSuggestion.objects.create(
                    workspace_fk_id=workspace_id,
                    sprint_fk=sprint,
                    task_fk=task,
                    suggested_developer_fk=top_dev['developer'],
                    skill_match_score=top_dev['skill_score'],
                    capacity_score=top_dev['capacity_score'],
                    workload_score=top_dev['workload_score'],
                    experience_score=top_dev['experience_score'],
                    blocker_score=top_dev['blocker_score'],
                    urgency_score=top_dev['urgency_score'],
                    overall_rank=top_dev['composite_score'],
                    skill_match_details=top_dev['skill_details'],
                    alternative_developers=[
                        {
                            'id': d['developer'].id,
                            'name': d['developer'].name,
                            'score': d['composite_score']
                        }
                        for d in developer_scores[1:4]  # Top 3 alternatives
                    ],
                    status='PENDING'
                )
                
                suggestions.append(suggestion)
            else:
                # No viable developer found - delete existing and create unassigned suggestion
                TaskSuggestion.objects.filter(
                    sprint_fk=sprint,
                    task_fk=task
                ).delete()
                
                suggestion = TaskSuggestion.objects.create(
                    workspace_fk_id=workspace_id,
                    sprint_fk=sprint,
                    task_fk=task,
                    suggested_developer_fk=None,
                    skill_match_score=0,
                    capacity_score=0,
                    overall_rank=0,
                    status='REJECTED',  # Mark as rejected (no suitable developer)
                    skill_match_details={'error': 'No viable developer found'}
                )
                suggestions.append(suggestion)
        
        return suggestions
    
    def _calculate_capacity_score(self, workload, task_hours):
        """
        Score based on: does developer have enough free hours?
        
        Returns:
            100 = Perfect fit (has exactly the hours or slightly more)
            70 = Good fit (has 70%+ of needed hours)
            30 = Tight fit (has 40-70% of needed hours)
            0 = Over capacity (insufficient hours)
        """
        available = workload.available_hours
        
        if available >= task_hours:
            # Has enough hours - prefer slight overage (means good utilization)
            if available <= task_hours * 1.2:
                return 100  # Perfect fit
            else:
                return 90  # Has plenty
        
        elif available >= task_hours * 0.7:
            return 70  # Can stretch
        
        elif available >= task_hours * 0.4:
            return 30  # Very tight
        
        else:
            return 0  # Not enough
    
    def _calculate_workload_balance_score(self, workload):
        """
        Score based on current utilization.
        Prefer developers with lower utilization (better balance).
        
        Returns:
            100 = Low utilization (0-50%)
            85 = Moderate-low (50-60%)
            70 = Moderate (60-75%)
            50 = Moderate-high (75-85%)
            30 = High (85-95%)
            10 = Very high (95-100%)
        """
        util = workload.utilization_percentage
        
        if util <= 50:
            return 100
        elif util <= 60:
            return 85
        elif util <= 75:
            return 70
        elif util <= 85:
            return 50
        elif util <= 95:
            return 30
        else:
            return 10
    
    def _calculate_experience_match(self, developer):
        """
        Score based on developer's experience level.
        
        Returns:
            Scalar 0-100 based on years of experience
        """
        if not hasattr(developer, 'experience') or developer.experience is None:
            return 50  # Neutral if unknown
        
        experience = developer.experience
        
        if experience >= 10:
            return 100
        elif experience >= 7:
            return 90
        elif experience >= 5:
            return 80
        elif experience >= 3:
            return 70
        elif experience >= 2:
            return 60
        elif experience >= 1:
            return 50
        else:
            return 40
    
    def _calculate_blocker_score(self, task):
        """
        Check if task has unmet dependencies (blockers).
        
        Returns:
            100 = No blockers
            70 = Some blockers but manageable
            40 = Multiple blockers
            0 = Heavily blocked
        """
        dependencies = task.dependencies.all() if hasattr(task, 'dependencies') else []
        
        if not dependencies:
            return 100
        
        unmet_deps = sum(1 for dep in dependencies if dep.status != 'DONE')
        total_deps = len(list(dependencies))
        
        if unmet_deps == 0:
            return 100
        
        unmet_ratio = unmet_deps / total_deps if total_deps > 0 else 0
        
        if unmet_ratio <= 0.25:
            return 70
        elif unmet_ratio <= 0.5:
            return 40
        else:
            return 0
    
    def _calculate_urgency_score(self, task, sprint):
        """
        Score based on due date proximity.
        More urgent tasks get higher scores to encourage earlier assignment.
        
        Returns:
            100 = Very urgent (due within 3 days)
            85 = Urgent (due within 5-7 days)
            70 = Moderate (due within 10 days)
            50 = Low urgency (due after 10 days)
        """
        today = timezone.now().date()
        
        if not hasattr(task, 'due_date') or task.due_date is None:
            if sprint.end_date:
                task_due = sprint.end_date
            else:
                return 50  # Neutral
        else:
            task_due = task.due_date
        
        days_to_due = (task_due - today).days
        
        if days_to_due <= 3:
            return 100
        elif days_to_due <= 7:
            return 85
        elif days_to_due <= 10:
            return 70
        else:
            return 50
    
    def get_suggestion_summary(self, sprint_id):
        """
        Get summary statistics on suggestions for a sprint.
        
        Returns:
            Dict with counts and coverage info
        """
        suggestions = TaskSuggestion.objects.filter(sprint_fk_id=sprint_id)
        
        return {
            'total_tasks': suggestions.count(),
            'assigned': suggestions.exclude(suggested_developer_fk__isnull=True).count(),
            'unassigned': suggestions.filter(suggested_developer_fk__isnull=True).count(),
            'pending': suggestions.filter(status='PENDING').count(),
            'approved': suggestions.filter(status='APPROVED').count(),
            'rejected': suggestions.filter(status='REJECTED').count(),
            'coverage_percentage': (
                (suggestions.exclude(suggested_developer_fk__isnull=True).count() / 
                 suggestions.count() * 100) 
                if suggestions.count() > 0 else 0
            ),
        }
