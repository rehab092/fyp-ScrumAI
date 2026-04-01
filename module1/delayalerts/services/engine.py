from collections import deque
from datetime import date, timedelta
from typing import Dict, Iterable, List, Optional, Set

from django.db import transaction

from delayalerts.models import DelayAlert, TaskProgress
from sprintmanager.models import Sprint, SprintItem
from taskdependency.models import TaskDependency
from userstorymanager.models import Backlog, Project


def build_dependency_map(dependencies: Iterable[TaskDependency]) -> Dict[int, List[int]]:
    graph: Dict[int, List[int]] = {}
    for row in dependencies:
        pred = row.predecessor_task_id
        succ = row.successor_task_id

        if pred not in graph:
            graph[pred] = []
        graph[pred].append(succ)

    return graph


def _delay_exists(workspace_id: int, task_id: int, source_task_id: Optional[int]) -> bool:
    return DelayAlert.objects.filter(
        workspace_id=workspace_id,
        task_id=task_id,
        source_task_id=source_task_id,
        is_active=True,
    ).exists()


def create_delay(
    *,
    workspace_id: int,
    task_id: int,
    alert_type: str,
    source_task_id: Optional[int],
    reason: str,
    severity: int,
    sprint_id: Optional[int],
) -> Optional[DelayAlert]:
    if _delay_exists(workspace_id=workspace_id, task_id=task_id, source_task_id=source_task_id):
        return None

    return DelayAlert.objects.create(
        workspace_id=workspace_id,
        task_id=task_id,
        sprint_id=sprint_id,
        alert_type=alert_type,
        source_task_id=source_task_id,
        reason=reason,
        severity=severity,
        is_active=True,
    )


def resolve_completed_task_alerts(*, workspace_id: int, completed_task_ids: Set[int]) -> int:
    if not completed_task_ids:
        return 0

    return DelayAlert.objects.filter(
        workspace_id=workspace_id,
        task_id__in=completed_task_ids,
        is_active=True,
    ).update(is_active=False)


def detect_direct_delays(
    *,
    progress_rows: Iterable[dict],
    workspace_id: int,
    today: date,
) -> List[int]:
    delayed_task_ids: List[int] = []

    for row in progress_rows:
        deadline = row.get("deadline")
        if not deadline:
            continue

        status = str(row.get("status") or "").strip().lower()
        if today > deadline and status not in {"completed", "done"}:
            task_id = row["task_id"]
            delayed_task_ids.append(task_id)
            create_delay(
                workspace_id=workspace_id,
                task_id=task_id,
                alert_type=DelayAlert.TYPE_DIRECT,
                source_task_id=None,
                reason="Not completed within sprint",
                severity=0,
                sprint_id=row.get("sprint_id"),
            )

    return delayed_task_ids


def propagate_delays(
    *,
    initial_delayed_tasks: Iterable[int],
    dependency_map: Dict[int, List[int]],
    workspace_id: int,
    task_to_sprint_id: Dict[int, Optional[int]],
) -> int:
    queue = deque()
    visited: Set[int] = set()
    created_count = 0

    for task_id in initial_delayed_tasks:
        queue.append({"task_id": task_id, "source": task_id, "depth": 0})

    while queue:
        current = queue.popleft()

        current_task = current["task_id"]
        source_task = current["source"]
        depth = current["depth"]

        if current_task not in dependency_map:
            continue

        for dependent_task in dependency_map[current_task]:
            if dependent_task in visited:
                continue

            visited.add(dependent_task)

            delay_type = DelayAlert.TYPE_CASCADE if depth == 0 else DelayAlert.TYPE_CHAIN
            created = create_delay(
                workspace_id=workspace_id,
                task_id=dependent_task,
                alert_type=delay_type,
                source_task_id=source_task,
                reason=f"Blocked by task {current_task}",
                severity=depth + 1,
                sprint_id=task_to_sprint_id.get(dependent_task),
            )
            if created is not None:
                created_count += 1

            queue.append({"task_id": dependent_task, "source": source_task, "depth": depth + 1})

    return created_count


