from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.db import connection
import json
from .models import Sprint, SprintItem
from userstorymanager.models import Backlog, UserStory, SprintAssignment
from assignment_module.models import TeamMember
from taskdependency.models import TaskDependency
try:
    import pulp
    PULP_AVAILABLE = True
except ImportError:
    PULP_AVAILABLE = False

# Create your views here.

def load_dependencies(project_id):
    if TaskDependency is None:
        #show logs
        print("TaskDependency model is not available.")
        return []
    dependencies = TaskDependency.objects.filter(project_id=project_id)
    backlog_task_ids = set(Backlog.objects.filter(project_id=project_id).values_list('task_id', flat=True))
    result = []
    for dep in dependencies:
        if dep.predecessor_task_id in backlog_task_ids and dep.successor_task_id in backlog_task_ids:
            if dep.predecessor_task_id != dep.successor_task_id:  # no self-loops
                result.append({
                    'task_id': dep.successor_task_id,
                    'predecessor_task_id': dep.predecessor_task_id
                })
    return result

def get_backlog_tasks(project_id):
    # Exclude tasks already added to any sprint items
    sprint_task_ids = SprintItem.objects.values_list('task__task_id', flat=True)
    tasks = Backlog.objects.filter(
        project_id=project_id
    ).exclude(task_id__in=sprint_task_ids).select_related('user_story')
    result = []
    priority_map = {'high': 3, 'medium': 2, 'low': 1}

    for task in tasks:
        priority_str = None
        if hasattr(task, 'priority_score') and task.priority_score is not None:
            priority_score = float(task.priority_score)
        elif hasattr(task, 'priority') and task.priority is not None:
            priority_str = task.priority
            try:
                priority_score = float(task.priority)
            except (ValueError, TypeError):
                priority_score = priority_map.get(str(task.priority).lower(), 0)
        else:
            # In case user_story priority is where the score exists
            priority_str = task.user_story.priority if task.user_story else None
            priority_score = priority_map.get(str(priority_str).lower(), 0) if priority_str else 0

        if hasattr(task, 'priority_score') and task.priority_score is not None:
            priority_score = float(task.priority_score)

        task_progress_status = 'pending'
        if hasattr(task, 'task_progress_status') and task.task_progress_status:
            task_progress_status = task.task_progress_status.lower()
        elif hasattr(task, 'status') and task.status:
            task_progress_status = task.status.lower()

        result.append({
            'task_id': task.task_id,
            'task_name': getattr(task, 'task_name', task.tasks or ''),
            'project_id': task.project_id,
            'user_story_id': task.user_story.id if task.user_story else None,
            'priority': task.user_story.priority if task.user_story else None,
            'story_points': task.user_story.story_points if task.user_story and task.user_story.story_points is not None else 0,
            'priority_score': priority_score,
            'estimated_hours': float(task.estimated_hours or 0),
            'skills_required': task.skills_required or '',
            'task_progress_status': task_progress_status,
            'dependency_status': 'unknown',
            'task_model': task
        })
    return result


def get_sprint_assignment_map(project_id, sprint_number=None):
    assignments = SprintAssignment.objects.filter(project_id=project_id).select_related('user_story')
    if sprint_number is not None:
        assignments = assignments.filter(sprint_number=sprint_number)

    priority_map = {'high': 3, 'medium': 2, 'low': 1}
    assignment_map = {}
    for assignment in assignments:
        assignment_map[assignment.user_story_id] = {
            'sprint_number': assignment.sprint_number,
            'priority': assignment.priority,
            'priority_score': priority_map.get(str(assignment.priority).lower(), 0),
            'story_points': assignment.story_points if assignment.story_points is not None else (
                assignment.user_story.story_points if assignment.user_story and assignment.user_story.story_points is not None else 0
            ),
        }

    return assignment_map

def get_team_capacity(workspace_id):
    members = TeamMember.objects.filter(workspace_id=workspace_id, status='available')
    total_capacity = sum(member.capacityHours - member.assignedHours for member in members)
    return total_capacity

