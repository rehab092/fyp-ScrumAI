"""
Task Allocation Helper Views
API endpoints for:
- Generating assignment suggestions
- Scrum Master approval workflow
- Developer response to assignments
- Developer ticket management
- Delay detection
"""
import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import timedelta

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from assignment_module.models import AdminWorkspace, TeamMember, ManagementUser
from sprintmanager.models import Sprint, SprintItem
from userstorymanager.models import Backlog, SprintAssignment, UserStory
from taskalloactionhelper.models import (
    TaskSuggestion, 
    AssignmentApprovalWorkflow, 
    DeveloperWorkload, 
    TicketStatusHistory
)
from taskalloactionhelper.services.suggestion_engine import AssignmentSuggestionEngine
from taskalloactionhelper.services.skill_matcher import SkillMatcher
from assignment_module.models import Notification


def _normalize_skill_list(value):
    if not value:
        return []

    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except (TypeError, ValueError, json.JSONDecodeError):
            pass

        return [part.strip() for part in value.split(',') if part.strip()]

    return [str(value).strip()]


def _extract_history_bonus(member, backlog, sprint_project_name):
    past_projects = (getattr(member, 'Past_Projects', '') or '').lower()
    if not past_projects:
        return 0, []

    signals = []
    bonus = 0

    project_name = str(sprint_project_name or '').strip().lower()
    user_story = getattr(backlog, 'user_story', None)
    story_role = str(getattr(user_story, 'role', '') or '').strip().lower()
    story_goal = str(getattr(user_story, 'goal', '') or '').strip().lower()
    task_title = str(getattr(backlog, 'tasks', '') or '').strip().lower()

    if project_name and project_name in past_projects:
        bonus += 30
        signals.append(f'worked on similar project {sprint_project_name}')

    if story_role and story_role in past_projects:
        bonus += 15
        signals.append(f'handled similar role {getattr(user_story, "role", "")}')

    if story_goal and story_goal[:40] in past_projects:
        bonus += 10
        signals.append('similar user story goal')

    task_keywords = [word for word in task_title.split() if len(word) > 4]
    for keyword in task_keywords[:4]:
        if keyword in past_projects:
            bonus += 5
            signals.append(f'past project includes {keyword}')

    return min(bonus, 40), signals[:3]


def _get_member_sprint_capacity(member, sprint_weeks):
    weekly_capacity = getattr(member, 'capacityHours', None) or 40
    assigned_hours = getattr(member, 'assignedHours', None) or 0
    available_hours = max(0, weekly_capacity - assigned_hours)
    return weekly_capacity, available_hours, assigned_hours


def _get_task_weekly_load(task, sprint_weeks):
    total_hours = float(getattr(task, 'estimated_hours', 0) or 0)
    weeks = max(1, sprint_weeks or 2)
    return round(total_hours / weeks, 2)
    
def _get_scrum_master_email(workspace):
    scrum_master = ManagementUser.objects.filter(workspace=workspace, role='SCRUM_MASTER').first()
    if scrum_master and scrum_master.email:
        return scrum_master.email
    return getattr(workspace, 'adminEmail', '') or ''