@transaction.atomic
def run_delay_engine(
    *,
    workspace_id: int,
    sprint_id: Optional[int] = None,
    project_id: Optional[int] = None,
    today: Optional[date] = None,
    default_status: str = TaskProgress.STATUS_PENDING,
    default_deadline: Optional[date] = None,
    default_deadline_offset_days: Optional[int] = None,
) -> dict:
    run_date = today or date.today()
    normalized_default_status = str(default_status or TaskProgress.STATUS_PENDING).strip().upper()

    progress_qs = TaskProgress.objects.filter(workspace_id=workspace_id).select_related("task", "sprint")
    if sprint_id is not None:
        progress_qs = progress_qs.filter(sprint_id=sprint_id)

    progress_model_rows = list(progress_qs)
    completed_task_ids = set(
        TaskProgress.objects.filter(
            workspace_id=workspace_id,
            status=TaskProgress.STATUS_COMPLETED,
        ).values_list("task_id", flat=True)
    )
    resolved_completed_count = resolve_completed_task_alerts(
        workspace_id=workspace_id,
        completed_task_ids=completed_task_ids,
    )

    project_ids_qs = Project.objects.filter(owner__workspace_id=workspace_id).values_list("id", flat=True)
    workspace_project_ids = [int(pid) for pid in project_ids_qs]
    if project_id is not None:
        workspace_project_ids = [pid for pid in workspace_project_ids if pid == int(project_id)]

    task_qs = Backlog.objects.filter(project_id__in=[str(pid) for pid in workspace_project_ids]).order_by("task_id")
    if sprint_id is not None:
        sprint_task_ids = SprintItem.objects.filter(sprint_id=sprint_id).values_list("task_id", flat=True)
        task_qs = task_qs.filter(task_id__in=sprint_task_ids)

    workspace_tasks = list(task_qs)

    fallback_sprint_deadline = None
    if sprint_id is not None:
        fallback_sprint_deadline = Sprint.objects.filter(id=sprint_id).values_list("end_date", flat=True).first()

    progress_by_task = {}
    for row in progress_model_rows:
        progress_by_task[row.task_id] = row

    if default_deadline is None and default_deadline_offset_days is not None:
        default_deadline = run_date + timedelta(days=default_deadline_offset_days)

    canonical_rows: List[dict] = []

    for task in workspace_tasks:
        row = progress_by_task.get(task.task_id)

        if row is not None:
            status_value = row.status
            deadline_value = row.deadline
            sprint_value = row.sprint_id
        else:
            status_value = normalized_default_status
            deadline_value = default_deadline or fallback_sprint_deadline
            sprint_value = sprint_id

        canonical_rows.append(
            {
                "task_id": task.task_id,
                "project_id": task.project_id,
                "sprint_id": sprint_value,
                "status": status_value,
                "deadline": deadline_value,
            }
        )

    if not canonical_rows:
        for row in progress_model_rows:
            canonical_rows.append(
                {
                    "task_id": row.task_id,
                    "project_id": row.task.project_id,
                    "sprint_id": row.sprint_id,
                    "status": row.status,
                    "deadline": row.deadline,
                }
            )

    if not canonical_rows:
        return {
            "workspace_id": workspace_id,
            "sprint_id": sprint_id,
            "project_id": project_id,
            "tracked_tasks": 0,
            "direct_delayed_tasks": 0,
            "propagated_delays_created": 0,
            "resolved_completed_task_alerts": resolved_completed_count,
            "message": "No tracked tasks found for delay analysis.",
        }

    project_ids: Set[int] = set()
    task_to_sprint_id: Dict[int, Optional[int]] = {}

    for row in canonical_rows:
        task_to_sprint_id[row["task_id"]] = row.get("sprint_id")
        try:
            project_ids.add(int(row["project_id"]))
        except (TypeError, ValueError):
            continue

    dependencies = TaskDependency.objects.filter(project_id__in=project_ids).only(
        "predecessor_task_id",
        "successor_task_id",
    )
    dependency_map = build_dependency_map(dependencies)

    direct_delayed_tasks = detect_direct_delays(
        progress_rows=canonical_rows,
        workspace_id=workspace_id,
        today=run_date,
    )

    unique_direct_delayed = list(dict.fromkeys(direct_delayed_tasks))
    propagated_count = propagate_delays(
        initial_delayed_tasks=unique_direct_delayed,
        dependency_map=dependency_map,
        workspace_id=workspace_id,
        task_to_sprint_id=task_to_sprint_id,
    )

    return {
        "workspace_id": workspace_id,
        "sprint_id": sprint_id,
        "project_id": project_id,
        "tracked_tasks": len(canonical_rows),
        "direct_delayed_tasks": len(unique_direct_delayed),
        "propagated_delays_created": propagated_count,
        "resolved_completed_task_alerts": resolved_completed_count,
        "message": "Delay analysis completed.",
    }
