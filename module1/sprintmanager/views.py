from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json
from .models import Sprint, SprintItem
from userstorymanager.models import Backlog, UserStory
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
    # Exclude tasks already in active sprint items
    active_sprint_task_ids = SprintItem.objects.filter(
        sprint__is_active=True
    ).values_list('task__task_id', flat=True)
    tasks = Backlog.objects.filter(
        project_id=project_id
    ).exclude(task_id__in=active_sprint_task_ids).select_related('user_story')
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
            'priority_score': priority_score,
            'estimated_hours': float(task.estimated_hours or 0),
            'skills_required': task.skills_required or '',
            'task_progress_status': task_progress_status,
            'dependency_status': 'unknown',
            'task_model': task
        })
    return result

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

    # Objective uses numerical priority_score; if missing, fallback to priority field.
    prob += pulp.lpSum((task.get('priority_score') or task.get('priority') or 0) * x[task['task_id']] for task in tasks if task.get('task_id') in x)

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
    sorted_tasks = sorted(tasks, key=lambda t: t['priority'] or 0, reverse=True)
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


@method_decorator(csrf_exempt, name='dispatch')
class CreateSprintView(View):
    def post(self, request):
        data = json.loads(request.body)
        workspace_id = data.get('workspace_id')
        project_id = data.get('project_id')
        name = data.get('name')
        goal = data.get('goal')
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        # Step 0: Identify all project backlog tasks (including active sprint ones)
        all_backlog_raw = Backlog.objects.filter(project_id=project_id).select_related('user_story')
        all_backlog_task_ids = set(all_backlog_raw.values_list('task_id', flat=True))
        active_task_ids = set(SprintItem.objects.filter(sprint__is_active=True).values_list('task__task_id', flat=True))

        # Step 1: Get backlog tasks available for planning (excluding active sprint items)
        tasks = [t for t in get_backlog_tasks(project_id) if t.get('task_progress_status') != 'completed']

        # Save tasks blocked by active sprint for later reporting
        active_blocked_tasks = [
            {
                'task_id': task.task_id,
                'task_name': getattr(task, 'task_name', task.tasks or ''),
                'task_progress_status': getattr(task, 'task_progress_status', 'pending'),
                'reason': 'already in an active sprint'
            }
            for task in all_backlog_raw
            if task.task_id in active_task_ids
        ]

        # Step 2: Derive priorities and normalize
        for t in tasks:
            if 'priority_score' not in t or t['priority_score'] is None:
                t['priority_score'] = int(t.get('priority') or 0)

        # Step 3: Team capacity
        total_capacity = get_team_capacity(workspace_id)
        sprint_capacity = min(max(total_capacity, 0), 80)

        # Step 4: Skill feasibility in team
        feasible_tasks, infeasible_tasks, available_skills = check_task_skill_feasibility(tasks, workspace_id)

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

        # Step 7: Ensure non-empty selection if any feasible task exists
        if not selected_task_ids and candidates:
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

        # Include tasks omitted due to existing active sprint items in exclusion reporting
        for skip in active_blocked_tasks:
            # Avoid duplicate if t already in excluded_tasks
            if not any(e['task_id'] == skip['task_id'] for e in excluded_tasks):
                excluded_tasks.append(skip)


        carry_forward_tasks = [
            {
                'task_id': t['task_id'],
                'task_name': t.get('task_name', ''),
                'reason_for_carry_forward': 'not selected this sprint'
            }
            for t in tasks if t['task_id'] not in selected_set and t['task_progress_status'] != 'completed'
        ]

        total_selected_hours = sum(t['estimated_hours'] for t in selected_tasks)

        sprint = Sprint.objects.create(
            workspace_id=workspace_id,
            name=name,
            goal=goal,
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
        if SprintItem.objects.filter(task_id=task_id, sprint__is_active=True).exists():
            return JsonResponse({'error': 'Task already in an active sprint'}, status=400)
        
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