def _build_assignment_plan(task_objects, workspace, sprint_project_name, sprint_weeks):
    team_members = TeamMember.objects.filter(workspace=workspace)
    skill_matcher = SkillMatcher()

    dev_workloads = {}
    for member in team_members:
        sprint_capacity, available_hours, assigned_hours = _get_member_sprint_capacity(member, sprint_weeks)
        dev_workloads[member.id] = {
            'name': member.name or f'Developer {member.id}',
            'email': member.email or '',
            'skills': _normalize_skill_list(member.skills),
            'experience': getattr(member, 'Experience', 0) or 0,
            'past_projects': getattr(member, 'Past_Projects', '') or '',
            'assigned_hours': assigned_hours,
            'planned_assigned_hours': 0,
            'total_capacity': sprint_capacity,
            'available_hours': available_hours,
            'assignments': [],
        }

    assignment_plan = []
    unassigned_tasks = []

    for task in task_objects:
        task_skills = _normalize_skill_list(getattr(task, 'skills_required', None))
        estimated_hours = float(getattr(task, 'estimated_hours', 0) or 0)
        weekly_load = _get_task_weekly_load(task, sprint_weeks)
        task_title = getattr(task, 'tasks', '') or 'Untitled'

        candidate_rows = []
        for member in team_members:
            dev_state = dev_workloads[member.id]
            planned_assigned = dev_state['assigned_hours'] + dev_state['planned_assigned_hours']
            planned_available = max(0, dev_state['total_capacity'] - planned_assigned)

            skill_match = skill_matcher._score_skill_match_comprehensive(task_skills, dev_state['skills'])
            history_bonus, history_signals = _extract_history_bonus(member, task, sprint_project_name)
            experience_score = min(100, float(dev_state['experience']) * 4)

            if weekly_load > 0:
                capacity_score = min(100, (planned_available / weekly_load) * 100)
            else:
                capacity_score = 100

            workload_score = 100
            if dev_state['total_capacity'] > 0:
                workload_score = max(0, 100 - ((planned_assigned / dev_state['total_capacity']) * 100))

            overall_score = (
                (skill_match * 0.45)
                + (capacity_score * 0.20)
                + (workload_score * 0.15)
                + (experience_score * 0.10)
                + (min(100, history_bonus * 2.5) * 0.10)
            )

            candidate = {
                'developer_id': member.id,
                'developer_name': dev_state['name'],
                'email': dev_state['email'],
                'skills': dev_state['skills'],
                'skill_match': round(skill_match, 1),
                'history_bonus': history_bonus,
                'history_signals': history_signals,
                'available_hours': round(planned_available, 1),
                'total_capacity': round(dev_state['total_capacity'], 1),
                'assigned_hours': round(planned_assigned, 1),
                'capacity_score': round(capacity_score, 1),
                'workload_score': round(workload_score, 1),
                'experience_score': round(experience_score, 1),
                'overall_score': round(overall_score, 1),
                'can_fit': planned_available >= weekly_load,
            }

            if candidate['available_hours'] > 0:
                candidate_rows.append(candidate)

        candidate_rows.sort(
            key=lambda item: (item['overall_score'], item['skill_match'], item['available_hours']),
            reverse=True,
        )

        recommended_dev = None
        assignment_mode = 'unassigned'

        if candidate_rows:
            skilled_candidates = [item for item in candidate_rows if item['skill_match'] > 0]
            if skilled_candidates:
                recommended_dev = skilled_candidates[0]
                assignment_mode = 'skill'
            else:
                recommended_dev = candidate_rows[0]
                assignment_mode = 'availability'

        if recommended_dev:
            dev_state = dev_workloads[recommended_dev['developer_id']]
            dev_state['planned_assigned_hours'] += weekly_load
            dev_state['assignments'].append({
                'task_id': getattr(task, 'task_id', None) or getattr(task, 'id', None),
                'task_title': task_title[:50],
                'hours': weekly_load,
                'total_hours': estimated_hours,
                'assignment_mode': assignment_mode,
            })

            if assignment_mode == 'skill':
                reason_text = 'Best overall skill and capacity fit'
            elif assignment_mode == 'availability':
                reason_text = 'No skill match found, assigned to the most available developer'
            else:
                reason_text = 'Assigned by fallback'

            workload_level = 'Low'
            if dev_state['planned_assigned_hours'] >= (dev_state['total_capacity'] * 0.75):
                workload_level = 'High'
            elif dev_state['planned_assigned_hours'] >= (dev_state['total_capacity'] * 0.5):
                workload_level = 'Medium'

            reasoning = {
                'skill_match': f"{recommended_dev['skill_match']}% match" if recommended_dev['skill_match'] > 0 else 'No direct skill match',
                'capacity': f"{recommended_dev['available_hours']}h available from sprint capacity",
                'workload': workload_level,
                'reason': reason_text,
                'history': recommended_dev['history_signals'][:3],
                'assignment_mode': assignment_mode,
            }
        else:
            reasoning = {
                'skill_match': 'N/A',
                'capacity': 'All developers fully booked',
                'workload': 'N/A',
                'reason': 'All developers are occupied for this sprint',
                'history': [],
                'assignment_mode': 'unassigned',
            }
            unassigned_tasks.append(getattr(task, 'task_id', getattr(task, 'id', None)))

        assignment_entry = {
            'task_id': getattr(task, 'task_id', None) or getattr(task, 'id', None),
            'task_title': task_title[:50],
            'task_description': task_title[:100],
            'required_skills': task_skills,
            'estimated_hours': estimated_hours,
            'allocated_weekly_hours': weekly_load,
            'status': 'UNASSIGNED' if recommended_dev is None else 'PENDING',
            'recommended_developer': recommended_dev,
            'all_candidates': candidate_rows[:5],
            'reasoning': reasoning,
        }

        assignment_plan.append(assignment_entry)

    total_hours = sum(item['estimated_hours'] for item in assignment_plan)
    assigned_dev_count = len([dev for dev in dev_workloads.values() if dev['planned_assigned_hours'] > 0])
    no_developer_available = len(unassigned_tasks) > 0

    team_workload_summary = {
        'total_developers': len(team_members),
        'developers_assigned': assigned_dev_count,
        'total_sprint_hours': total_hours,
        'average_load': round(total_hours / len(team_members), 1) if team_members else 0,
        'developer_assignments': [
            {
                'developer_name': dev['name'],
                'email': dev['email'],
                'assigned_hours': round(dev['assigned_hours'] + dev['planned_assigned_hours'], 1),
                'capacity': round(dev['total_capacity'], 1),
                'available_hours': round(max(0, dev['total_capacity'] - (dev['assigned_hours'] + dev['planned_assigned_hours'])), 1),
                'utilization': f"{round(((dev['assigned_hours'] + dev['planned_assigned_hours']) / dev['total_capacity']) * 100, 1)}%" if dev['total_capacity'] else '0%',
                'tasks': dev['assignments'],
            }
            for dev in dev_workloads.values() if dev['planned_assigned_hours'] > 0
        ],
        'no_developer_available': no_developer_available,
        'unassigned_tasks_count': len(unassigned_tasks),
    }

    return assignment_plan, team_workload_summary, no_developer_available, assigned_dev_count


# ==================== Phase 1: Generate Suggestions ====================

