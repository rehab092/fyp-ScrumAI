from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import TeamMember

@csrf_exempt
def add_team_member(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=400)

    try:
        data = json.loads(request.body)

        name = data.get("name")
        role = data.get("role")
        skills = data.get("skills", [])
        capacity = data.get("capacityHours")

        # Validation
        if not name or not role or capacity is None:
            return JsonResponse({"error": "Missing required fields"}, status=400)

        member = TeamMember.objects.create(
            name=name,
            role=role,
            skills=skills,
            capacityHours=capacity,
            assignedHours=0,
            status="available"
        )

        return JsonResponse({
            "message": "Team member added successfully",
            "member": {
                "id": member.id,
                "name": member.name,
                "role": member.role,
                "skills": member.skills,
                "capacityHours": member.capacityHours,
                "assignedHours": member.assignedHours,
                "status": member.status
            }
        }, status=201)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
