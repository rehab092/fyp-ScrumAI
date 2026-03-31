from collections import defaultdict
from itertools import combinations
from typing import Dict, List, Tuple

from django.db import transaction

from userstorymanager.models import Backlog, Project

from taskdependency.models import TaskDependency
from taskdependency.services.ml_adapter import infer_ml_dependencies


def _generate_task_pairs(tasks: List[Backlog]) -> List[Tuple[int, str, int, str]]:
    pairs: List[Tuple[int, str, int, str]] = []
    for a, b in combinations(tasks, 2):
        pairs.append((a.task_id, a.tasks, b.task_id, b.tasks))
        pairs.append((b.task_id, b.tasks, a.task_id, a.tasks))
    return pairs


def _is_real_dependency(dependency_type: str, confidence: float) -> bool:
    """
    Keep only meaningful dependency results.
    Anything marked as none/no_dependency/independent is ignored.
    """
    if dependency_type is None:
        return False

    normalized = str(dependency_type).strip().upper()
    if not normalized:
        return False

    non_dependency_labels = {
        "NONE",
        "NO_DEPENDENCY",
        "NO-DEPENDENCY",
        "INDEPENDENT",
        "UNRELATED",
        "NA",
        "N/A",
    }

    if normalized in non_dependency_labels:
        return False

    # Supported table values. Unknown labels are ignored to prevent bad writes.
    allowed_types = {"BLOCKS", "REQUIRES", "RELATES"}
    if normalized not in allowed_types:
        return False

    try:
        return float(confidence) > 0.0
    except Exception:
        return False


def _would_create_cycle(adjacency: Dict[int, set], from_task: int, to_task: int) -> bool:
    """
    Adding edge from_task -> to_task creates a cycle if there's already
    a path to_task -> ... -> from_task.
    """
    if from_task == to_task:
        return True

    stack = [to_task]
    seen = set()
    while stack:
        node = stack.pop()
        if node == from_task:
            return True
        if node in seen:
            continue
        seen.add(node)
        for nxt in adjacency.get(node, set()):
            if nxt not in seen:
                stack.append(nxt)
    return False


@transaction.atomic
def compute_and_store_project_dependencies(project_id: int, mapper_version: str = None, overwrite: bool = True) -> dict:
    project = Project.objects.get(id=project_id)

    # Existing schema stores project_id as string on Backlog.
    tasks = list(Backlog.objects.filter(project_id=str(project.id)).order_by("task_id"))

    if len(tasks) < 2:
        if overwrite:
            TaskDependency.objects.filter(project=project).delete()
        return {
            "project_id": project_id,
            "task_count": len(tasks),
            "dependencies_saved": 0,
            "message": "Not enough tasks to infer dependencies.",
        }

    task_pairs = _generate_task_pairs(tasks)

    ml_candidates = infer_ml_dependencies(task_pairs)

    if overwrite:
        TaskDependency.objects.filter(project=project).delete()

    to_create = []
    adjacency: Dict[int, set] = defaultdict(set)

    if not overwrite:
        existing = TaskDependency.objects.filter(project=project).values_list(
            "predecessor_task_id",
            "successor_task_id",
        )
        for src, dst in existing:
            adjacency[src].add(dst)

    # Prefer stronger edges first when cycle conflicts happen.
    sorted_ml_candidates = sorted(
        ml_candidates,
        key=lambda c: float(getattr(c, "confidence", 0.0) or 0.0),
        reverse=True,
    )

    for candidate in sorted_ml_candidates:
        predecessor_task_id = int(candidate.predecessor_task_id)
        successor_task_id = int(candidate.successor_task_id)

        if predecessor_task_id == successor_task_id:
            continue

        dependency_type = str(getattr(candidate, "dependency_type", "") or "").strip().upper()
        confidence = float(getattr(candidate, "confidence", 0.0) or 0.0)
        source = str(getattr(candidate, "source", "ML") or "ML")
        reason = str(getattr(candidate, "reason", "") or "")

        if not _is_real_dependency(dependency_type, confidence):
            continue

        # Enforce DAG: skip this edge if it creates a circular dependency.
        if _would_create_cycle(adjacency, predecessor_task_id, successor_task_id):
            continue

        adjacency[predecessor_task_id].add(successor_task_id)

        to_create.append(
            TaskDependency(
                project=project,
                predecessor_task_id=predecessor_task_id,
                successor_task_id=successor_task_id,
                dependency_type=dependency_type,
                confidence=confidence,
                source=source,
                reason=reason,
                mapper_version=mapper_version,
            )
        )

    if to_create:
        TaskDependency.objects.bulk_create(to_create, ignore_conflicts=True)

    return {
        "project_id": project_id,
        "task_count": len(tasks),
        "dependencies_saved": len(to_create),
        "message": "Dependency mapping complete.",
    }