@csrf_exempt
@require_http_methods(["POST"])
def generate_suggestions(request):
    """
    POST /api/module2/assignments/generate-suggestions/
    
    Generate assignment suggestions for all tasks in a sprint.
    Scrum Master reviews these and approves/changes developers.
    """
    try:
        workspace_id = request.headers.get('Workspace-ID')
        if not workspace_id:
            return JsonResponse({
                'success': False,
                'error': 'Missing Workspace-ID header'
            }, status=400)
        
        data = json.loads(request.body)
        sprint_id = data.get('sprint_id')
        recompute = data.get('recompute', False)
        
        if not sprint_id:
            return JsonResponse({
                'success': False,
                'error': 'Missing sprint_id'
            }, status=400)
        
        try:
            workspace = AdminWorkspace.objects.get(id=workspace_id)
        except AdminWorkspace.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Workspace {workspace_id} not found'
            }, status=404)
        
        # Check if sprint_id is from SprintAssignment (format: "sprint_assign_N") or from Sprint table (numeric)
        is_sprint_assignment = False
        sprint_numeric_id = None
        sprint_assignment = None
        sprint = None
        
        if isinstance(sprint_id, str) and sprint_id.startswith('sprint_assign_'):
            is_sprint_assignment = True
            try:
                assignment_id = int(sprint_id.split('_')[-1])
                sprint_assignment = SprintAssignment.objects.get(id=assignment_id)
            except (ValueError, SprintAssignment.DoesNotExist):
                return JsonResponse({
                    'success': False,
                    'error': f'SprintAssignment {sprint_id} not found'
                }, status=404)
        else:
            # Regular Sprint ID
            try:
                sprint_numeric_id = int(sprint_id) if isinstance(sprint_id, str) else sprint_id
                sprint = Sprint.objects.get(id=sprint_numeric_id, workspace=workspace)
            except (ValueError, Sprint.DoesNotExist):
                return JsonResponse({
                    'success': False,
                    'error': f'Sprint {sprint_id} not found in workspace. Please select a valid sprint.'
                }, status=404)
        
        # Generate suggestions using the shared planner for both sprint sources.
        sprint_weeks = int(getattr(workspace, 'defaultSprintLength', 2) or 2)

        if is_sprint_assignment:
            task_objects = list(Backlog.objects.filter(user_story=sprint_assignment.user_story))
            sprint_name = f"Sprint {sprint_assignment.sprint_number}"
            sprint_goal = sprint_assignment.user_story.goal if sprint_assignment.user_story else "User Story Tasks"
            sprint_project_name = getattr(sprint_assignment.project, 'name', '') or ''
        else:
            sprint_items = SprintItem.objects.filter(sprint=sprint).select_related('task', 'task__user_story')
            task_objects = [item.task for item in sprint_items if item.task]
            sprint_name = sprint.name
            sprint_goal = sprint.goal
            sprint_project_name = str(getattr(sprint, 'project_id', '') or '')

        assignment_plan, team_workload_summary, no_developer_available, assigned_dev_count = _build_assignment_plan(
            task_objects=task_objects,
            workspace=workspace,
            sprint_project_name=sprint_project_name,
            sprint_weeks=sprint_weeks,
        )

        response_payload = {
            'success': True,
            'sprint_id': sprint_id,
            'sprint_name': sprint_name,
            'sprint_goal': sprint_goal,
            'total_tasks': len(assignment_plan),
            'assignment_plan': assignment_plan,
            'team_workload_summary': team_workload_summary,
            'no_developer_available': no_developer_available,
            'alert_message': 'All developers are occupied for this sprint' if no_developer_available else '',
            'message': f'Generated assignment plan for {len(assignment_plan)} tasks across {assigned_dev_count} developers',
        }

        if not is_sprint_assignment:
            for task_object, plan_entry in zip(task_objects, assignment_plan):
                recommended = plan_entry.get('recommended_developer') or {}
                developer_id = recommended.get('developer_id')
                suggested_developer = TeamMember.objects.filter(id=developer_id).first() if developer_id else None
                alternative_developers = [
                    {
                        'id': candidate.get('developer_id'),
                        'name': candidate.get('developer_name'),
                        'score': candidate.get('overall_score', 0),
                    }
                    for candidate in plan_entry.get('all_candidates', [])[1:4]
                ]

                suggestion, _ = TaskSuggestion.objects.update_or_create(
                    sprint_fk=sprint,
                    task_fk=task_object,
                    defaults={
                        'workspace_fk': workspace,
                        'suggested_developer_fk': suggested_developer,
                        'skill_match_score': float(recommended.get('skill_match') or 0),
                        'capacity_score': float(recommended.get('capacity_score') or 0),
                        'workload_score': float(recommended.get('workload_score') or 0),
                        'experience_score': float(recommended.get('experience_score') or 0),
                        'overall_rank': float(recommended.get('overall_score') or 0),
                        'skill_match_details': {
                            'required_skills': plan_entry.get('required_skills', []),
                            'reasoning': plan_entry.get('reasoning', {}),
                            'assignment_mode': plan_entry.get('reasoning', {}).get('assignment_mode'),
                        },
                        'alternative_developers': alternative_developers,
                        'status': 'PENDING' if suggested_developer else 'REJECTED',
                    },
                )

                plan_entry['suggestion_id'] = suggestion.id
                plan_entry['suggested_developer'] = plan_entry.get('recommended_developer')

            response_payload['sprint_dates'] = f"{sprint.start_date} to {sprint.end_date}"

        return JsonResponse(response_payload, status=200)
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error generating suggestions: {str(e)}'
        }, status=500)


# ==================== Phase 2: Scrum Master Review ====================

