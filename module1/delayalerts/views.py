import json
from datetime import date

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from assignment_module.models import AdminWorkspace
from sprintmanager.models import Sprint
from taskdependency.models import TaskDependency
from userstorymanager.models import Backlog, Project

from .models import DelayAlert, TaskProgress
from .services.engine import run_delay_engine


def _status_is_done(status_value):
    normalized = str(status_value or "").strip().lower()
    return normalized in {"completed", "done"}


def _normalize_status_input(status_value):
    normalized = str(status_value or "").strip().upper()
    if normalized == "ACTIVE":
        return TaskProgress.STATUS_IN_PROGRESS
    return normalized


def _status_for_api(status_value):
    normalized = str(status_value or "").strip().upper()
    if normalized == TaskProgress.STATUS_IN_PROGRESS:
        return "ACTIVE"
    return normalized


def _build_reverse_dependency_map(dependencies):
    reverse_map = {}
    for dep in dependencies:
        reverse_map.setdefault(dep.successor_task_id, []).append(dep.predecessor_task_id)
    return reverse_map


def _find_root_cause_for_task(task_id, reverse_map):
    chain = []
    current = task_id
    visited = set()

    while current in reverse_map and reverse_map[current]:
        predecessor = sorted(reverse_map[current])[0]
        if predecessor in visited:
            break
        visited.add(predecessor)
        chain.append(predecessor)
        current = predecessor

    root_cause = chain[-1] if chain else None
    return root_cause, chain


def _format_time_ago(dt):
    if not dt:
        return None

    now = timezone.now()
    delta = now - dt
    seconds = int(delta.total_seconds())

    if seconds < 60:
        return "just now"

    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"

    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"

    days = hours // 24
    return f"{days} day{'s' if days != 1 else ''} ago"


def get_workspace_from_request(request):
    workspace_id = request.headers.get("Workspace-ID") or request.META.get("HTTP_WORKSPACE_ID")

    if not workspace_id:
        return None, JsonResponse({"error": "Workspace-ID header is required."}, status=400)

    try:
        workspace = AdminWorkspace.objects.get(id=workspace_id)
    except AdminWorkspace.DoesNotExist:
        return None, JsonResponse({"error": "Workspace not found."}, status=404)

    return workspace, None


