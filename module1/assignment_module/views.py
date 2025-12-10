from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import uuid
from .models import TeamMember, InvitationToken
from django.contrib.auth.hashers import make_password, check_password
from .models import AdminWorkspace
import secrets
from .models import AdminWorkspace, TeamMember, ManagementUser, InvitationToken
from userstorymanager.models import ProductOwner

import requests
from django.conf import settings




@csrf_exempt
def add_team_member(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Only POST allowed."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON body."}, status=400)

    # workspace context from admin portal
    workspace_id = request.headers.get("Workspace-ID") or request.META.get("HTTP_WORKSPACE_ID")
    if not workspace_id:
        return JsonResponse({"success": False, "error": "Workspace-ID header is required."}, status=400)

    try:
        workspace = AdminWorkspace.objects.get(id=workspace_id)
    except AdminWorkspace.DoesNotExist:
        return JsonResponse({"success": False, "error": "Workspace not found."}, status=404)

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    skills = data.get("skills") or []
    capacity_hours = data.get("capacityHours") or 40

    missing = []
    if not name: missing.append("name")
    if not email: missing.append("email")
    if missing:
        return JsonResponse(
            {"success": False, "error": f"Missing required fields: {', '.join(missing)}"},
            status=400,
        )

    if TeamMember.objects.filter(email__iexact=email).exists():
        return JsonResponse(
            {"success": False, "error": "A team member with this email already exists."},
            status=400,
        )

    plain_password = generate_password(10)
    hashed_password = make_password(plain_password)

    member = TeamMember.objects.create(
        workspace=workspace,
        name=name,
        email=email,
        password=hashed_password,
        skills=skills,
        capacityHours=capacity_hours,
        assignedHours=0,
        status="available",
    )

    token = uuid.uuid4().hex
    invite = InvitationToken.objects.create(
        workspace=workspace,
        email=email,
        token=token,
        role="DEVELOPER",   # just for info in email
        is_used=False,
    )

    # 👇 CALL EMAILJS *BEFORE* RETURN
    email_sent = send_invitation_email(
        to_email=member.email,
        name=member.name,
        role="DEVELOPER",
        workspace_name=workspace.workspaceName,
        password=plain_password,
    )

    return JsonResponse(
        {
            "success": True,
            "message": "Team member created and invitation generated.",
            "member": {
                "id": member.id,
                "name": member.name,
                "email": member.email,
                "skills": member.skills,
                "capacityHours": member.capacityHours,
                "assignedHours": member.assignedHours,
                "status": member.status,
                "workspaceId": workspace.id,
            },
            "credentials": {
                "email": member.email,
                "password": plain_password,
                "role": "DEVELOPER",
            },
            "invitation": {
                "token": invite.token,
                "role": invite.role,
                "email": invite.email,
            },
            "emailSent": email_sent,   # 👈 so you can see if it worked
        },
        status=201,
    )