@csrf_exempt
@require_http_methods(["GET"])
def list_suggestions(request):
    """
    GET /api/module2/assignments/suggestions/?sprint_id=5&status=PENDING
    
    Get all suggestions for a sprint that Scrum Master can review.
    """
    try:
        workspace_id = request.headers.get('Workspace-ID')
        sprint_id = request.GET.get('sprint_id')
        status_filter = request.GET.get('status', 'PENDING')
        
        if not workspace_id or not sprint_id:
            return JsonResponse({
                'success': False,
                'error': 'Missing Workspace-ID header or sprint_id'
            }, status=400)
        
        # Get suggestions
        suggestions = TaskSuggestion.objects.filter(
            workspace_fk_id=workspace_id,
            sprint_fk_id=sprint_id
        )
        
        if status_filter != 'ALL':
            suggestions = suggestions.filter(status=status_filter)
        
        suggestion_data = []
        for sugg in suggestions:
            workflow = getattr(sugg, 'approval_workflow', None)
            workflow_status = workflow.current_status if workflow else None
            suggestion_data.append({
                'suggestion_id': sugg.id,
                'task_id': getattr(sugg.task_fk, 'task_id', getattr(sugg.task_fk, 'id', None)),
                'task_title': sugg.task_fk.task_id,
                'task_description': sugg.task_fk.tasks[:100] if getattr(sugg.task_fk, 'tasks', None) else '',
                'required_skills': sugg.skill_match_details.get('required_skills', []) if isinstance(sugg.skill_match_details, dict) else [],
                'estimated_hours': sugg.task_fk.estimated_hours if getattr(sugg.task_fk, 'estimated_hours', None) is not None else 0,
                'suggested_developer': {
                    'id': sugg.suggested_developer_fk.id,
                    'name': sugg.suggested_developer_fk.name,
                    'email': sugg.suggested_developer_fk.email,
                } if sugg.suggested_developer_fk else None,
                'scores': {
                    'skill_match': sugg.skill_match_score,
                    'capacity': sugg.capacity_score,
                    'workload': sugg.workload_score,
                    'overall': sugg.overall_rank,
                },
                'alternatives': sugg.alternative_developers,
                'status': sugg.status,
                'workflow_status': workflow_status,
                'approval_workflow_id': workflow.id if workflow else None,
                'developer_response': workflow.developer_response if workflow else None,
                'notification_sent': bool(workflow and workflow.developer_notification_sent),
                'created_at': sugg.suggested_at.isoformat(),
            })
        
        return JsonResponse({
            'success': True,
            'suggestions': suggestion_data,
            'pending_count': suggestions.filter(status='PENDING').count(),
            'approved_count': suggestions.filter(status='APPROVED').count(),
            'rejected_count': suggestions.filter(status='REJECTED').count(),
            'workflow_counts': {
                'sm_approved': sum(1 for item in suggestion_data if item.get('workflow_status') == 'SM_APPROVED'),
                'dev_pending': sum(1 for item in suggestion_data if item.get('workflow_status') == 'DEV_PENDING'),
                'active': sum(1 for item in suggestion_data if item.get('workflow_status') == 'ACTIVE'),
            },
        }, status=200)
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def approve_or_modify_suggestion(request, suggestion_id):
    """
    POST /api/module2/assignments/suggestion/{id}/approve/
    
    Scrum Master approves, rejects, or changes the developer.
    """
    try:
        workspace_id = request.headers.get('Workspace-ID')
        data = json.loads(request.body)
        
        action = data.get('action')  # approve, reject, change_developer
        reason = data.get('reason', '')
        new_developer_id = data.get('new_developer_id')
        
        if action not in ['approve', 'reject', 'change_developer']:
            return JsonResponse({
                'success': False,
                'error': 'Invalid action'
            }, status=400)
        
        # Get suggestion
        suggestion = TaskSuggestion.objects.select_related('sprint_fk').get(id=suggestion_id)

        workspace = None
        if workspace_id:
            workspace = AdminWorkspace.objects.filter(id=workspace_id).first()
        if workspace is None and getattr(suggestion, 'workspace_fk_id', None):
            workspace = suggestion.workspace_fk
        if workspace is None and getattr(suggestion, 'sprint_fk', None):
            workspace = getattr(suggestion.sprint_fk, 'workspace', None)

        if workspace is None:
            return JsonResponse({
                'success': False,
                'error': 'Unable to resolve workspace for this suggestion. Regenerate the sprint plan.'
            }, status=400)

        if getattr(suggestion, 'workspace_fk_id', None) != workspace.id:
            suggestion.workspace_fk = workspace
        
        if action == 'approve':
            suggestion.status = 'APPROVED'
            assigned_dev = suggestion.suggested_developer_fk
        
        elif action == 'reject':
            suggestion.status = 'REJECTED'
            assigned_dev = None
        
        elif action == 'change_developer':
            if not new_developer_id:
                return JsonResponse({
                    'success': False,
                    'error': 'new_developer_id required for change_developer action'
                }, status=400)
            
            new_dev = TeamMember.objects.get(id=new_developer_id)
            suggestion.suggested_developer_fk = new_dev
            suggestion.manually_assigned_to_fk = new_dev
            suggestion.change_reason = reason
            suggestion.status = 'MANUALLY_CHANGED'
            assigned_dev = new_dev
        
        suggestion.sm_reviewed_at = timezone.now()
        # sm_reviewed_by_fk would need auth context - set as None for now
        suggestion.save()
        
        # Create or update approval workflow
        workflow, created = AssignmentApprovalWorkflow.objects.get_or_create(
            task_suggestion_fk=suggestion,
            defaults={
                'workspace_fk': workspace,
            }
        )

        if getattr(workflow, 'workspace_fk_id', None) != workspace.id:
            workflow.workspace_fk = workspace
        
        if action == 'approve' or action == 'change_developer':
            workflow.current_status = 'SM_APPROVED'
            workflow.sm_approval_notes = reason
            workflow.sm_approved_developer_fk = assigned_dev
            workflow.sm_review_timestamp = timezone.now()
        else:
            workflow.current_status = 'SM_REJECTED'
            workflow.sm_approval_notes = reason
            workflow.sm_review_timestamp = timezone.now()
        
        workflow.save()
        
        return JsonResponse({
            'success': True,
            'suggestion_id': suggestion_id,
            'action': action,
            'new_status': workflow.current_status,
            'approval_workflow_id': workflow.id,
            'next_step': 'Send notification to developer' if action != 'reject' else 'Task unassigned',
            'developer_email': assigned_dev.email if assigned_dev else None,
        }, status=200)
    
    except TaskSuggestion.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Suggestion not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ==================== Phase 3: Notify Developer ====================

