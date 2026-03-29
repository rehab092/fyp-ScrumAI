from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Sprint, SprintItem

@csrf_exempt
def get_sprints(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET method required"}, status=400)

    workspace, error_response = get_workspace_from_request(request)
    if error_response:
        return error_response

    sprints = Sprint.objects.filter(workspace=workspace).order_by("-start_date")

    data = []
    for s in sprints:
        data.append({
            "id": s.id,
            "name": s.name,
            "goal": s.goal,
            "start_date": s.start_date,
            "end_date": s.end_date,
            "is_active": s.is_active
        })

    return JsonResponse({"success": True, "sprints": data}, status=200)


def get_sprint_items(request, sprint_id):
    try:
        sprint = Sprint.objects.get(id=sprint_id)
    except Sprint.DoesNotExist:
        return JsonResponse({"error": "Sprint not found"}, status=404)

    items = SprintItem.objects.filter(sprint=sprint).select_related("task")

    data = []
    for item in items:
        data.append({
            "task_id": item.task.id,
            "task_title": item.task.tasks,
            "task_subtasks": item.task.subtasks,
            "added_at": item.added_at.isoformat()
        })

    return JsonResponse({"success": True, "items": data}, status=200)