def run_ilp_optimizer(tasks, dependencies, capacity):
    if not PULP_AVAILABLE:
        print("PuLP is not available. Using greedy fallback.")
        return run_greedy_fallback(tasks, dependencies, capacity)

    if capacity <= 0:
        print(f"No team capacity ({capacity}). Returning empty selection.")
        return []

    if not tasks:
        print("No tasks in backlog. Returning empty selection.")
        return []

    print("Running ILP optimizer")
    prob = pulp.LpProblem("SprintOptimizer", pulp.LpMaximize)

    x = {}
    for task in tasks:
        task_id = task.get('task_id')
        if task_id is None:
            continue
        x[task_id] = pulp.LpVariable(f"x_{task_id}", cat='Binary')

    # Objective prefers higher PO/user-story priority and lower story-point effort.
    prob += pulp.lpSum(
        (
            (float(task.get('priority_score') or 0) * 1000)
            - float(task.get('story_points') or 0)
        ) * x[task['task_id']]
        for task in tasks if task.get('task_id') in x
    )

    # Hours constraint; use 0 for missing values to avoid None problems.
    prob += pulp.lpSum((task.get('estimated_hours') or 0) * x[task['task_id']] for task in tasks if task.get('task_id') in x) <= capacity

    for dep in dependencies:
        j = dep.get('task_id')
        i = dep.get('predecessor_task_id')
        if j in x and i in x:
            prob += x[j] <= x[i]

    # solve using reliable builtin solver
    status = prob.solve(pulp.PULP_CBC_CMD(msg=False))

    # if solver fails, fallback
    solver_status = pulp.LpStatus.get(status, 'Unknown')
    if solver_status != 'Optimal':
        print(f"ILP solver status: {solver_status}. Using greedy fallback.")
        return run_greedy_fallback(tasks, dependencies, capacity)

    selected = [task_id for task_id, var in x.items() if var.value() == 1]
    print(f"ILP selected tasks: {selected}")
    return selected

def normalize_skills(skills_raw):
    if skills_raw is None:
        return set()

    # Handle list-like fields directly
    if isinstance(skills_raw, (list, tuple, set)):
        skills_items = []
        for item in skills_raw:
            if isinstance(item, str):
                skills_items.append(item.strip())
            else:
                skills_items.append(str(item).strip())
        return set(item.lower() for item in skills_items if item)

    # Try parsing JSON string values (e.g. '[]' or '["Python","Django"]')
    if isinstance(skills_raw, str):
        cleaned = skills_raw.strip()
        if not cleaned:
            return set()

        # If it looks like a JSON array, parse it
        if (cleaned.startswith('[') and cleaned.endswith(']')) or (cleaned.startswith('"') and cleaned.endswith('"')):
            try:
                parsed = json.loads(cleaned)
                if isinstance(parsed, (list, tuple, set)):
                    return normalize_skills(parsed)
                if isinstance(parsed, str):
                    cleaned = parsed
                else:
                    # fallback to text splitting
                    pass
            except (ValueError, TypeError):
                pass

        # strip surrounding brackets/quotes
        if (cleaned.startswith('[') and cleaned.endswith(']')) or (cleaned.startswith('(') and cleaned.endswith(')')):
            cleaned = cleaned[1:-1].strip()
        if (cleaned.startswith('"') and cleaned.endswith('"')) or (cleaned.startswith("'") and cleaned.endswith("'")):
            cleaned = cleaned[1:-1].strip()

        # split by common delimiters
        delimiters = [',', ';', '|', '/', '\\']
        for d in delimiters:
            if d in cleaned:
                parts = [p.strip() for p in cleaned.split(d) if p.strip()]
                return set(p.lower() for p in parts if p)

        return set([cleaned.lower()])

    # fallback
    return set([str(skills_raw).strip().lower()])