@csrf_exempt
@require_http_methods(["POST"])
def notify_developer_of_assignment(request):
    """
    POST /api/module2/assignments/notify-developer/
    
    Send notification to developer about their assignment,
    requesting acceptance or rejection.
    """
    try:
        workspace_id = request.headers.get('Workspace-ID')
        data = json.loads(request.body)
        
        approval_workflow_id = data.get('approval_workflow_id')
        
        if not approval_workflow_id:
            return JsonResponse({
                'success': False,
                'error': 'approval_workflow_id required'
            }, status=400)
        
        workflow = AssignmentApprovalWorkflow.objects.get(id=approval_workflow_id)
        
        if workflow.current_status not in ['SM_APPROVED', 'MANUALLY_CHANGED']:
            return JsonResponse({
                'success': False,
                'error': 'Workflow must be SM_APPROVED to notify developer'
            }, status=400)
        
        # Send notification
        developer = workflow.sm_approved_developer_fk
        task = workflow.task_suggestion_fk.task_fk
        
        notification = Notification.objects.create(
            workspace_id=workspace_id,
            user_email=developer.email,
            title='Task Assignment',
            message=f'Scrum Master assigned task "{task.task_id}" to you. Please accept or reject.',
            type='INFO',
        )
        
        # Update workflow status
        workflow.current_status = 'DEV_PENDING'
        workflow.developer_notification_sent = timezone.now()
        workflow.save()
        
        return JsonResponse({
            'success': True,
            'notification_sent': True,
            'developer_email': developer.email,
            'developer_name': developer.name,
            'task_id': task.task_id,
            'message': f'Developer {developer.name} has been sent assignment notification'
        }, status=200)
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ==================== Phase 4: Developer Response ====================

@csrf_exempt
@require_http_methods(["POST"])
def developer_response_to_assignment(request):
    """
    POST /api/module2/assignments/developer-response/
    
    Developer accepts or rejects the assignment.
    """
    try:
        workspace_id = request.headers.get('Workspace-ID')
        data = json.loads(request.body)
        
        approval_workflow_id = data.get('approval_workflow_id')
        response_action = data.get('response')  # ACCEPT or REJECT
        reason = data.get('reason', '')
        
        if response_action not in ['ACCEPT', 'REJECT']:
            return JsonResponse({
                'success': False,
                'error': 'response must be ACCEPT or REJECT'
            }, status=400)
        
        workflow = AssignmentApprovalWorkflow.objects.get(id=approval_workflow_id)
        
        workflow.developer_response = response_action
        workflow.developer_response_timestamp = timezone.now()
        workflow.developer_rejection_reason = reason
        
        if response_action == 'ACCEPT':
            workflow.current_status = 'ACTIVE'
            workflow.save()
            
            # Update developer workload
            dev = workflow.sm_approved_developer_fk
            sprint_weeks = int(getattr(workflow.task_suggestion_fk.sprint_fk, 'workspace', None).defaultSprintLength if getattr(workflow.task_suggestion_fk.sprint_fk, 'workspace', None) else 2)
            weekly_load = _get_task_weekly_load(workflow.task_suggestion_fk.task_fk, sprint_weeks)
            workload, _ = DeveloperWorkload.objects.get_or_create(
                developer_fk=dev,
                sprint_fk=workflow.task_suggestion_fk.sprint_fk,
                defaults={
                    'workspace_fk': workflow.workspace_fk,
                    'total_capacity_hours': getattr(dev, 'capacityHours', 40) or 40,
                }
            )
            workload.workspace_fk = workflow.workspace_fk
            workload.total_capacity_hours = getattr(dev, 'capacityHours', 40) or 40
            workload.assigned_hours += weekly_load
            workload.calculate_metrics()

            dev.assignedHours = int(round((getattr(dev, 'assignedHours', 0) or 0) + weekly_load))
            dev.save(update_fields=['assignedHours'])
            
            # Create ticket status history
            TicketStatusHistory.objects.create(
                task_fk=workflow.task_suggestion_fk.task_fk,
                sprint_fk=workflow.task_suggestion_fk.sprint_fk,
                new_status='IN_PROGRESS',
                changed_by_fk=dev,
                reason='Assignment accepted by developer and moved to in progress'
            )
            
            # Notify Scrum Master
            Notification.objects.create(
                workspace_id=workspace_id,
                user_email=_get_scrum_master_email(workflow.workspace_fk),
                title='Task Accepted',
                message=f'Developer {dev.name} accepted task {workflow.task_suggestion_fk.task_fk.task_id}',
                type='SUCCESS',
            )
            
            return JsonResponse({
                'success': True,
                'status': 'ACTIVE',
                'assignment_id': workflow.id,
                'message': f'Task assigned to {dev.name} successfully'
            }, status=200)
        
        else:  # REJECT
            workflow.current_status = 'DEV_REJECTED'
            workflow.save()
            
            # Notify Scrum Master about rejection
            Notification.objects.create(
                workspace_id=workspace_id,
                user_email=_get_scrum_master_email(workflow.workspace_fk),
                title='Task Assignment Rejected',
                message=f'Developer {dev.name} rejected task {workflow.task_suggestion_fk.task_fk.task_id}. Reason: {reason}',
                type='WARNING',
            )
            
            return JsonResponse({
                'success': True,
                'status': 'DEV_REJECTED',
                'message': f'Assignment rejected by developer. Reason: {reason}',
                'sm_notified': True,
                'alternative_suggestions_available': len(
                    workflow.task_suggestion_fk.alternative_developers
                )
            }, status=200)
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ==================== Phase 5: Developer Portal - My Tickets ====================

