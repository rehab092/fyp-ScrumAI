from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from assignment_module.models import AdminWorkspace
from django.contrib.auth.hashers import check_password
from assignment_module.models import InvitationToken
import uuid



@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=400)

    data = json.loads(request.body)
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return JsonResponse({"error": "Email and password required"}, status=400)

    try:
        admin = AdminWorkspace.objects.get(adminEmail=email)
    except AdminWorkspace.DoesNotExist:
        return JsonResponse({"error": "Invalid email"}, status=404)

    # TEMPORARY (plain text password)
    if admin.password != password:
        return JsonResponse({"error": "Incorrect password"}, status=401)

    return JsonResponse({
        "message": "Login successful",
        "workspaceId": admin.id,
        "workspaceName": admin.workspaceName,
        "companyName": admin.companyName,
    }, status=200)

@csrf_exempt
def register_admin(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=400)

    try:
        data = json.loads(request.body)

        adminName = data.get("adminName")
        adminEmail = data.get("adminEmail")
        password = data.get("password")
        workspaceName = data.get("workspaceName")
        companyName = data.get("companyName")

        if not all([adminName, adminEmail, password, workspaceName, companyName]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        # Create admin
        admin = AdminWorkspace.objects.create(
            adminName=adminName,
            adminEmail=adminEmail,
            password=password,
            workspaceName=workspaceName,
            companyName=companyName
        )

        return JsonResponse({
            "success": True,
            "message": "Admin registered successfully",
            "adminId": admin.id
        }, status=201)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
        

@csrf_exempt
def activate_account(request):
    data = json.loads(request.body)
    token = data["token"]
    password = data["password"]

    try:
        invite = InvitationToken.objects.get(token=token, is_used=False)
    except:
        return JsonResponse({"error": "Invalid or expired token"}, status=400)

    # create user account
    member = TeamMember.objects.get(email=invite.email)
    member.password = hash_password(password)
    member.save()

    invite.is_used = True
    invite.save()

    return JsonResponse({"message": "Account activated successfully"})