def check_task_skill_feasibility(tasks, workspace_id):
    team_members = TeamMember.objects.filter(workspace_id=workspace_id, status='available')
    available_skills = set()
    for member in team_members:
        available_skills |= normalize_skills(member.skills)

    feasible = []
    infeasible = []
    for task in tasks:
        task_skills = normalize_skills(task.get('skills_required'))
        missing = task_skills - available_skills
        if missing:
            infeasible.append({
                'task_id': task['task_id'],
                'reason': f"Missing required skills: {', '.join(sorted(missing))}" if task_skills else 'No required skills',
                'missing_skills': sorted(missing)
            })
        else:
            feasible.append(task)

    return feasible, infeasible, sorted(list(available_skills))


def run_greedy_fallback(tasks, dependencies, capacity):
    # Sort tasks by priority descending
    sorted_tasks = sorted(
        tasks,
        key=lambda t: (
            -(float(t.get('priority_score') or 0)),
            float(t.get('story_points') or 0),
            float(t.get('estimated_hours') or 0),
        )
    )
    selected = []
    total_hours = 0
    dep_map = {dep['task_id']: dep['predecessor_task_id'] for dep in dependencies}

    for task in sorted_tasks:
        task_id = task['task_id']
        hours = task['estimated_hours'] or 0
        if total_hours + hours <= capacity:
            # Check if prerequisites are included
            prereq = dep_map.get(task_id)
            if prereq is None or prereq in [s['task_id'] for s in selected]:
                selected.append(task)
                total_hours += hours
    return [t['task_id'] for t in selected]


def enforce_skill_limit(selected_task_ids, task_pool, max_skills=10):
    """Keep selected tasks within a maximum number of unique skills."""
    if not selected_task_ids:
        return []

    tasks_by_id = {t['task_id']: t for t in task_pool}
    selected_tasks = [tasks_by_id[tid] for tid in selected_task_ids if tid in tasks_by_id]

    # Prefer keeping higher-priority, lower-effort tasks.
    selected_tasks = sorted(
        selected_tasks,
        key=lambda t: (
            -(float(t.get('priority_score') or 0)),
            float(t.get('story_points') or 0),
            float(t.get('estimated_hours') or 0),
        )
    )

    kept = []
    used_skills = set()
    for task in selected_tasks:
        task_skills = normalize_skills(task.get('skills_required'))
        if len(used_skills | task_skills) <= max_skills:
            kept.append(task['task_id'])
            used_skills |= task_skills

    return kept