def get_team_members(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET method required"}, status=400)

    # 🔥 Read Workspace-ID from headers
    workspace_id = request.headers.get("Workspace-ID") or request.META.get("HTTP_WORKSPACE_ID")
    if not workspace_id:
        return JsonResponse({"error": "Workspace-ID header is required."}, status=400)

    # 🔥 Validate workspace exists
    try:
        workspace = AdminWorkspace.objects.get(id=workspace_id)
    except AdminWorkspace.DoesNotExist:
        return JsonResponse({"error": "Workspace not found."}, status=404)

    # 🔥 Filter team members by this workspace ONLY
    members = TeamMember.objects.filter(workspace=workspace)

    response = []

    for member in members:
        assigned = member.assignedHours
        capacity = member.capacityHours
        remaining = capacity - assigned

        # Determine status
        if assigned > capacity:
            status = "overloaded"
        elif remaining < (capacity * 0.3):
            status = "high_load"
        else:
            status = "available"

        # Update DB if status changed
        if member.status != status:
            member.status = status
            member.save(update_fields=["status"])

        response.append({
            "id": member.id,
            "name": member.name,
            "email": member.email,
            "role": "DEVELOPER",   # fixed role
            "skills": member.skills,
            "capacityHours": capacity,
            "assignedHours": assigned,
            "remainingHours": remaining,
            "status": status
        })

    return JsonResponse(response, safe=False, status=200)

@csrf_exempt
def get_team_member_by_id(request, member_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET method required"}, status=400)

    try:
        member = TeamMember.objects.get(id=member_id)
    except TeamMember.DoesNotExist:
        return JsonResponse({"error": "Team member not found"}, status=404)

    data = {
        "id": member.id,
        "name": member.name,
        "email": member.email,
        "role": "DEVELOPER",                # no longer in DB
        "skills": member.skills,
        "capacityHours": member.capacityHours,
        "assignedHours": member.assignedHours,
        "status": member.status,
    }

    return JsonResponse({"success": True, "data": data}, status=200)

@csrf_exempt
def update_team_member(request, member_id):
    if request.method not in ["PATCH", "POST"]:
        return JsonResponse({"error": "PATCH method required"}, status=400)

    try:
        member = TeamMember.objects.get(id=member_id)
    except TeamMember.DoesNotExist:
        return JsonResponse({"error": "Team member not found"}, status=404)

    data = json.loads(request.body)

    # Updatable fields
    if "name" in data:
        member.name = data["name"]

    if "skills" in data:
        member.skills = data["skills"]

    if "capacityHours" in data:
        member.capacityHours = data["capacityHours"]

    if "assignedHours" in data:
        member.assignedHours = data["assignedHours"]

    # Recalculate workload status
    assigned = member.assignedHours
    capacity = member.capacityHours
    remaining = capacity - assigned

    if assigned > capacity:
        status = "overloaded"
    elif remaining < (capacity * 0.3):
        status = "high_load"
    else:
        status = "available"

    member.status = status
    member.save()

    return JsonResponse({
        "success": True,
        "message": "Team member updated successfully",
        "updated": {
            "id": member.id,
            "name": member.name,
            "email": member.email,
            "role": "DEVELOPER",
            "skills": member.skills,
            "capacityHours": member.capacityHours,
            "assignedHours": member.assignedHours,
            "status": member.status
        }
    }, status=200)
   
@csrf_exempt
def delete_team_member(request, member_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE method required"}, status=400)

    try:
        member = TeamMember.objects.get(id=member_id)
    except TeamMember.DoesNotExist:
        return JsonResponse({"error": "Team member not found"}, status=404)

    if member.assignedHours > 0:
        return JsonResponse({
            "success": False,
            "error": "Cannot delete developer because tasks are still assigned."
        }, status=400)

    member.delete()

    return JsonResponse({
        "success": True,
        "message": "Team member deleted successfully"
    }, status=200)

@csrf_exempt
def register_workspace(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method is allowed."}, status=405)

    # Parse JSON body
    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    # Required fields
    required_fields = ["adminName", "adminEmail", "password", "workspaceName", "companyName"]
    missing = [field for field in required_fields if not str(data.get(field, "")).strip()]
    if missing:
        return JsonResponse(
            {"error": f"Missing required fields: {', '.join(missing)}"},
            status=400,
        )

    admin_name = data["adminName"].strip()
    admin_email = data["adminEmail"].strip().lower()
    raw_password = data["password"]
    workspace_name = data["workspaceName"].strip()
    company_name = data["companyName"].strip()

    # Check if email already used
    if AdminWorkspace.objects.filter(adminEmail__iexact=admin_email).exists():
        return JsonResponse(
            {"error": "An admin with this email already exists."},
            status=400,
        )

    # Hash password before saving
    hashed_password = make_password(raw_password)

    # Create workspace + admin account
    workspace = AdminWorkspace.objects.create(
        adminName=admin_name,
        adminEmail=admin_email,
        password=hashed_password,
        workspaceName=workspace_name,
        companyName=company_name,
    )

    # Return response (no password)
    return JsonResponse(
        {
            "message": "Workspace created successfully.",
            "workspace": {
                "id": workspace.id,
                "adminName": workspace.adminName,
                "adminEmail": workspace.adminEmail,
                "workspaceName": workspace.workspaceName,
                "companyName": workspace.companyName,
            },
        },
        status=201,
    )

#admin login 
@csrf_exempt
def login_admin(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method is allowed."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    # Accept either "email" or "adminEmail" from frontend
    email = data.get("email") or data.get("adminEmail")
    password = data.get("password")

    if not email or not password:
        return JsonResponse(
            {"error": "Email and password are required."},
            status=400,
        )

    email = email.strip().lower()

    # Find admin workspace by email
    try:
        workspace = AdminWorkspace.objects.get(adminEmail__iexact=email)
    except AdminWorkspace.DoesNotExist:
        # Don't reveal which one is wrong (email or password) for security
        return JsonResponse({"error": "Invalid email or password."}, status=401)

    # Verify password
    if not check_password(password, workspace.password):
        return JsonResponse({"error": "Invalid email or password."}, status=401)

    # Success – return workspace info + id
    return JsonResponse(
        {
            "message": "Login successful.",
            "workspace": {
                "id": workspace.id,
                "adminName": workspace.adminName,
                "adminEmail": workspace.adminEmail,
                "workspaceName": workspace.workspaceName,
                "companyName": workspace.companyName,
            },
        },
        status=200,
    )

@csrf_exempt
def login_user(request):
    """
    Login for:
    - Scrum Master (ManagementUser → SCRUM_MASTER)
    - Product Owner (ManagementUser → PRODUCT_OWNER)
    - Developer (TeamMember → DEVELOPER)
    
    Backend determines correct role & sends redirect info for frontend.
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Only POST method is allowed."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON body."}, status=400)

    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not email or not password:
        return JsonResponse(
            {"success": False, "error": "Email and password are required."},
            status=400,
        )

    # ------------------------------------------------------
    # 1️⃣ TRY SCRUM MASTER / PRODUCT OWNER (ManagementUser)
    # ------------------------------------------------------
    try:
        user = ManagementUser.objects.get(email__iexact=email)
        user2=ProductOwner.objects.get(email__iexact=email)

        if check_password(password, user.password):
            workspace = user.workspace
           


            # Determine portal route
            redirect_map = {
                "SCRUM_MASTER": "/scrum-master/dashboard",
                "PRODUCT_OWNER": "/product-owner/dashboard",
            }
           
            return JsonResponse(
                {
                    "success": True,
                    "message": "Login successful.",
                    "user": {
                        "id": user.id,
                        "name": user.name,
                        "email": user.email,
                        "role": user.role,              # SCRUM_MASTER / PRODUCT_OWNER
                        "userType": "MANAGEMENT",
                        "workspaceId": workspace.id if workspace else None,
                        "workspaceName": workspace.workspaceName if workspace else None,
                        "redirectTo": redirect_map.get(user.role, "/"),
                    },
                },
                status=200,
            )


    except ManagementUser.DoesNotExist:
        pass

    # ------------------------------------------------------
    # 2️⃣ TRY DEVELOPER (TeamMember)
    # ------------------------------------------------------
    try:
        dev = TeamMember.objects.get(email__iexact=email)

        if check_password(password, dev.password):
            workspace = dev.workspace

            return JsonResponse(
                {
                    "success": True,
                    "message": "Login successful.",
                    "user": {
                        "id": dev.id,
                        "name": dev.name,
                        "email": dev.email,
                        "role": "DEVELOPER",
                        "userType": "TEAM_MEMBER",
                        "workspaceId": workspace.id if workspace else None,
                        "workspaceName": workspace.workspaceName if workspace else None,
                        "redirectTo": "/developer/dashboard",
                    },
                },
                status=200,
            )

    except TeamMember.DoesNotExist:
        pass

    # ------------------------------------------------------
    # 3️⃣ TRY PRODUCT OWNER (from userstorymanager app)
    # ------------------------------------------------------
    try:
        owner = ProductOwner.objects.get(email__iexact=email)

        # ProductOwner stores plaintext password in DB
        if owner.password == password:
            return JsonResponse(
                {
                    "success": True,
                    "message": "Login successful.",
                    "user": {
                        "id": owner.id,
                        "name": getattr(owner, "name", owner.email),
                        "email": owner.email,
                        "role": "PRODUCT_OWNER",
                        "userType": "PRODUCT_OWNER",
                        "company": owner.company_name,
                        "redirectTo": "/product-owner/dashboard",
                    },
                },
                status=200,
            )

    except ProductOwner.DoesNotExist:
        pass

    # ------------------------------------------------------
    # 4️⃣ INVALID LOGIN
    # ------------------------------------------------------
    return JsonResponse(
        {"success": False, "error": "Invalid email or password."},
        status=401,
    )


#GENERATE PASSWORD FOR USER
@csrf_exempt
def generate_password(length=10):
    """
    Generate a random password with letters + digits.
    This is what we will email to Scrum Master / PO / Team Member.
    """
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


#ADD USER BASED ON ROLES LIKE SCRUM MASTER /PRODUCT OWNER
@csrf_exempt
def add_management_user(request):
    """
    Used by Admin to add:
    - Scrum Master (SCRUM_MASTER)
    - Product Owner (PRODUCT_OWNER)
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Only POST allowed."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON body."}, status=400)

    workspace_id = request.headers.get("Workspace-ID") or request.META.get("HTTP_WORKSPACE_ID")
    if not workspace_id:
        return JsonResponse({"success": False, "error": "Workspace-ID header is required."}, status=400)

    try:
        workspace = AdminWorkspace.objects.get(id=workspace_id)
    except AdminWorkspace.DoesNotExist:
        return JsonResponse({"success": False, "error": "Workspace not found."}, status=404)

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    role = (data.get("role") or "").strip()  # SCRUM_MASTER / PRODUCT_OWNER
    skills = data.get("skills") or []

    missing = []
    if not name: missing.append("name")
    if not email: missing.append("email")
    if not role: missing.append("role")

    if missing:
        return JsonResponse(
            {"success": False, "error": f"Missing required fields: {', '.join(missing)}"},
            status=400,
        )

    if role not in ["SCRUM_MASTER", "PRODUCT_OWNER"]:
        return JsonResponse(
            {"success": False, "error": "Invalid role. Use SCRUM_MASTER or PRODUCT_OWNER."},
            status=400,
        )

    if ManagementUser.objects.filter(email__iexact=email).exists():
        return JsonResponse(
            {"success": False, "error": "A management user with this email already exists."},
            status=400,
        )

    plain_password = generate_password(10)
    hashed_password = make_password(plain_password)

    user = ManagementUser.objects.create(
        workspace=workspace,
        name=name,
        email=email,
        password=hashed_password,
        role=role,
        skills=skills,
    )

    token = uuid.uuid4().hex
    invite = InvitationToken.objects.create(
        workspace=workspace,
        email=email,
        token=token,
        role=role,
        is_used=False,
    )

    # 👇 CALL EMAILJS *BEFORE* RETURN
    email_sent = send_invitation_email(
        to_email=user.email,
        name=user.name,
        role=user.role,  # SCRUM_MASTER or PRODUCT_OWNER
        workspace_name=workspace.workspaceName,
        password=plain_password,
    )

    return JsonResponse(
        {
            "success": True,
            "message": "Management user created and invitation generated.",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "skills": user.skills,
                "workspaceId": workspace.id,
            },
            "credentials": {
                "email": user.email,
                "password": plain_password,
                "role": user.role,
            },
            "invitation": {
                "token": invite.token,
                "role": invite.role,
                "email": invite.email,
            },
            "emailSent": email_sent,
        },
        status=201,
    )



#EMAIL INVITATION
def send_invitation_email(to_email, name, role, workspace_name, password):
    payload = {
        "service_id": settings.EMAILJS_SERVICE_ID,
        "template_id": settings.EMAILJS_TEMPLATE_ID_INVITE,
        "user_id": settings.EMAILJS_PUBLIC_KEY,
        "template_params": {
            "to_email": to_email,
            "to_name": name,
            "role": role,
            "workspace_name": workspace_name,
            "login_email": to_email,
            "password": password,
        },
    }

    try:
        r = requests.post(
            "https://api.emailjs.com/api/v1.0/email/send",
            json=payload,
            timeout=10,
        )
        r.raise_for_status()
        return True
    except requests.RequestException as e:
        print("EmailJS error:", e)
        return False


@csrf_exempt
def get_scrum_masters(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET method required"}, status=400)

    # Get workspace ID from frontend header
    workspace_id = request.headers.get("Workspace-ID") or request.META.get("HTTP_WORKSPACE_ID")
    if not workspace_id:
        return JsonResponse({"error": "Workspace-ID header is required."}, status=400)

    try:
        workspace = AdminWorkspace.objects.get(id=workspace_id)
    except AdminWorkspace.DoesNotExist:
        return JsonResponse({"error": "Workspace not found."}, status=404)

    # Filter only SCRUM_MASTER users for this workspace
    scrum_masters = ManagementUser.objects.filter(workspace=workspace, role="SCRUM_MASTER")

    data = [
        {
            "id": sm.id,
            "name": sm.name,
            "email": sm.email,
            "role": sm.role,
            "skills": sm.skills,
        }
        for sm in scrum_masters
    ]

    return JsonResponse({"success": True, "scrumMasters": data}, status=200)
@csrf_exempt
def get_product_owners(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET method required"}, status=400)

    workspace_id = request.headers.get("Workspace-ID") or request.META.get("HTTP_WORKSPACE_ID")
    if not workspace_id:
        return JsonResponse({"error": "Workspace-ID header is required."}, status=400)

    try:
        workspace = AdminWorkspace.objects.get(id=workspace_id)
    except AdminWorkspace.DoesNotExist:
        return JsonResponse({"error": "Workspace not found."}, status=404)

    # Filter only PRODUCT_OWNER for this workspace
    product_owners = ManagementUser.objects.filter(workspace=workspace, role="PRODUCT_OWNER")

    data = [
        {
            "id": po.id,
            "name": po.name,
            "email": po.email,
            "role": po.role,
            "skills": po.skills,
        }
        for po in product_owners
    ]

    return JsonResponse({"success": True, "productOwners": data}, status=200)