@csrf_exempt
@require_http_methods(["GET"])
def get_developer_tickets(request):
    """
    GET /api/module2/developer/my-tickets/?sprint_id=5
    
    Get all tickets assigned to the current developer as Jira-like display.
    """
    try:
        workspace_id = request.headers.get('Workspace-ID')
        developer_email = request.headers.get('X-Developer-Email')  # From JWT or session
        sprint_id = request.GET.get('sprint_id')
        
        if not developer_email:
            return JsonResponse({
                'success': False,
                'error': 'Developer email required in X-Developer-Email header'
            }, status=400)
        
        # Get developer
        developer = TeamMember.objects.get(
            workspace_id=workspace_id,
            email=developer_email
        )
        
        # Get assignments
        workflows = AssignmentApprovalWorkflow.objects.filter(
            workspace_fk_id=workspace_id,
            sm_approved_developer_fk=developer,
            current_status__in=['SM_APPROVED', 'DEV_PENDING', 'DEV_ACCEPTED', 'ACTIVE']
        )
        
        if sprint_id:
            workflows = workflows.filter(
                task_suggestion_fk__sprint_fk_id=sprint_id
            )
        
        # Build ticket data
        tickets = []
        for workflow in workflows:
            task = workflow.task_suggestion_fk.task_fk
            sprint = workflow.task_suggestion_fk.sprint_fk
            sprint_due_date = getattr(sprint, 'end_date', None)
            
            # Get latest status
            latest_status = TicketStatusHistory.objects.filter(
                task_fk=task,
                sprint_fk=sprint
            ).order_by('-timestamp').first()
            
            current_status = latest_status.new_status if latest_status else 'TO_DO'
            if current_status not in ['DONE', 'DELAYED']:
                effective_due_date = getattr(task, 'due_date', None) or sprint_due_date
                if effective_due_date and timezone.now().date() > effective_due_date:
                    current_status = 'DELAYED'
            
            # Check if delayed
            is_delayed = False
            effective_due_date = getattr(task, 'due_date', None) or sprint_due_date
            if current_status != 'DONE' and effective_due_date:
                if timezone.now().date() > effective_due_date:
                    is_delayed = True
            
            tickets.append({
                'ticket_id': f"TASK-{getattr(task, 'task_id', getattr(task, 'id', ''))}",
                'task_name': task.tasks,
                'title': task.task_id,
                'description': task.tasks if hasattr(task, 'tasks') else '',
                'assigned_by': 'Scrum Master',  # Could fetch SM name
                'assigned_at': workflow.developer_notification_sent.isoformat() if workflow.developer_notification_sent else None,
                'accepted_at': workflow.developer_response_timestamp.isoformat() if workflow.developer_response_timestamp else None,
                'due_date': effective_due_date.isoformat() if effective_due_date else None,
                'sprint_reference': {
                    'id': sprint.id,
                    'name': sprint.name,
                    'goal': sprint.goal,
                    'start_date': sprint.start_date.isoformat() if sprint.start_date else None,
                    'end_date': sprint.end_date.isoformat() if sprint.end_date else None,
                },
                'priority': 'HIGH',  # Could come from user story priority
                'status': current_status,
                'status_label': current_status.replace('_', ' ').title(),
                'estimated_hours': task.estimated_hours,
                'is_delayed': is_delayed,
                'progress_percentage': latest_status.progress_percentage if latest_status else 0,
                'workflow_id': workflow.id,
                'approval_workflow_id': workflow.id,
                'can_respond': workflow.current_status in ['SM_APPROVED', 'DEV_PENDING'],
                'workflow_status': workflow.current_status,
                'developer_response': workflow.developer_response,
            })
        
        # Get workload summary
        workload = DeveloperWorkload.objects.filter(
            developer_fk=developer,
            sprint_fk__id=sprint_id
        ).first() if sprint_id else DeveloperWorkload.objects.filter(
            developer_fk=developer
        ).order_by('-updated_at').first()
        
        workload_summary = {}
        if workload:
            workload_summary = {
                'total_capacity': workload.total_capacity_hours,
                'assigned_hours': workload.assigned_hours,
                'completed_hours': workload.completed_hours,
                'available_hours': workload.available_hours,
                'utilization': f"{workload.utilization_percentage:.1f}%",
                'delayed_count': len(workload.delayed_tasks),
                'blocked_count': len(workload.blocked_tasks),
            }
        
        return JsonResponse({
            'success': True,
            'developer': {
                'id': developer.id,
                'name': developer.name,
                'email': developer.email,
            },
            'tickets': tickets,
            'workload_summary': workload_summary,
        }, status=200)
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ==================== Phase 6: Developer Update Ticket Status ====================

@csrf_exempt
@require_http_methods(["PUT", "POST"])
def update_ticket_status(request, task_id):
    """
    PUT /api/module2/developer/task/{task_id}/status/
    
    Developer updates task status and progress.
    """
    try:
        workspace_id = request.headers.get('Workspace-ID')
        developer_email = request.headers.get('X-Developer-Email')
        data = json.loads(request.body)
        
        new_status = data.get('new_status')  # TO_DO, IN_PROGRESS, DONE, BLOCKED
        progress_percentage = data.get('progress_percentage', 0)
        reason = data.get('reason', '')
        
        if new_status not in ['TO_DO', 'IN_PROGRESS', 'DONE', 'BLOCKED']:
            return JsonResponse({
                'success': False,
                'error': 'Invalid status'
            }, status=400)
        
        # Get task
        task = __import__('userstorymanager.models', fromlist=['Backlog']).Backlog.objects.get(task_id=task_id)
        developer = TeamMember.objects.get(email=developer_email)

        workflow = AssignmentApprovalWorkflow.objects.filter(
            task_suggestion_fk__task_fk=task,
            sm_approved_developer_fk=developer,
        ).first()

        if not workflow or workflow.current_status != 'ACTIVE':
            return JsonResponse({
                'success': False,
                'error': 'Status can only be changed for accepted tasks'
            }, status=400)
        
        # Get current status
        latest_history = TicketStatusHistory.objects.filter(
            task_fk=task
        ).order_by('-timestamp').first()
        
        old_status = latest_history.new_status if latest_history else None
        
        # Create status history entry
        status_history = TicketStatusHistory.objects.create(
            task_fk=task,
            sprint_fk=latest_history.sprint_fk if latest_history else None,
            old_status=old_status,
            new_status=new_status,
            changed_by_fk=developer,
            reason=reason,
            progress_percentage=progress_percentage,
        )
        
        # Notify Scrum Master
        Notification.objects.create(
            workspace_id=workspace_id,
            user_email=_get_scrum_master_email(workflow.workspace_fk),
            title='Task Status Updated',
            message=f'Task {task.task_id} updated to {new_status}',
            type='INFO',
        )
        
        return JsonResponse({
            'success': True,
            'task_id': task_id,
            'new_status': new_status,
            'status_changed_at': status_history.timestamp.isoformat(),
            'workflow_id': workflow.id,
            'notification_sent_to': ['scrum_master@example.com']  # Would be real SM email
        }, status=200)
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ==================== TESTING: Fetch Sprint Assignment Data ====================