@method_decorator(csrf_exempt, name='dispatch')
class CreateSprintView(View):
    def post(self, request):
        data = json.loads(request.body)
        workspace_id = data.get('workspace_id')
        project_id = data.get('project_id')
        sprint_number = data.get('sprint_number')
        name = data.get('name')
        goal = data.get('goal')
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if sprint_number is None:
            sprint_number = Sprint.objects.filter(project_id=project_id).count() + 1
        else:
            try:
                sprint_number = int(sprint_number)
            except (TypeError, ValueError):
                return JsonResponse({'message': 'sprint_number must be an integer'}, status=400)

        # Step 0: Identify all project backlog tasks (including active sprint ones)
        all_backlog_raw = Backlog.objects.filter(project_id=project_id).select_related('user_story')
        all_backlog_task_ids = set(all_backlog_raw.values_list('task_id', flat=True))
        if not all_backlog_task_ids:
            return JsonResponse(
                {'message': 'Sprint Cant be Created Due to No Tasks in the backlog '},
                status=400
            )
        active_task_ids = set(SprintItem.objects.values_list('task__task_id', flat=True))

        assignment_map = get_sprint_assignment_map(project_id, sprint_number)
        assigned_story_ids = set(assignment_map.keys())

        # Step 1: Get backlog tasks available for planning (excluding active sprint items)
        all_tasks = [t for t in get_backlog_tasks(project_id) if t.get('task_progress_status') != 'completed']
        if assigned_story_ids:
            tasks = [t for t in all_tasks if t.get('user_story_id') in assigned_story_ids]
        else:
            tasks = all_tasks

        if not tasks and assigned_story_ids:
            return JsonResponse(
                {
                    'message': 'Sprint is not feasible because assigned user stories cannot be scheduled in this sprint',
                    'sprint_number': sprint_number,
                    'selected_tasks': [],
                    'excluded_tasks': [
                        {
                            'user_story_id': story_id,
                            'reason': 'not feasible or blocked for the assigned sprint order'
                        }
                        for story_id in sorted(assigned_story_ids)
                    ]
                },
                status=400
            )

        # Save tasks blocked by existing sprint items for later reporting
        active_blocked_tasks = [
            {
                'task_id': task.task_id,
                'task_name': getattr(task, 'task_name', task.tasks or ''),
                'task_progress_status': getattr(task, 'task_progress_status', 'pending'),
                'reason': 'already in another sprint'
            }
            for task in all_backlog_raw
            if task.task_id in active_task_ids
        ]

        if assigned_story_ids:
            active_blocked_tasks.extend([
                {
                    'task_id': task['task_id'],
                    'task_name': task.get('task_name', ''),
                    'task_progress_status': task.get('task_progress_status', 'pending'),
                    'reason': f'not assigned to sprint {sprint_number}'
                }
                for task in all_tasks
                if task.get('user_story_id') not in assigned_story_ids
            ])

        # Step 2: Derive priorities and normalize
        for t in tasks:
            assignment = assignment_map.get(t.get('user_story_id'))
            if assignment:
                t['priority'] = assignment['priority']
                t['priority_score'] = assignment['priority_score']
                t['story_points'] = assignment['story_points']
            elif 'priority_score' not in t or t['priority_score'] is None:
                t['priority_score'] = int(t.get('priority') or 0)

            if t.get('story_points') in [None, '']:
                t['story_points'] = t['task_model'].user_story.story_points if t.get('task_model') and t['task_model'].user_story and t['task_model'].user_story.story_points is not None else 0

        # Step 3: Team capacity
        total_capacity = get_team_capacity(workspace_id)
        sprint_capacity = min(max(total_capacity, 0), 80)

        # Step 4: No skill-matching filter during sprint creation
        feasible_tasks = tasks
        infeasible_tasks = []
        available_skills = []

        # Step 5: Dependency status for tasks
        completed_ids = set(t['task_id'] for t in get_backlog_tasks(project_id) if t.get('task_progress_status') == 'completed')
        dep_map = {dep['task_id']: dep['predecessor_task_id'] for dep in load_dependencies(project_id)}

        def is_dependency_feasible(task):
            pre_id = dep_map.get(task['task_id'])
            if not pre_id:
                return True
            return pre_id in completed_ids or pre_id in [t['task_id'] for t in feasible_tasks]

        candidates = [t for t in feasible_tasks if is_dependency_feasible(t)]
        blocked_tasks = [t for t in feasible_tasks if not is_dependency_feasible(t)]

        # Step 6: Select via ILP + fallback heuristic
        selected_task_ids = run_ilp_optimizer(candidates, load_dependencies(project_id), sprint_capacity)
        if not selected_task_ids and candidates:
            selected_task_ids = run_greedy_fallback(candidates, load_dependencies(project_id), sprint_capacity)

        # Step 6.1: Enforce max unique skill budget per sprint
        selected_task_ids = enforce_skill_limit(selected_task_ids, candidates, max_skills=10)

        # Step 7: Ensure non-empty selection if any feasible task exists
        if not selected_task_ids and candidates and not assigned_story_ids:
            best = sorted(candidates, key=lambda t: (-t['priority_score'], t['estimated_hours']))[0]
            selected_task_ids = [best['task_id']]

        selected_set = set(selected_task_ids)

        selected_tasks = []
        excluded_tasks = []

        for t in tasks:
            entry = {
                'task_id': t['task_id'],
                'task_name': t.get('task_name', ''),
                'priority': t.get('priority'),
                'priority_score': t.get('priority_score'),
                'story_points': t.get('story_points', 0),
                'estimated_hours': t.get('estimated_hours', 0),
                'skills_required': list(normalize_skills(t.get('skills_required'))),
                'task_progress_status': t.get('task_progress_status', 'pending')
            }

            # compute dependency status for each
            dependency_pre = dep_map.get(t['task_id'])
            if dependency_pre:
                if dependency_pre in completed_ids or dependency_pre in selected_set:
                    entry['dependency_status'] = 'satisfied'
                else:
                    entry['dependency_status'] = 'blocked'
            else:
                entry['dependency_status'] = 'none'

            if t['task_id'] in selected_set:
                entry['selection_reason'] = 'selected by optimizer heuristic'
                selected_tasks.append(entry)
            else:
                reason = 'not selected'
                if t['task_id'] in [x['task_id'] for x in infeasible_tasks]:
                    reason = next(x['reason'] for x in infeasible_tasks if x['task_id'] == t['task_id'])
                elif t['task_id'] in [x['task_id'] for x in blocked_tasks]:
                    reason = 'blocked dependencies'
                elif t['task_progress_status'] == 'blocked':
                    reason = 'blocked status'
                excluded_tasks.append({
                    'task_id': t['task_id'],
                    'task_name': t.get('task_name', ''),
                    'task_progress_status': t.get('task_progress_status', 'pending'),
                    'reason': reason
                })

        # Include tasks omitted due to existing sprint items in exclusion reporting
        for skip in active_blocked_tasks:
            # Avoid duplicate if t already in excluded_tasks
            if not any(e['task_id'] == skip['task_id'] for e in excluded_tasks):
                excluded_tasks.append(skip)

        if assigned_story_ids and not selected_task_ids:
            return JsonResponse(
                {
                    'message': 'Sprint is not feasible because none of the assigned user stories can be scheduled',
                    'sprint_number': sprint_number,
                    'selected_tasks': [],
                    'excluded_tasks': excluded_tasks,
                },
                status=400
            )


        carry_forward_tasks = [
            {
                'task_id': t['task_id'],
                'task_name': t.get('task_name', ''),
                'story_points': t.get('story_points', 0),
                'reason_for_carry_forward': 'not selected this sprint'
            }
            for t in tasks if t['task_id'] not in selected_set and t['task_progress_status'] != 'completed'
        ]

        total_selected_hours = sum(t['estimated_hours'] for t in selected_tasks)

        sprint = Sprint.objects.create(
            workspace_id=workspace_id,
            name=name,
            goal=goal,
            project_id=project_id,
            start_date=start_date,
            end_date=end_date,
            is_active=True
        )

        sprint_items = [SprintItem(sprint=sprint, task_id=tid) for tid in selected_task_ids]
        SprintItem.objects.bulk_create(sprint_items)

        dependency_notes = [
            {
                'task_id': t['task_id'],
                'depends_on': dep_map.get(t['task_id']),
                'status': 'satisfied' if dep_map.get(t['task_id']) in completed_ids or dep_map.get(t['task_id']) in selected_set else 'not satisfied'
            }
            for t in selected_tasks if dep_map.get(t['task_id'])
        ]

        return JsonResponse({
            'sprint_name': name,
            'sprint_number': sprint_number,
            'sprint_duration': '2 weeks',
            'total_team_capacity_hours': total_capacity,
            'total_selected_hours': total_selected_hours,
            'remaining_capacity_hours': total_capacity - total_selected_hours,
            'selected_tasks': selected_tasks,
            'excluded_tasks': excluded_tasks,
            'carry_forward_tasks': carry_forward_tasks,
            'dependency_notes': dependency_notes,
            'skill_feasibility_notes': [
                {'available_skills': available_skills},
                {'infeasible_tasks': infeasible_tasks}
            ],
            'sprint_success_rule': {
                'successful_if': 'all selected tasks are completed',
                'otherwise': 'unfinished selected tasks move to future sprint planning and ILP is run again with updated task progress'
            },
            'status': 'optimized' if selected_tasks else 'no feasible tasks',
            'feasible': bool(selected_tasks)
        })

