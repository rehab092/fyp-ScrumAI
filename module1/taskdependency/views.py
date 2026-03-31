import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import TaskDependency
from .services.mapper import compute_and_store_project_dependencies


@csrf_exempt
def get_project_dependencies(request, project_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET method required"}, status=400)

    deps = (
        TaskDependency.objects.filter(project_id=project_id)
        .select_related("predecessor_task", "successor_task")
        .order_by("id")
    )

    data = []
    for d in deps:
        predecessor_obj = {
            "id": d.predecessor_task_id,
            "task": d.predecessor_task.tasks,
        }
        successor_obj = {
            "id": d.successor_task_id,
            "task": d.successor_task.tasks,
        }

        data.append(
            {
                "id": d.id,
                "project_id": d.project_id,
                "predecessor_task_id": d.predecessor_task_id,
                "successor_task_id": d.successor_task_id,
                "predecessor_task": d.predecessor_task.tasks,
                "successor_task": d.successor_task.tasks,
                "dependency_type": d.dependency_type,
                "confidence": d.confidence,
                "confidence_score": d.confidence,
                "source": d.source,
                "model_source": d.source,
                "dependency_source": d.source,
                "reason": d.reason,
                "mapper_version": d.mapper_version,
                # UI-friendly aliases
                "predecessor_id": d.predecessor_task_id,
                "successor_id": d.successor_task_id,
                "predecessor": predecessor_obj,
                "successor": successor_obj,
                # Status is expected from assignment/progress module; placeholder here.
                "predecessor_status": None,
                "successor_status": None,
                "updated_at": d.updated_at.isoformat(),
            }
        )

    return JsonResponse({"success": True, "project_id": project_id, "dependencies": data}, status=200)


@csrf_exempt
def recompute_project_dependencies(request, project_id):
    if request.method not in ["POST", "PUT"]:
        return JsonResponse({"error": "POST or PUT method required"}, status=400)

    try:
        payload = json.loads(request.body.decode("utf-8")) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    mapper_version = payload.get("mapper_version")
    overwrite = bool(payload.get("overwrite", True))

    result = compute_and_store_project_dependencies(
        project_id=project_id,
        mapper_version=mapper_version,
        overwrite=overwrite,
    )

    return JsonResponse({"success": True, **result}, status=200)
