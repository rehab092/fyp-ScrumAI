"""
Analytics Service for Project Progress Tracking
Provides methods to fetch and calculate project metrics, user story stats, and progress tracking
"""

from django.db.models import Q, Count
from django.utils import timezone
from userstorymanager.models import UserStory, Backlog, Project
from sprintmanager.models import Sprint, SprintItem
from delayalerts.models import TaskProgress
from taskalloactionhelper.models import TicketStatusHistory


class ProjectAnalyticsService:
    """Service for fetching project analytics and progress data"""

    @staticmethod
    def get_project_stats(project_id, workspace_id):
        """
        Get comprehensive stats for a project including user stories and their statuses
        
        Args:
            project_id: ID of the project
            workspace_id: ID of the workspace
            
        Returns:
            Dictionary with project stats
        """
        try:
            # Get all backlog items for this project
            backlog_items = Backlog.objects.filter(project_id=str(project_id))
            
            total_stories = backlog_items.count()
            
            # Count by status from Backlog.status field
            in_progress = backlog_items.filter(
                status__iexact='In Progress'
            ).count()
            
            completed = backlog_items.filter(
                status__iexact='Completed'
            ).count()
            
            done = completed  # Done and completed are the same
            
            # Ready = All stories not in progress and not completed
            ready = total_stories - in_progress - completed
            
            # Calculate completion percentage
            completion_rate = 0
            if total_stories > 0:
                completion_rate = round((done / total_stories) * 100, 2)
            
            return {
                'total': total_stories,
                'ready': ready,
                'in_progress': in_progress,
                'completed': completed,
                'done': done,
                'completion_rate': completion_rate
            }
        except Exception as e:
            print(f"Error getting project stats: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'total': 0,
                'ready': 0,
                'in_progress': 0,
                'completed': 0,
                'done': 0,
                'completion_rate': 0
            }

    @staticmethod
    def get_project_user_stories(project_id, workspace_id):
        """
        Get all user stories for a project with their status details
        
        Args:
            project_id: ID of the project
            workspace_id: ID of the workspace
            
        Returns:
            List of user stories with status
        """
        try:
            # Get backlog items (tasks) with their user stories
            backlogs = Backlog.objects.filter(
                project_id=str(project_id)
            ).select_related('user_story')
            
            stories_with_status = []
            for backlog in backlogs:
                story_data = {
                    'id': backlog.task_id,
                    'title': backlog.tasks or f"Task {backlog.task_id}",
                    'status': backlog.status,
                    'priority': backlog.user_story.priority if backlog.user_story else 'Medium',
                    'estimated_hours': backlog.estimated_hours or 0,
                }
                stories_with_status.append(story_data)
            
            return stories_with_status
        except Exception as e:
            print(f"Error getting user stories: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    @staticmethod
    def get_task_status_breakdown(project_id, workspace_id):
        """
        Get breakdown of task statuses for a project
        
        Args:
            project_id: ID of the project
            workspace_id: ID of the workspace
            
        Returns:
            Dictionary with status distribution
        """
        try:
            # Get task progress for all backlog items in this project
            task_progress = TaskProgress.objects.filter(
                task__user_story__project_id=project_id,
                workspace_id=workspace_id
            )
            
            # Count by status
            status_breakdown = {
                'pending': task_progress.filter(status='PENDING').count(),
                'in_progress': task_progress.filter(status='IN_PROGRESS').count(),
                'completed': task_progress.filter(status='COMPLETED').count(),
            }
            
            return status_breakdown
        except Exception as e:
            print(f"Error getting task status breakdown: {str(e)}")
            return {}

    @staticmethod
    def get_all_projects_stats(workspace_id):
        """
        Get stats for all projects in a workspace
        
        Args:
            workspace_id: ID of the workspace
            
        Returns:
            List of project stats
        """
        try:
            # Get all projects in this workspace
            projects = Project.objects.filter(
                workspace_id=workspace_id
            ).distinct()
            
            projects_stats = []
            for project in projects:
                stats = ProjectAnalyticsService.get_project_stats(project.id, workspace_id)
                
                projects_stats.append({
                    'project_id': project.id,
                    'project_name': project.name,
                    **stats
                })
            
            return projects_stats
        except Exception as e:
            print(f"Error getting all projects stats: {str(e)}")
            return []

    @staticmethod
    def get_sprint_project_stats(sprint_id, workspace_id):
        """
        Get stats for projects in a specific sprint
        
        Args:
            sprint_id: ID of the sprint
            workspace_id: ID of the workspace
            
        Returns:
            Dictionary with sprint stats by project
        """
        try:
            # Get task progress for this sprint
            sprint_tasks = TaskProgress.objects.filter(
                sprint_id=sprint_id,
                workspace_id=workspace_id
            )
            
            # Group by project
            sprint_stats = {}
            for task in sprint_tasks:
                try:
                    # Get project ID from the backlog's user story
                    if hasattr(task.task, 'user_story') and task.task.user_story:
                        project_id = task.task.user_story.project_id
                    else:
                        continue
                    
                    if project_id not in sprint_stats:
                        sprint_stats[project_id] = {
                            'total_tasks': 0,
                            'completed_tasks': 0,
                            'completion_rate': 0
                        }
                    
                    sprint_stats[project_id]['total_tasks'] += 1
                    if task.status == 'COMPLETED':
                        sprint_stats[project_id]['completed_tasks'] += 1
                except:
                    continue
            
            # Calculate completion rates
            for project_id in sprint_stats:
                total = sprint_stats[project_id]['total_tasks']
                completed = sprint_stats[project_id]['completed_tasks']
                if total > 0:
                    sprint_stats[project_id]['completion_rate'] = round((completed / total) * 100, 2)
            
            return sprint_stats
        except Exception as e:
            print(f"Error getting sprint project stats: {str(e)}")
            return {}