class SprintBacklogView(View):
    def get(self, request, sprint_id):
        sprint = get_object_or_404(Sprint, id=sprint_id)
        sprint_items = SprintItem.objects.filter(sprint=sprint).select_related('task__user_story')
        items_data = []
        for item in sprint_items:
            task = item.task
            priority = task.user_story.priority if task.user_story else None
            items_data.append({
                'task_id': task.task_id,
                'tasks': task.tasks,
                'status': getattr(task, 'status', 'pending'),
                'estimated_hours': task.estimated_hours,
                'skills_required': task.skills_required,
                'priority': priority,
                'added_at': item.added_at
            })
        return JsonResponse({
            'sprint': {
                'id': sprint.id,
                'name': sprint.name,
                'goal': sprint.goal,
                'start_date': sprint.start_date,
                'end_date': sprint.end_date,
                'is_active': sprint.is_active
            },
            'items': items_data
        })

@method_decorator(csrf_exempt, name='dispatch')
class AddTaskView(View):
    def post(self, request, sprint_id):
        data = json.loads(request.body)
        task_id = data.get('task_id')
        sprint = get_object_or_404(Sprint, id=sprint_id)
        
        # Validate task not in active sprint
        if SprintItem.objects.filter(task_id=task_id).exists():
            return JsonResponse({'error': 'Task already exists in another sprint'}, status=400)
        
        # Add SprintItem
        SprintItem.objects.create(sprint=sprint, task_id=task_id)
        return JsonResponse({'message': 'Task added to sprint'})

