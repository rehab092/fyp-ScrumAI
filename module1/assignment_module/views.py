from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import uuid
from .models import TeamMember, InvitationToken,TaskAssignment
from django.contrib.auth.hashers import make_password, check_password
from .models import AdminWorkspace
import secrets
from .models import AdminWorkspace, TeamMember, ManagementUser, InvitationToken
from userstorymanager.models import ProductOwner
import requests
from django.conf import settings
import pulp  # for ILP optimization (task assignment)
from django.utils import timezone




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

    # 👇 CALL EMAILJS BEFORE RETURN
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

        if check_password(password, user.password):
            workspace = user.workspace

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
                        "role": user.role,        # SCRUM_MASTER / PRODUCT_OWNER
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
    # 3️⃣ TRY PRODUCT OWNER (from userstorymanager app - old system)
    # ------------------------------------------------------
    try:
        owner = ManagementUser.objects.get(email__iexact=email)

        if check_password(password, owner.password):
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
                        "company": getattr(owner, "company_name", ""),
                        "redirectTo": "/product-owner/dashboard",
                    },
                },
                status=200,
            )

    except ManagementUser.DoesNotExist:
        pass

    try:
        owner2 = ProductOwner.objects.get(email__iexact=email)

        if check_password(password, owner2.password):
            return JsonResponse(
                {
                    "success": True,
                    "message": "Login successful.",
                   
                    "user": {
                         "owner_id": owner2.id,
                        "name": getattr(owner2, "name", owner2.email),
                        "email": owner2.email,
                        "role": "PRODUCT_OWNER",
                        "userType": "PRODUCT_OWNER",
                        "company": getattr(owner2, "company_name", ""),
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


# ADD USER BASED ON ROLES LIKE SCRUM MASTER / PRODUCT OWNER
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

    # Workspace validation
    workspace_id = request.headers.get("Workspace-ID") or request.META.get("HTTP_WORKSPACE_ID")
    if not workspace_id:
        return JsonResponse({"success": False, "error": "Workspace-ID header is required."}, status=400)

    try:
        workspace = AdminWorkspace.objects.get(id=workspace_id)
    except AdminWorkspace.DoesNotExist:
        return JsonResponse({"success": False, "error": "Workspace not found."}, status=404)

    # Extract fields
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    role = (data.get("role") or "").strip()  # SCRUM_MASTER / PRODUCT_OWNER

    # Validation for missing fields
    missing = []
    if not name: missing.append("name")
    if not email: missing.append("email")
    if not role: missing.append("role")

    if missing:
        return JsonResponse(
            {"success": False, "error": f"Missing required fields: {', '.join(missing)}"},
            status=400,
        )

    # Role validation
    if role not in ["SCRUM_MASTER", "PRODUCT_OWNER"]:
        return JsonResponse(
            {"success": False, "error": "Invalid role. Use SCRUM_MASTER or PRODUCT_OWNER."},
            status=400,
        )

    # Check duplicate emails across management users
    if ManagementUser.objects.filter(email__iexact=email).exists():
        return JsonResponse(
            {"success": False, "error": "A management user with this email already exists."},
            status=400,
        )

    # Password generation
    plain_password = generate_password(10)
    hashed_password = make_password(plain_password)

    # Create Management User (skills removed)
    user = ManagementUser.objects.create(
        workspace=workspace,
        name=name,
        email=email,
        password=hashed_password,
        role=role,
    )

    # Create invitation token
    token = uuid.uuid4().hex
    invite = InvitationToken.objects.create(
        workspace=workspace,
        email=email,
        token=token,
        role=role,
        is_used=False,
    )

    # Send EmailJS invitation
    email_sent = send_invitation_email(
        to_email=user.email,
        name=user.name,
        role=user.role,
        workspace_name=workspace.workspaceName,
        password=plain_password,
    )

    # Response
    return JsonResponse(
        {
            "success": True,
            "message": "Management user created and invitation generated.",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
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

    # Get workspace ID from header
    workspace_id = request.headers.get("Workspace-ID") or request.META.get("HTTP_WORKSPACE_ID")
    if not workspace_id:
        return JsonResponse({"error": "Workspace-ID header is required."}, status=400)

    try:
        workspace = AdminWorkspace.objects.get(id=workspace_id)
    except AdminWorkspace.DoesNotExist:
        return JsonResponse({"error": "Workspace not found."}, status=404)

    # Filter SCRUM_MASTER for this workspace
    scrum_masters = ManagementUser.objects.filter(workspace=workspace, role="SCRUM_MASTER")

    data = [
        {
            "id": sm.id,
            "name": sm.name,
            "email": sm.email,
            "role": sm.role,
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

    # Filter PRODUCT_OWNER for this workspace
    product_owners = ManagementUser.objects.filter(workspace=workspace, role="PRODUCT_OWNER")

    data = [
        {
            "id": po.id,
            "name": po.name,
            "email": po.email,
            "role": po.role,
        }
        for po in product_owners
    ]

    return JsonResponse({"success": True, "productOwners": data}, status=200)

    ####   assignment helper

# ==========================================================
# UTIL: Read workspace from header
# ==========================================================
def get_workspace_from_request(request):
    workspace_id = request.headers.get("Workspace-ID") or request.META.get("HTTP_WORKSPACE_ID")

    if not workspace_id:
        return None, JsonResponse({"error": "Workspace-ID header is required."}, status=400)

    try:
        workspace = AdminWorkspace.objects.get(id=workspace_id)
    except AdminWorkspace.DoesNotExist:
        return None, JsonResponse({"error": "Workspace not found."}, status=404)

    return workspace, None


# ==========================================================
# 1) SCRUM MASTER — GET UNASSIGNED TASKS
# ==========================================================
@csrf_exempt
def get_unassigned_tasks(request, sprint_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    # Find tasks NOT assigned for this sprint
    assigned_ids = TaskAssignment.objects.filter(
        workspace=workspace,
        sprint_id=sprint_id
    ).values_list("task__task_id", flat=True)

    sprint_items = SprintItem.objects.filter(sprint_id=sprint_id).select_related("task")
    tasks = [item.task for item in sprint_items]


    result = []
    for t in tasks:
        result.append({
            "taskId": t.task_id,
            "title": t.tasks,
            "skillsRequired": t.skills_required,
            "estimatedHours": t.estimated_hours
        })

    return JsonResponse({"success": True, "data": result}, status=200)


# ==========================================================
# 2) SCRUM MASTER — AUTO ASSIGN USING ILP
# ==========================================================
@csrf_exempt
def auto_assign_tasks_ilp(request, sprint_id):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    # Unassigned tasks
    assigned_ids = TaskAssignment.objects.filter(
        workspace=workspace, sprint_id=sprint_id
    ).values_list("task__task_id", flat=True)

    tasks = list(Backlog.objects.filter(sprint_id=sprint_id).exclude(task_id__in=assigned_ids))
    team = list(TeamMember.objects.filter(workspace=workspace))

    if not tasks:
        return JsonResponse({"error": "No unassigned tasks found."}, status=400)
    if not team:
        return JsonResponse({"error": "No team members found."}, status=400)

    # Build ILP optimization model
    model = pulp.LpProblem("TaskAssignment", pulp.LpMaximize)

    # Variables: x_(task,member) = 1 if member assigned to task
    x = {}
    for t in tasks:
        for m in team:
            x[(t.task_id, m.id)] = pulp.LpVariable(f"x_{t.task_id}_{m.id}", 0, 1, pulp.LpBinary)

    # Objective: Maximize skill match - workload overload
    objective = []
    for t in tasks:
        required = []
        if t.skills_required:
            required = [s.strip().lower() for s in t.skills_required.split(",")]

        for m in team:
            member_skills = [s.lower() for s in m.skills] if m.skills else []
            overlap = len(set(required) & set(member_skills))
            score = overlap * 10  # skill weight

            remaining = m.capacityHours - m.assignedHours
            capacity_score = max(remaining, 0)

            objective.append((score * x[(t.task_id, m.id)]) + ((capacity_score/5) * x[(t.task_id, m.id)]))


    model += pulp.lpSum(objective)

    # Constraint: Each task assigned to ONE member
    for t in tasks:
        model += pulp.lpSum([x[(t.task_id, m.id)] for m in team]) == 1

    # Constraint: Developer workload cannot exceed capacity
    for m in team:
        model += pulp.lpSum([
            (t.estimated_hours or 0) * x[(t.task_id, m.id)]
            for t in tasks
        ]) <= (m.capacityHours - m.assignedHours)

    # Solve ILP
    model.solve(pulp.PULP_CBC_CMD(msg=False))

    created_assignments = []
    for t in tasks:
        for m in team:
            if pulp.value(x[(t.task_id, m.id)]) == 1:
                assignment = TaskAssignment.objects.create(
                    workspace=workspace,
                    task=t,
                    member=m,
                    sprint_id=sprint_id,
                    status="SUGGESTED",
                    source="AUTO",
                )
                created_assignments.append({
                    "taskId": t.task_id,
                    "developerId": m.id,
                    "taskTitle": t.tasks,
                    "estimatedHours": t.estimated_hours,
                })

    return JsonResponse({
        "success": True,
        "message": f"{len(created_assignments)} tasks auto-assigned using ILP",
        "assignments": created_assignments
    }, status=201)


# ==========================================================
# 3) SCRUM MASTER — MANUAL ASSIGNMENT
# ==========================================================
@csrf_exempt
def manual_assign_task(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    data = json.loads(request.body)
    task_id = data.get("taskId")
    member_id = data.get("memberId")
    sprint_id = data.get("sprintId")

    if not (task_id and member_id):
        return JsonResponse({"error": "taskId and memberId required"}, status=400)

    try:
        task = Backlog.objects.get(task_id=task_id)
        member = TeamMember.objects.get(id=member_id, workspace=workspace)
    except:
        return JsonResponse({"error": "Task or member not found"}, status=404)

    if member.assignedHours + (task.estimated_hours or 0) > member.capacityHours:
        return JsonResponse({"error": "Developer capacity exceeded"}, status=400)

    assignment = TaskAssignment.objects.create(
        workspace=workspace,
        task=task,
        member=member,
        sprint_id=sprint_id,
        status="SUGGESTED",
        source="MANUAL",
    )

    return JsonResponse({"success": True, "assignment": {
        "taskId": task.task_id,
        "memberId": member.id,
        "status": assignment.status
    }}, status=201)


# ==========================================================
# 4) DEVELOPER — GET PENDING ASSIGNMENTS
# ==========================================================
@csrf_exempt
def get_pending_assignments(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    member_id = request.GET.get("memberId")
    if not member_id:
        return JsonResponse({"error": "memberId required"}, status=400)

    assignments = TaskAssignment.objects.filter(
        workspace=workspace,
        member_id=member_id,
        status="SUGGESTED"
    ).select_related("task")

    result = []
    for a in assignments:
        result.append({
            "assignmentId": a.id,
            "taskTitle": a.task.tasks,
            "estimatedHours": a.task.estimated_hours,
            "source": a.source,
            "suggestedAt": a.suggested_at,
        })

    return JsonResponse({"success": True, "data": result}, status=200)


# ==========================================================
# 5) DEVELOPER — ACCEPT ASSIGNMENT
# ==========================================================
@csrf_exempt
def accept_assignment(request, assignment_id):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    assignment = TaskAssignment.objects.get(id=assignment_id, workspace=workspace)

    if assignment.status != "SUGGESTED":
        return JsonResponse({"error": "Already accepted/rejected"}, status=400)

    member = assignment.member
    estimated = assignment.task.estimated_hours or 0

    if member.assignedHours + estimated > member.capacityHours:
        return JsonResponse({"error": "Capacity exceeded"}, status=409)

    member.assignedHours += estimated
    member.save()

    assignment.status = "ACCEPTED"
    assignment.accepted_at = timezone.now()
    assignment.save()

    return JsonResponse({"success": True, "message": "Accepted"}, status=200)


# ==========================================================
# 6) DEVELOPER — REJECT ASSIGNMENT
# ==========================================================
@csrf_exempt
def reject_assignment(request, assignment_id):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    data = json.loads(request.body)
    reason = data.get("reason", "")

    assignment = TaskAssignment.objects.get(id=assignment_id, workspace=workspace)

    if assignment.status != "SUGGESTED":
        return JsonResponse({"error": "Already accepted/rejected"}, status=400)

    assignment.status = "REJECTED"
    assignment.reason = reason
    assignment.rejected_at = timezone.now()
    assignment.save()

    return JsonResponse({"success": True, "message": "Rejected"}, status=200)


# ==========================================================
# 7) DEVELOPER — MY TASKS
# ==========================================================
@csrf_exempt
def get_my_tasks(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    member_id = request.GET.get("memberId")

    assignments = TaskAssignment.objects.filter(
        workspace=workspace,
        member_id=member_id,
        status="ACCEPTED"
    ).select_related("task")

    data = [{
        "assignmentId": a.id,
        "taskTitle": a.task.tasks,
        "estimatedHours": a.task.estimated_hours,
        "acceptedAt": a.accepted_at
    } for a in assignments]

    return JsonResponse({"success": True, "data": data}, status=200)


# ==========================================================
# 8) PRODUCT OWNER — OVERVIEW
# ==========================================================
@csrf_exempt
def get_sprint_assignment_overview(request, sprint_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    assignments = TaskAssignment.objects.filter(
        workspace=workspace,
        sprint_id=sprint_id
    ).select_related("task", "member")

    result = []
    for a in assignments:
        result.append({
            "taskId": a.task.task_id,
            "taskTitle": a.task.tasks,
            "developer": a.member.name,
            "status": a.status,
            "acceptedAt": a.accepted_at,
            "rejectedAt": a.rejected_at,
            "source": a.source,
            "reason": a.reason
        })

    return JsonResponse({"success": True, "data": result}, status=200)


# ==========================================================
# 9) PRODUCT OWNER — SPRINT SUMMARY
# ==========================================================
@csrf_exempt
def get_sprint_summary(request, sprint_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    members = TeamMember.objects.filter(workspace=workspace)

    result = []
    for m in members:
        assigned = TaskAssignment.objects.filter(
            workspace=workspace,
            sprint_id=sprint_id,
            member=m,
            status="ACCEPTED",
        ).select_related("task")

        total_hours = sum(a.task.estimated_hours or 0 for a in assigned)

        result.append({
            "developer": m.name,
            "capacity": m.capacityHours,
            "assigned": total_hours
        })

    return JsonResponse({"success": True, "summary": result}, status=200)



@csrf_exempt
def get_my_notifications(request):
    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    email = request.GET.get("email")
    if not email:
        return JsonResponse({"error": "email is required"}, status=400)

    notifs = Notification.objects.filter(
        workspace=workspace,
        user_email=email
    ).order_by("-created_at")

    data = [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "isRead": n.is_read,
        "createdAt": n.created_at.isoformat()
    } for n in notifs]

    return JsonResponse({"success": True, "data": data}, status=200)


@csrf_exempt
def mark_notifications_read(request):
    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    data = json.loads(request.body)
    email = data.get("email")

    Notification.objects.filter(
        workspace=workspace,
        user_email=email,
        is_read=False
    ).update(is_read=True)

    return JsonResponse({"success": True})



@csrf_exempt
def get_all_assignments(request, sprint_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    # Get all sprint items (tasks inside that sprint)
    sprint_items = SprintItem.objects.filter(
        sprint_id=sprint_id,
        sprint__workspace=workspace
    ).select_related("task")

    task_ids = [item.task.id for item in sprint_items]

    # Get all assignments for those tasks
    assignments = TaskAssignment.objects.filter(
        workspace=workspace,
        sprint_id=sprint_id,
        task_id__in=task_ids
    ).select_related("task", "member")

    result = []

    for a in assignments:
        result.append({
            "assignmentId": a.id,
            "taskId": a.task.task_id,
            "taskTitle": a.task.tasks,
            "developer": a.member.name,
            "developerId": a.member.id,
            "status": a.status,
            "source": a.source,
            "matchScore": a.match_score,
            "reason": a.reason,
            "suggestedAt": a.suggested_at,
            "acceptedAt": a.accepted_at,
            "rejectedAt": a.rejected_at,
        })

    return JsonResponse({"success": True, "assignments": result}, status=200)


@csrf_exempt
def get_my_suggestions(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET method required"}, status=400)

    workspace, error_response = get_workspace_from_request(request)
    if error_response:
        return error_response

    member_id = request.GET.get("memberId")
    if not member_id:
        return JsonResponse({"error": "memberId query parameter is required."}, status=400)

    # Validate developer exists inside workspace
    try:
        member = TeamMember.objects.get(id=member_id, workspace=workspace)
    except TeamMember.DoesNotExist:
        return JsonResponse({"error": "Team member not found in this workspace."}, status=404)

    # Suggested assignments for this member
    assignments = TaskAssignment.objects.filter(
        workspace=workspace,
        member=member,
        status="SUGGESTED",
    ).select_related("task").order_by("-suggested_at")

    result = []
    for a in assignments:
        result.append({
            "assignmentId": a.id,
            "taskId": a.task.task_id,
            "taskTitle": a.task.tasks,
            "estimatedHours": a.task.estimated_hours,
            "sprintId": a.sprint_id,
            "status": a.status,
            "source": a.source,
            "matchScore": a.match_score,
            "reason": a.reason,
            "suggestedAt": a.suggested_at.isoformat(),
        })

    return JsonResponse({"success": True, "data": result}, status=200)


@csrf_exempt
def get_pending_assignments(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    workspace, error = get_workspace_from_request(request)
    if error:
        return error

    member_id = request.GET.get("memberId")
    if not member_id:
        return JsonResponse({"error": "memberId required"}, status=400)

    assignments = TaskAssignment.objects.filter(
        workspace=workspace,
        member_id=member_id,
        status="SUGGESTED"
    ).select_related("task")

    result = []
    for a in assignments:
        result.append({
            "assignmentId": a.id,
            "taskTitle": a.task.tasks,
            "estimatedHours": a.task.estimated_hours,
            "source": a.source,
            "suggestedAt": a.suggested_at.isoformat(),
        })

    return JsonResponse({"success": True, "data": result}, status=200)