@csrf_exempt
def upsert_task_progress(request):
    if request.method not in ["POST", "PUT"]:
        return JsonResponse({"error": "POST or PUT required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    task_id = payload.get("taskId")
    sprint_id = payload.get("sprintId")

    if not task_id:
        return JsonResponse({"error": "taskId is required"}, status=400)

    try:
        task = Backlog.objects.get(task_id=task_id)
    except Backlog.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)

    status = payload.get("status")
    deadline_raw = payload.get("deadline")

    defaults = {}
    if status is not None:
        normalized_status = _normalize_status_input(status)
        allowed_status = {
            TaskProgress.STATUS_PENDING,
            TaskProgress.STATUS_IN_PROGRESS,
            TaskProgress.STATUS_COMPLETED,
        }
        if normalized_status not in allowed_status:
            return JsonResponse({"error": "Invalid status"}, status=400)
        defaults["status"] = normalized_status

    if deadline_raw is not None:
        if deadline_raw == "":
            defaults["deadline"] = None
        else:
            try:
                defaults["deadline"] = date.fromisoformat(deadline_raw)
            except ValueError:
                return JsonResponse({"error": "deadline must be YYYY-MM-DD"}, status=400)

    progress, created = TaskProgress.objects.get_or_create(
        workspace=workspace,
        task=task,
        sprint_id=sprint_id,
        defaults=defaults,
    )

    if not created:
        if "status" in defaults:
            progress.status = defaults["status"]
        if "deadline" in defaults:
            progress.deadline = defaults["deadline"]
        progress.save()

    resolved_alerts = 0
    if progress.status == TaskProgress.STATUS_COMPLETED:
        resolved_alerts = DelayAlert.objects.filter(
            workspace=workspace,
            task=task,
            is_active=True,
        ).update(is_active=False)

    response = {
        "id": progress.id,
        "workspaceId": progress.workspace_id,
        "taskId": progress.task_id,
        "sprintId": progress.sprint_id,
        "status": _status_for_api(progress.status),
        "deadline": progress.deadline.isoformat() if progress.deadline else None,
        "resolvedAlerts": resolved_alerts,
    }

    return JsonResponse({"success": True, "created": created, "data": response}, status=200)


@csrf_exempt
def run_engine(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    try:
        payload = json.loads(request.body.decode("utf-8")) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    sprint_id = payload.get("sprintId")
    project_id = payload.get("projectId")
    date_override = payload.get("date")
    default_status = _normalize_status_input(payload.get("defaultStatus", TaskProgress.STATUS_PENDING))
    default_deadline_raw = payload.get("defaultDeadline")
    default_deadline_offset_days = payload.get("defaultDeadlineOffsetDays")

    run_date = None
    if date_override:
        try:
            run_date = date.fromisoformat(date_override)
        except ValueError:
            return JsonResponse({"error": "date must be YYYY-MM-DD"}, status=400)

    default_deadline = None
    if default_deadline_raw:
        try:
            default_deadline = date.fromisoformat(default_deadline_raw)
        except ValueError:
            return JsonResponse({"error": "defaultDeadline must be YYYY-MM-DD"}, status=400)

    offset_days = None
    if default_deadline_offset_days is not None:
        try:
            offset_days = int(default_deadline_offset_days)
        except (TypeError, ValueError):
            return JsonResponse({"error": "defaultDeadlineOffsetDays must be an integer"}, status=400)

    result = run_delay_engine(
        workspace_id=workspace.id,
        sprint_id=sprint_id,
        project_id=project_id,
        today=run_date,
        default_status=default_status,
        default_deadline=default_deadline,
        default_deadline_offset_days=offset_days,
    )
    return JsonResponse({"success": True, "result": result}, status=200)


@csrf_exempt
def list_alerts(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    sprint_id = request.GET.get("sprintId")
    project_id = request.GET.get("projectId")
    active_param = request.GET.get("active", "true").lower()

    alerts = DelayAlert.objects.filter(workspace=workspace).select_related("task", "source_task", "sprint")

    if sprint_id:
        alerts = alerts.filter(sprint_id=sprint_id)

    if project_id:
        alerts = alerts.filter(task__project_id=str(project_id))

    if active_param in {"true", "1", "yes"}:
        alerts = alerts.filter(is_active=True)
    elif active_param in {"false", "0", "no"}:
        alerts = alerts.filter(is_active=False)

    data = []
    for alert in alerts.order_by("-detected_at"):
        data.append(
            {
                "id": alert.id,
                "taskId": alert.task_id,
                "projectId": alert.task.project_id,
                "taskTitle": alert.task.tasks,
                "sourceTaskId": alert.source_task_id,
                "sourceProjectId": alert.source_task.project_id if alert.source_task else None,
                "sourceTaskTitle": alert.source_task.tasks if alert.source_task else None,
                "sprintId": alert.sprint_id,
                "type": alert.alert_type,
                "reason": alert.reason,
                "severity": alert.severity,
                "isActive": alert.is_active,
                "detectedAt": alert.detected_at.isoformat(),
                "updatedAt": alert.updated_at.isoformat(),
            }
        )

    return JsonResponse({"success": True, "data": data}, status=200)


@csrf_exempt
def resolve_alert(request, alert_id):
    if request.method not in ["POST", "PATCH"]:
        return JsonResponse({"error": "POST or PATCH required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    try:
        alert = DelayAlert.objects.get(id=alert_id, workspace=workspace)
    except DelayAlert.DoesNotExist:
        return JsonResponse({"error": "Alert not found"}, status=404)

    alert.is_active = False
    alert.save(update_fields=["is_active", "updated_at"])

    return JsonResponse({"success": True, "message": "Alert resolved"}, status=200)


@csrf_exempt
def list_projects_delay_summary(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    projects = list(
        Project.objects.filter(owner__workspace=workspace)
        .distinct()
        .values("id", "name", "description")
    )

    # Fallback for legacy data where Project.owner.workspace is not populated.
    if not projects:
        project_ids_from_progress = set(
            TaskProgress.objects.filter(workspace=workspace).values_list("task__project_id", flat=True)
        )
        project_ids_from_alerts = set(
            DelayAlert.objects.filter(workspace=workspace).values_list("task__project_id", flat=True)
        )
        fallback_ids = sorted(project_ids_from_progress.union(project_ids_from_alerts))

        for pid in fallback_ids:
            try:
                project_obj = Project.objects.get(id=int(pid))
                projects.append(
                    {
                        "id": project_obj.id,
                        "name": project_obj.name,
                        "description": project_obj.description,
                    }
                )
            except (Project.DoesNotExist, ValueError, TypeError):
                projects.append(
                    {
                        "id": int(pid) if str(pid).isdigit() else pid,
                        "name": f"Project {pid}",
                        "description": None,
                    }
                )

    data = []
    for project in projects:
        project_id_str = str(project["id"])

        task_count = Backlog.objects.filter(project_id=project_id_str).count()

        active_delay_qs = DelayAlert.objects.filter(
            workspace=workspace,
            task__project_id=project_id_str,
            is_active=True,
        )
        delayed_task_count = active_delay_qs.values("task_id").distinct().count()

        latest_delay = (
            DelayAlert.objects.filter(workspace=workspace, task__project_id=project_id_str)
            .order_by("-detected_at")
            .first()
        )

        active_sprint = (
            Sprint.objects.filter(workspace=workspace, is_active=True, items__task__project_id=project_id_str)
            .distinct()
            .order_by("-start_date")
            .first()
        )

        data.append(
            {
                "projectId": project["id"],
                "projectName": project["name"],
                "description": project["description"],
                "activeSprintId": active_sprint.id if active_sprint else None,
                "taskCount": task_count,
                "delayedTaskCount": delayed_task_count,
                "lastDelay": _format_time_ago(latest_delay.detected_at) if latest_delay else None,
            }
        )

    return JsonResponse({"success": True, "data": data}, status=200)


@csrf_exempt
def get_project_delay_context(request, project_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    sprint_id = request.GET.get("sprintId")
    default_status = _normalize_status_input(request.GET.get("defaultStatus", TaskProgress.STATUS_PENDING))
    default_deadline_raw = request.GET.get("defaultDeadline")
    today = date.today()

    default_deadline = None
    if default_deadline_raw:
        try:
            default_deadline = date.fromisoformat(default_deadline_raw)
        except ValueError:
            return JsonResponse({"error": "defaultDeadline must be YYYY-MM-DD"}, status=400)

    tasks_qs = Backlog.objects.filter(project_id=str(project_id)).order_by("task_id")
    tasks = list(tasks_qs)

    task_ids = [t.task_id for t in tasks]
    active_alert_task_ids = set(
        DelayAlert.objects.filter(
            workspace=workspace,
            task_id__in=task_ids,
            is_active=True,
        ).values_list("task_id", flat=True)
    )
    progress_qs = TaskProgress.objects.filter(workspace=workspace, task_id__in=task_ids)
    if sprint_id:
        progress_qs = progress_qs.filter(sprint_id=sprint_id)
    progress_qs = progress_qs.order_by("task_id", "-updated_at")

    progress_by_task = {}
    for row in progress_qs:
        if row.task_id not in progress_by_task:
            progress_by_task[row.task_id] = row

    dependencies = list(
        TaskDependency.objects.filter(project_id=project_id).only(
            "id",
            "predecessor_task_id",
            "successor_task_id",
            "dependency_type",
            "confidence",
            "source",
        )
    )
    reverse_map = _build_reverse_dependency_map(dependencies)

    task_rows = []
    delayed_task_ids = set()

    for task in tasks:
        progress = progress_by_task.get(task.task_id)
        status = progress.status if progress else default_status
        due_date = progress.deadline if progress and progress.deadline else default_deadline

        is_delayed = bool(
            (due_date and due_date < today and not _status_is_done(status))
            or (task.task_id in active_alert_task_ids)
        )
        if is_delayed:
            delayed_task_ids.add(task.task_id)

        root_cause_id, chain = _find_root_cause_for_task(task.task_id, reverse_map)

        task_rows.append(
            {
                "taskId": task.task_id,
                "projectId": task.project_id,
                "title": task.tasks,
                "subtasks": task.subtasks,
                "status": _status_for_api(status),
                "dueDate": due_date.isoformat() if due_date else None,
                "isDelayed": is_delayed,
                "rootCauseTaskId": root_cause_id,
                "dependencyChain": chain,
            }
        )

    dependency_rows = [
        {
            "id": d.id,
            "predecessor_task_id": d.predecessor_task_id,
            "successor_task_id": d.successor_task_id,
            "dependency_type": d.dependency_type,
            "confidence": d.confidence,
            "source": d.source,
        }
        for d in dependencies
    ]

    return JsonResponse(
        {
            "success": True,
            "projectId": project_id,
            "sprintId": int(sprint_id) if sprint_id else None,
            "tasks": task_rows,
            "dependencies": dependency_rows,
            "summary": {
                "taskCount": len(task_rows),
                "delayedCount": len(delayed_task_ids),
            },
        },
        status=200,
    )