@method_decorator(csrf_exempt, name='dispatch')
class RemoveTaskView(View):
    def delete(self, request, sprint_id, task_id):
        sprint = get_object_or_404(Sprint, id=sprint_id)
        sprint_item = get_object_or_404(SprintItem, sprint=sprint, task_id=task_id)
        sprint_item.delete()
        return JsonResponse({'message': 'Task removed from sprint'})

@method_decorator(csrf_exempt, name='dispatch')
class ReoptimizeSprintView(View):
    def post(self, request, sprint_id):
        data = json.loads(request.body)
        project_id = data.get('project_id')
        sprint = get_object_or_404(Sprint, id=sprint_id)
        workspace_id = sprint.workspace_id
        
        tasks = get_backlog_tasks(project_id)
        dependencies = load_dependencies(project_id)
        capacity = get_team_capacity(workspace_id)
        selected_task_ids = run_ilp_optimizer(tasks, dependencies, capacity)
        
        # Remove existing items
        SprintItem.objects.filter(sprint=sprint).delete()
        
        # Add new items
        sprint_items = [
            SprintItem(sprint=sprint, task_id=task_id)
            for task_id in selected_task_ids
        ]
        SprintItem.objects.bulk_create(sprint_items)
        
        return JsonResponse({'message': 'Sprint reoptimized'})

class ListSprintsView(View):
    def get(self, request):
        workspace_id = request.GET.get('workspace_id')
        if not workspace_id:
            return JsonResponse({'error': 'workspace_id query parameter is required'}, status=400)
        
        sprints = Sprint.objects.filter(workspace_id=workspace_id).order_by('-start_date')
        sprint_list = [
            {
                'id': s.id,
                'name': s.name,
                'goal': s.goal,
                'start_date': s.start_date,
                'end_date': s.end_date,
                'is_active': s.is_active
            }
            for s in sprints
        ]
        return JsonResponse({'sprints': sprint_list})
    
@method_decorator(csrf_exempt, name='dispatch')
class ListSprintsByProjectView(View):
    def get(self, request, project_id):
        sprints = Sprint.objects.filter(project_id=project_id).order_by('-start_date')
        sprint_list = [
            {
                'id': s.id,
                'name': s.name,
                'goal': s.goal,
                'start_date': s.start_date,
                'end_date': s.end_date,
                'is_active': s.is_active
            }
            for s in sprints
        ]
        return JsonResponse({'sprints': sprint_list})