@csrf_exempt
@require_http_methods(["GET"])
def test_fetch_sprint_assignment_data(request):
    """
    GET /api/module2/test/sprint-assignment/?sprint_id=1
    
    [TESTING ONLY] Fetch sprint and task data from SprintItem (sprint assignment table).
    Only returns data for sprints created by product owner.
    """
    try:
        workspace_id = request.headers.get('Workspace-ID')
        sprint_id = request.GET.get('sprint_id')
        
        if not workspace_id:
            return JsonResponse({
                'success': False,
                'error': 'Missing Workspace-ID header'
            }, status=400)
        
        if not sprint_id:
            return JsonResponse({
                'success': False,
                'error': 'Missing sprint_id parameter'
            }, status=400)
        
        # Get the sprint
        try:
            sprint = Sprint.objects.get(id=sprint_id, workspace_id=workspace_id)
        except Sprint.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Sprint {sprint_id} not found in workspace'
            }, status=404)
        
        # Fetch all tasks from sprint assignment table (SprintItem)
        sprint_items = SprintItem.objects.filter(
            sprint=sprint
        ).select_related('task', 'sprint__workspace')
        
        if not sprint_items.exists():
            return JsonResponse({
                'success': True,
                'sprint': {
                    'id': sprint.id,
                    'name': sprint.name,
                    'goal': sprint.goal,
                    'start_date': sprint.start_date.isoformat(),
                    'end_date': sprint.end_date.isoformat(),
                    'is_active': sprint.is_active,
                    'created_by': 'Product Owner'
                },
                'total_tasks': 0,
                'tasks': [],
                'message': 'Sprint exists but has no tasks assigned'
            }, status=200)
        
        # Build task data
        tasks_data = []
        for sprint_item in sprint_items:
            task = sprint_item.task
            
            # Extract skills from task
            task_skills = []
            if hasattr(task, 'skills_required') and task.skills_required:
                if isinstance(task.skills_required, str):
                    task_skills = [s.strip() for s in task.skills_required.split(',') if s.strip()]
                elif isinstance(task.skills_required, list):
                    task_skills = task.skills_required
            
            task_obj = {
                'sprint_item_id': sprint_item.id,
                'task_id': task.task_id if hasattr(task, 'task_id') else task.id,
                'task_title': task.tasks if hasattr(task, 'tasks') else 'Untitled',
                'description': task.tasks[:100] if hasattr(task, 'tasks') else '',
                'estimated_hours': task.estimated_hours if hasattr(task, 'estimated_hours') else 0,
                'priority': 'MEDIUM',
                'status': 'TO_DO',
                'skills_required': task_skills,
                'user_story': str(task.user_story.id) if hasattr(task, 'user_story') and task.user_story else '',
            }
            tasks_data.append(task_obj)
        
        return JsonResponse({
            'success': True,
            'sprint': {
                'id': sprint.id,
                'name': sprint.name,
                'goal': sprint.goal,
                'start_date': sprint.start_date.isoformat(),
                'end_date': sprint.end_date.isoformat(),
                'is_active': sprint.is_active,
                'created_by': 'Product Owner',
                'workspace_id': workspace_id,
            },
            'total_tasks': len(tasks_data),
            'tasks': tasks_data,
            'message': f'Successfully fetched {len(tasks_data)} tasks from sprint assignment table'
        }, status=200)
    
    except Exception as e:
        return JsonResponse({
            'success': True,
            'error': f'Error fetching sprint assignment data: {str(e)}',
            'error_type': type(e).__name__
        }, status=500)


# ==================== HELPER: Get Available Sprints with Tasks ====================

@csrf_exempt
@require_http_methods(["GET"])
def get_available_sprints_with_tasks(request):
    """
    GET /api/module2/sprints/available/?limit=10
    
    Get all available sprints in workspace with their tasks, user stories, and project info.
    Used by frontend to display sprint selector and preview tasks.
    """
    try:
        workspace_id = request.headers.get('Workspace-ID')
        project_id = request.GET.get('project_id')
        limit = int(request.GET.get('limit', 10))
        
        if not workspace_id:
            return JsonResponse({
                'success': False,
                'error': 'Missing Workspace-ID header'
            }, status=400)
        
        # Verify workspace exists
        try:
            workspace = AdminWorkspace.objects.get(id=workspace_id)
        except AdminWorkspace.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Workspace {workspace_id} not found'
            }, status=404)
        
        # Get sprints for this workspace only
        sprints_query = Sprint.objects.filter(
            workspace=workspace,
            is_active=True
        ).order_by('-start_date')
        
        # Filter by project if specified
        if project_id:
            sprints_query = sprints_query.filter(project_id=project_id)
        
        sprints_query = sprints_query[:limit]
        
        sprints_data = []
        for sprint in sprints_query:
            try:
                # Get tasks in sprint
                sprint_items = SprintItem.objects.filter(
                    sprint=sprint
                ).select_related('task', 'task__user_story')
                
                tasks_data = []
                required_skills_set = set()
                user_stories_set = set()
                
                for sprint_item in sprint_items:
                    task = sprint_item.task
                    
                    # Extract skills from task
                    task_skills = []
                    if hasattr(task, 'skills_required') and task.skills_required:
                        if isinstance(task.skills_required, str):
                            task_skills = [s.strip() for s in task.skills_required.split(',') if s.strip()]
                        elif isinstance(task.skills_required, list):
                            task_skills = task.skills_required
                        required_skills_set.update(task_skills)
                    
                    # Get user story
                    user_story = ''
                    if hasattr(task, 'user_story') and task.user_story:
                        user_story = task.user_story.goal[:50] if hasattr(task.user_story, 'goal') else str(task.user_story.id)
                        user_stories_set.add(user_story)
                    
                    tasks_data.append({
                        'task_id': task.task_id if hasattr(task, 'task_id') else task.id,
                        'task_title': task.tasks if hasattr(task, 'tasks') else 'Untitled',
                        'description': task.tasks[:100] if hasattr(task, 'tasks') else '',
                        'required_skills': task_skills,
                        'estimated_hours': task.estimated_hours if hasattr(task, 'estimated_hours') else 0,
                        'priority': 'MEDIUM',
                        'user_story': user_story,
                        'status': 'TO_DO',
                    })
                
                sprint_obj = {
                    'sprint_id': sprint.id,
                    'sprint_name': sprint.name,
                    'goal': sprint.goal,
                    'start_date': sprint.start_date.isoformat(),
                    'end_date': sprint.end_date.isoformat(),
                    'is_active': sprint.is_active,
                    'project_id': sprint.project_id,
                    'total_tasks': len(tasks_data),
                    'required_skills': list(required_skills_set),
                    'user_stories': list(user_stories_set),
                    'tasks': tasks_data,
                }
                sprints_data.append(sprint_obj)
            except Exception as sprint_error:
                # Log error but continue with other sprints
                print(f"Error processing sprint {sprint.id}: {str(sprint_error)}")
                continue
        return JsonResponse({
            'success': True,
            'total_sprints': len(sprints_data),
            'sprints': sprints_data,
            'from_sprint_table': len(sprints_data),
            'from_sprint_assignments': 0,
            'message': f'Successfully fetched {len(sprints_data)} sprints' if sprints_data else 'No sprints found for this workspace'
        }, status=200)
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_available_sprints_with_tasks: {str(e)}")
        print(error_trace)
        return JsonResponse({
            'success': False,
            'error': f'Error fetching sprints: {str(e)}',
            'error_type': type(e).__name__,
            'error_details': error_trace if hasattr(e, '__traceback__') else str(e)
        }, status=500)