@method_decorator(csrf_exempt, name='dispatch')
class DeactivateSprintView(View):
    def patch(self, request, sprint_id):
        sprint = get_object_or_404(Sprint, id=sprint_id)
        if not sprint.is_active:
            return JsonResponse({'message': 'Sprint is already inactive', 'is_active': False})

        sprint.is_active = False
        sprint.save(update_fields=['is_active'])
        return JsonResponse({'message': 'Sprint status updated successfully', 'is_active': sprint.is_active})

    # Keep POST support for clients that cannot send PATCH.
    def post(self, request, sprint_id):
        return self.patch(request, sprint_id)


@method_decorator(csrf_exempt, name='dispatch')
class EditSprintView(View):
    def put(self, request, sprint_id):
        sprint = get_object_or_404(Sprint, id=sprint_id)
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        if 'name' in data:
            sprint.name = data.get('name')

        # Sprint model stores description-like text in `goal`.
        if 'description' in data:
            sprint.goal = data.get('description')

        sprint.save(update_fields=['name', 'goal'])
        return JsonResponse({
            'message': 'Sprint updated successfully',
            'sprint': {
                'id': sprint.id,
                'name': sprint.name,
                'description': sprint.goal,
            }
        }, status=200)

    def patch(self, request, sprint_id):
        return self.put(request, sprint_id)


@method_decorator(csrf_exempt, name='dispatch')
class DeleteSprintView(View):
    def delete(self, request, sprint_id):
        sprint = get_object_or_404(Sprint, id=sprint_id)

        # Cleanup dependent suggestions from legacy helper app tables if present.
        # This prevents FK violations when those tables still reference Sprint.
        candidate_tables = [
            'taskalloactionhelper_tasksuggestion',
            'taskallocationhelper_tasksuggestion',
        ]
        developer_workload_tables = [
            'taskalloactionhelper_developerworkload',
            'taskallocationhelper_developerworkload',
        ]
        ticket_status_history_tables = [
            'taskalloactionhelper_ticketstatushistory',
            'taskallocationhelper_ticketstatushistory',
        ]
        with connection.cursor() as cursor:
            for table_name in developer_workload_tables:
                cursor.execute("SELECT to_regclass(%s)", [table_name])
                exists = cursor.fetchone()[0]
                if exists:
                    cursor.execute(f'DELETE FROM "{table_name}" WHERE sprint_fk_id = %s', [sprint.id])

            for table_name in ticket_status_history_tables:
                cursor.execute("SELECT to_regclass(%s)", [table_name])
                exists = cursor.fetchone()[0]
                if exists:
                    cursor.execute(f'DELETE FROM "{table_name}" WHERE sprint_fk_id = %s', [sprint.id])

            for table_name in candidate_tables:
                cursor.execute("SELECT to_regclass(%s)", [table_name])
                exists = cursor.fetchone()[0]
                if exists:
                    # Delete approval workflow rows that reference task suggestions first.
                    if table_name == 'taskalloactionhelper_tasksuggestion':
                        workflow_table = 'taskalloactionhelper_assignmentapprovalworkflow'
                    else:
                        workflow_table = 'taskallocationhelper_assignmentapprovalworkflow'

                    cursor.execute("SELECT to_regclass(%s)", [workflow_table])
                    workflow_exists = cursor.fetchone()[0]
                    if workflow_exists:
                        cursor.execute(
                            f'''DELETE FROM "{workflow_table}"
                                WHERE task_suggestion_fk_id IN (
                                    SELECT id FROM "{table_name}" WHERE sprint_fk_id = %s
                                )''',
                            [sprint.id]
                        )

                    cursor.execute(f'DELETE FROM "{table_name}" WHERE sprint_fk_id = %s', [sprint.id])

        sprint.delete()
        return JsonResponse({'message': 'Sprint deleted successfully'}, status=200)