# ==================== HELPER: Get Projects by Workspace ====================

@csrf_exempt
@require_http_methods(["GET"])
def get_projects_by_workspace(request):
    """
    GET /api/module2/projects/by-workspace/
    
    Get all projects associated with the workspace.
    Projects are fetched from userstorymanager.models.Project
    """
    try:
        workspace_id = request.headers.get('Workspace-ID')
        
        if not workspace_id:
            return JsonResponse({
                'success': False,
                'error': 'Missing Workspace-ID header'
            }, status=400)
        
        # Verify workspace exists
        try:
            workspace = AdminWorkspace.objects.get(id=workspace_id)
        except AdminWorkspace.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Workspace {workspace_id} not found'
            }, status=404)
        
        # Import Project model
        from userstorymanager.models import Project
        
        # Get projects for this workspace
        projects = Project.objects.filter(workspace_id=workspace_id)
        
        projects_data = []
        for project in projects:
            # Count sprints from Sprint table
            sprint_count_from_table = Sprint.objects.filter(
                workspace=workspace,
                project_id=project.id
            ).count()
            
            # Count sprints from SprintAssignment table
            sprint_count_from_assignments = SprintAssignment.objects.filter(
                project_id=project.id
            ).values('sprint_number').distinct().count()
            
            # Total sprint count
            total_sprint_count = sprint_count_from_table + sprint_count_from_assignments
            
            projects_data.append({
                'project_id': project.id,
                'project_name': project.name,
                'description': project.description if hasattr(project, 'description') else '',
                'sprint_count': total_sprint_count,
                'owner': project.owner.name if hasattr(project, 'owner') and project.owner else 'Unknown',
                'start_date': project.start_date.isoformat() if hasattr(project, 'start_date') and project.start_date else None,
            })
        
        return JsonResponse({
            'success': True,
            'total_projects': len(projects_data),
            'projects': projects_data,
        }, status=200)
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_projects_by_workspace: {str(e)}")
        print(error_trace)
        return JsonResponse({
            'success': False,
            'error': f'Error fetching projects: {str(e)}',
            'error_type': type(e).__name__
        }, status=500)

# ==================== DEBUG: Check All Sprints ====================

@csrf_exempt
@require_http_methods(["GET"])
def debug_sprints_in_workspace(request):
    """
    GET /api/module2/debug/sprints/
    
    [DEBUG ONLY] Get all sprints in workspace with debug info.
    Shows all sprints for debugging purposes.
    """
    try:
        workspace_id = request.headers.get('Workspace-ID')
        
        if not workspace_id:
            return JsonResponse({
                'success': False,
                'error': 'Missing Workspace-ID header'
            }, status=400)
        
        # Verify workspace exists
        try:
            workspace = AdminWorkspace.objects.get(id=workspace_id)
        except AdminWorkspace.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Workspace {workspace_id} not found'
            }, status=404)
        
        # Get ALL sprints for this workspace (including inactive)
        all_sprints = Sprint.objects.filter(workspace=workspace).order_by('-start_date')
        
        sprints_debug = []
        for sprint in all_sprints:
            # Count tasks
            task_count = SprintItem.objects.filter(sprint=sprint).count()
            
            sprints_debug.append({
                'sprint_id': sprint.id,
                'sprint_name': sprint.name,
                'is_active': sprint.is_active,
                'project_id': sprint.project_id,
                'task_count': task_count,
                'start_date': sprint.start_date.isoformat(),
                'end_date': sprint.end_date.isoformat(),
                'created_for_workspace': workspace.workspaceName,
            })
        
        return JsonResponse({
            'success': True,
            'workspace_id': workspace_id,
            'workspace_name': workspace.workspaceName,
            'total_sprints': len(sprints_debug),
            'active_sprints': len([s for s in sprints_debug if s['is_active']]),
            'sprints': sprints_debug,
        }, status=200)
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in debug_sprints_in_workspace: {str(e)}")
        print(error_trace)
        return JsonResponse({
            'success': False,
            'error': f'Error: {str(e)}',
            'error_type': type(e).__name__
        }, status=500)