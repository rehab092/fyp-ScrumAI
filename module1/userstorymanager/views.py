# views.py

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.conf import settings
import secrets
import requests
from django.contrib.auth.hashers import make_password
from assignment_module.models import AdminWorkspace, ManagementUser
from .models import ProductOwner, UserStory, Backlog, Project

import json
import os
import re
import time
import uuid
import openai
from .jwt_utils import generate_jwt_token

# =========================
# OpenAI setup (classic client)
# =========================
openai.api_key = os.getenv("OPENAI_API_KEY")
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
OPENAI_TIMEOUT = int(os.getenv("OPENAI_TIMEOUT", "30"))

# =========================
# Helpers
# =========================
def call_llm(prompt: str, max_tokens: int = 2000, max_retries: int = 2) -> str:
    """Call OpenAI with JSON-only discipline + small retry."""
    system_msg = (
        "You are an Agile decomposition engine. "
        "Return STRICT JSON only. No prose, markdown, or code fences."
    )
    for attempt in range(max_retries):
        try:
            try:
                resp = openai.ChatCompletion.create(
                    model=MODEL_NAME,
                    messages=[
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    max_tokens=max_tokens,
                    response_format={"type": "json_object"},
                    request_timeout=OPENAI_TIMEOUT,
                )
            except TypeError:
                # For older clients that don't support response_format
                resp = openai.ChatCompletion.create(
                    model=MODEL_NAME,
                    messages=[
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    max_tokens=max_tokens,
                    request_timeout=OPENAI_TIMEOUT,
                )
            return resp["choices"][0]["message"]["content"]
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(f"Error communicating with OpenAI: {e}") from e

import re
import json

def sanitize_json(raw: str) -> str:
    """
    Extract valid JSON in a safe and predictable way:
    - Remove ``` fences if present
    - Remove JS comments
    - Normalize smart quotes
    - Trim to outermost JSON object or array
    - Fix trailing commas
    """
    if not raw:
        return ""

    text = raw.strip()

    # -------- FIXED: detect code fences correctly --------
    # Handle cases like: ```json ... ``` or ``` ... ```
    if text.startswith("```"):
        lines = text.splitlines()
        # remove first fence
        lines = lines[1:]
        # remove closing fence if exists
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    # Normalize smart quotes
    text = (
        text.replace("“", '"').replace("”", '"')
            .replace("‘", "'").replace("’", "'")
    )

    # -------- FIXED: comment removal --------
    # Inline comments //
    text = re.sub(r"//.*?$", "", text, flags=re.MULTILINE)
    # Block comments /* ... */
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)

    # Keep only from first JSON opener to last closer
    start = None
    for opener in ("{", "["):
        idx = text.find(opener)
        if idx != -1 and (start is None or idx < start):
            start = idx

    if start is None:
        return text   # nothing better to return

    end = None
    for closer in ("}", "]"):
        idx = text.rfind(closer)
        if idx != -1:
            if end is None:
                end = idx
            else:
                end = max(end, idx)

    if end is None or end < start:
        candidate = text[start:]
    else:
        candidate = text[start:end + 1]

    # Remove trailing commas before ] or }
    candidate = re.sub(r",\s*(\])", r"\1", candidate)
    candidate = re.sub(r",\s*(\})", r"\1", candidate)

    # Final attempt: convert single quotes to double quotes
    try:
        json.loads(candidate)
        return candidate
    except Exception:
        fixed = (
            candidate
            .replace("{'", '{"').replace("':", '":')
            .replace(", '", ', "').replace("'}", '"}')
            .replace("'", '"')
        )
        fixed = re.sub(r",\s*(\])", r"\1", fixed)
        fixed = re.sub(r",\s*(\})", r"\1", fixed)
        return fixed

def parse_or_raise(raw: str) -> dict:
    cleaned = sanitize_json(raw)
    return json.loads(cleaned)


# =========================
# ProductOwner CRUD + Login
# =========================
@csrf_exempt
def product_owner_list(request):
    if request.method == "GET":
        owners = list(ProductOwner.objects.values())
        return JsonResponse(owners, safe=False)
    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def product_owner_create(request):
    if request.method == "POST":
        data = json.loads(request.body)
        plain_password = generate_password(10)
        hashed_password = make_password(plain_password)
        owner = ProductOwner.objects.create(
            name=data["name"],
            email=data["email"],
            password=hashed_password,
            company_name=data["company_name"],
            workspace_id=data.get("workspace_id"),
        )
         #Also add productowner in the management user table 
        management_user = ManagementUser.objects.create(
            name=owner.name,
            email=owner.email,
            role="PRODUCT_OWNER",
            workspace_id=owner.workspace_id
        )
        workspace = AdminWorkspace.objects.get(id=owner.workspace_id)
    # Send EmailJS invitation
    email_sent = send_invitation_email(
        to_email=data["email"],
        name=data["name"],
        role="Product Owner",
        workspace_name=workspace.workspaceName,
        password=plain_password,
    )
    return JsonResponse({"id": owner.id, "workspace_id": owner.workspace_id, "message": "Owner created successfully"})

@csrf_exempt
def product_owner_update(request, pk):
    if request.method == "PUT":
        data = json.loads(request.body)
        try:
            owner = ProductOwner.objects.get(pk=pk)
            owner.name = data.get("name", owner.name)
            owner.email = data.get("email", owner.email)
            owner.password = data.get("password", owner.password)
            owner.company_name = data.get("company_name", owner.company_name)
            # Update workspace_id if provided
            if 'workspace_id' in data:
                owner.workspace_id = data.get('workspace_id')
            owner.save()
            return JsonResponse({"message": "Owner updated successfully"})
        except ProductOwner.DoesNotExist:
            return JsonResponse({"error": "Owner not found"}, status=404)
    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def product_owner_delete(request, pk):
    if request.method == "DELETE":
        try:
            owner = ProductOwner.objects.get(pk=pk)
            owner.delete()
            return JsonResponse({"message": "Owner deleted successfully"})
        except ProductOwner.DoesNotExist:
            return JsonResponse({"error": "Owner not found"}, status=404)
    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def product_owner_login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")
            if not email or not password:
                return JsonResponse({"error": "Email and password are required"}, status=400)
            try:
                owner = ProductOwner.objects.get(email=email)
            except ProductOwner.DoesNotExist:
                return JsonResponse({"error": "Invalid email or password"}, status=401)
            if owner.password != password:
                return JsonResponse({"error": "Invalid email or password"}, status=401)
            
            # Generate JWT token with user's email
            token = generate_jwt_token(email)
            
            return JsonResponse({
                "message": "Login successful", 
                "owner_id": owner.id,
                "token": token,
                "email": email
            }, status=200)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)

# =========================
# Upload & Decompose User Stories (multi-line text)
# =========================
@csrf_exempt
def upload_user_story(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        owner_id   = request.POST.get('owner_id')
        project_id = request.POST.get('project_id')
        role       = request.POST.get('role')
        goal       = request.POST.get('goal')
        benefit    = request.POST.get('benefit')
        stories_tx = (request.POST.get('stories_text') or '').strip()

        if not all([owner_id, project_id, role, benefit]):
            return JsonResponse({'error': 'owner_id, project_id, role, benefit are required.'}, status=400)

        if not stories_tx:
            return JsonResponse({'error': 'stories_text is required (one story per line).'}, status=400)

        owner   = ProductOwner.objects.get(id=owner_id)
        project = Project.objects.get(id=project_id)

        # --- Parse multi-line input (dedupe but keep order) ---
        raw_lines = [ln.strip() for ln in stories_tx.splitlines()]
        seen, story_lines = set(), []
        for ln in raw_lines:
            if ln and ln not in seen:
                seen.add(ln)
                story_lines.append(ln)

        if not story_lines:
            return JsonResponse({'error': 'No valid user stories found.'}, status=400)


        # -------------------------------
        # EXTRACT PRIORITY PER STORY LINE
        # Format expected:
        # "story text | High"
        # -------------------------------
        def split_story_priority(line):
            if "|" in line:
                parts = line.split("|", 1)
                return parts[0].strip(), parts[1].strip()
            return line, "Medium"  # default if not given


        processed_lines = []
        for ln in story_lines:
            story_text, pr = split_story_priority(ln)
            processed_lines.append((ln, story_text, pr))


        # --- Create UserStory rows ---
        user_stories = []  # (UserStory, original_text, seq, priority)
        for seq, (original_full_line, pure_story_text, story_priority) in enumerate(processed_lines, start=1):

            m = re.match(r"As an? ([^,]+), (?:I want )?([^,]+?)(?:, so that |, so )(.+)", pure_story_text, flags=re.IGNORECASE)
            if m:
                story_role, story_goal, story_benefit = m.groups()
            else:
                story_role, story_goal, story_benefit = role, pure_story_text, benefit

            us = UserStory.objects.create(
                owner=owner,
                project=project,
                role=story_role.strip(),
                goal=story_goal.strip(),
                benefit=story_benefit.strip(),
                priority=story_priority,    # <<–– PRIORITY FROM STORY LINE
                project_name=project.name,
            )

            user_stories.append((us, original_full_line, seq, story_priority))


        # --------- PROMPTS (per-story priority) ----------
        def build_block_prompt(lines):
            joined = "\n".join(lines)
            return f"""
Return strictly VALID JSON only. Do NOT include markdown/code fences.

For each non-empty line below (ONE user story per line):
- Each line includes PRIORITY at the end in format: "story text | Priority"
- Extract the priority EXACTLY as it is.
- ECHO THE FULL ORIGINAL LINE EXACTLY AS GIVEN.
- Include "priority" for each story using the extracted value.
- Produce essential developer tasks only.
- Subtasks only when needed.
- Strings <= 120 chars.
- Number tasks as "1","2","3",...

        - For each task include estimated hours (numeric) and required skills as an array of short skill strings.

Input:
{joined}

Output JSON (ONLY):
{{
  "stories": [
    {{
      "story": "EXACT original full line",
      "priority": "PriorityExactlyHere",
                        "tasks": [
                                {{"task_number": "1", "task": "short technical description", "subtasks": ["empty"], "skills": ["skill1"], "estimated_hours": 1.0}}
                        ]
    }}
  ]
}}
""".strip()


        def build_single_prompt(line):
            return f"""
Return strictly VALID JSON only. No markdown.

ECHO THIS FULL LINE EXACTLY:
{line}

Rules:
- Each line contains story + priority using " | Priority".
- Extract priority EXACTLY.
- Include a "priority" field in output.
- Essential tasks only, subtasks only when needed.
- Strings <= 120 chars.

- For each task include estimated hours (numeric) and required skills as an array of short skill strings.

Output:
{{
  "stories": [
    {{
            "story": "{line}",
            "priority": "PriorityHere",
                        "tasks": [
                                {{"task_number": "1", "task": "short technical description", "subtasks": ["empty"], "skills": ["skill1"], "estimated_hours": 1.0}}
                        ]
    }}
  ]
}}
""".strip()


        # --- LLM calls ---
        all_stories = []
        llm_debug = []

        for block in [story_lines[i:i+10] for i in range(0, len(story_lines), 10)]:
            raw = call_llm(build_block_prompt(block), max_tokens=1200)
            try:
                parsed = parse_or_raise(raw)
                llm_debug.append(parsed)
                all_stories.extend(parsed.get("stories", []))
            except json.JSONDecodeError:
                for ln in block:
                    sraw = call_llm(build_single_prompt(ln), max_tokens=800)
                    sp = parse_or_raise(sraw)
                    llm_debug.append(sp)
                    all_stories.extend(sp.get("stories", []))


        # --- Robust mapping: normalize both sides ---
        def norm(s: str) -> str:
            if not s: return ""
            s = s.strip().replace("\r", " ").replace("\n", " ")
            s = s.replace("“","\"").replace("”","\"").replace("’","'").replace("‘","'")
            s = re.sub(r"\s+", " ", s)
            return s


        map_text = {norm(t): (obj, seq, pr) for (obj, t, seq, pr) in user_stories}


        # --- Persist Backlog ---
        tasks_created = 0

        for item in all_stories:
            text = norm(item.get("story") or "")

            pair = map_text.get(text)

            if pair is None:
                for (obj, t, seq, pr) in user_stories:
                    nt = norm(t)
                    if text and (text in nt or nt in text):
                        pair = (obj, seq, pr)
                        break

            if pair is None:
                continue

            us_obj, seq, story_priority = pair

            for idx, task in enumerate(item.get("tasks", []) or [], start=1):
                ttxt = (task.get("task") or "").strip()
                subt = task.get("subtasks", []) or []
                numbered = f"{seq}.{idx} {ttxt}" if ttxt else f"{seq}.{idx}"
                subt_csv = ", ".join(subt) if isinstance(subt, list) and subt else "empty"

                # Extract skills and estimated_hours from LLM output when present
                skills = task.get("skills", [])
                if isinstance(skills, list):
                    skills_csv = ", ".join(map(str, skills)) if skills else ""
                else:
                    skills_csv = str(skills) if skills else ""

                est_hours = task.get("estimated_hours")
                try:
                    est_hours_val = float(est_hours) if est_hours is not None else None
                except Exception:
                    est_hours_val = None

                Backlog.objects.create(
                    project_id=str(project.id),
                    user_story=us_obj,
                    tasks=numbered,
                    subtasks=subt_csv,
                    skills_required=skills_csv,
                    estimated_hours=est_hours_val,
                )
                tasks_created += 1


        return JsonResponse({
            "message": "Processed successfully.",
            "project_id": project_id,
            "stories_created": len(user_stories),
            "tasks_created": tasks_created,
        })

    except ProductOwner.DoesNotExist:
        return JsonResponse({'error': 'Invalid owner ID'}, status=404)
    except Project.DoesNotExist:
        return JsonResponse({'error': 'Invalid project ID'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

@csrf_exempt
def get_tasks_by_user_story(request, user_story_id):
    """Get all tasks + subtasks for a given user story."""
    if request.method == 'GET':
        try:
            story = UserStory.objects.get(id=user_story_id)
            tasks = list(Backlog.objects.filter(user_story=story).values('user_story_id', 'tasks', 'subtasks', 'skills_required', 'estimated_hours'))
            return JsonResponse({'user_story': story.id, 'tasks': tasks})
        except UserStory.DoesNotExist:
            return JsonResponse({'error': 'User story not found'}, status=404)
    return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def update_task(request, task_id):
    """Update a specific task or its subtasks."""
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            backlog = Backlog.objects.get(id=task_id)

            backlog.tasks = data.get('tasks', backlog.tasks)
            backlog.subtasks = data.get('subtasks', backlog.subtasks)

            # Update skills_required (accept list or string)
            if 'skills_required' in data:
                skills_in = data.get('skills_required')
                if isinstance(skills_in, list):
                    backlog.skills_required = ", ".join(map(str, skills_in))
                else:
                    backlog.skills_required = str(skills_in) if skills_in is not None else backlog.skills_required

            # Update estimated_hours if provided and numeric
            if 'estimated_hours' in data:
                try:
                    backlog.estimated_hours = float(data.get('estimated_hours'))
                except Exception:
                    # ignore invalid numeric conversion and keep existing value
                    pass

            backlog.save()

            return JsonResponse({'message': 'Task updated successfully'})
        except Backlog.DoesNotExist:
            return JsonResponse({'error': 'Task not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def delete_task(request, task_id):
    """Delete a specific task/subtask from backlog."""
    if request.method == 'DELETE':
        try:
            backlog = Backlog.objects.get(task_id=task_id)
            backlog.delete()
            return JsonResponse({'message': 'Task deleted successfully'})
        except Backlog.DoesNotExist:
            return JsonResponse({'error': 'Task not found'}, status=404)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def get_all_tasks(request):
    if request.method == 'GET':
        tasks = Backlog.objects.all().values('task_id', 'project_id', 'user_story_id', 'tasks', 'subtasks')
        return JsonResponse(list(tasks), safe=False)
    return JsonResponse({'error': 'Invalid request method'}, status=405)
#delete user stories 

@csrf_exempt
def delete_user_story(request, user_story_id):
    """Delete a UserStory by id."""
    if request.method == 'DELETE':
        try:
            story = UserStory.objects.get(id=user_story_id)
            story.delete()
            return JsonResponse({'message': 'User story deleted successfully'})
        except UserStory.DoesNotExist:
            return JsonResponse({'error': 'User story not found'}, status=404)
    return JsonResponse({'error': 'Invalid request method'}, status=405)
#get all user stories
@csrf_exempt
def get_all_userstories(request):
    """Return all UserStory records as JSON."""
    if request.method == 'GET':
        stories = list(UserStory.objects.all().values(
            'id', 'owner_id', 'role', 'goal', 'benefit', 'priority', 'project_name', 'project_id'
        ))
        return JsonResponse(stories, safe=False)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

#edit userstory
@csrf_exempt
def update_user_story(request, user_story_id):
    """Update a UserStory by id (PUT request)."""
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            story = UserStory.objects.get(id=user_story_id)
            
            story.role = data.get('role', story.role)
            story.goal = data.get('goal', story.goal)
            story.benefit = data.get('benefit', story.benefit)
            story.priority = data.get('priority', story.priority)
            story.project_name = data.get('project_name', story.project_name)
            
            story.save()
            return JsonResponse({'message': 'User story updated successfully'})
        except UserStory.DoesNotExist:
            return JsonResponse({'error': 'User story not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)
 
 
@csrf_exempt
@csrf_exempt
def get_product_owner_by_email(request):
    """
    GET endpoint to find a ProductOwner by email.
    Expects a query parameter email, e.g. /userstorymanager/owner_by_email/?email=user@example.com.
    """
    if request.method == "GET":
        email = request.GET.get("email")
        if not email:
            return JsonResponse({"error": "Email query parameter is required"}, status=400)
        try:
            owner_data = ProductOwner.objects.filter(email=email).values(
                "id", "name", "email", "company_name", "workspace_id", "created_at"
            ).first()
            if not owner_data:
                return JsonResponse({"error": "Owner not found"}, status=404)

            # Convert datetime to ISO string for JSON serialization
            if owner_data.get("created_at"):
                owner_data["created_at"] = owner_data["created_at"].isoformat()

            return JsonResponse(owner_data, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=405)
@csrf_exempt
def project_detail(request, owner):
    """
    Retrieve, update, or delete a Project by primary key.

    Methods supported:
    - GET: return project details
    - PUT: update project fields (expects JSON with name and/or description and/or owner_id)
    - DELETE: delete the project
    """
    try:
        project = Project.objects.get(owner=owner)
    except Project.DoesNotExist:
        return JsonResponse({"error": "Project not found"}, status=404)

    if request.method == "GET":
        data = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "owner_id": project.owner.id if project.owner else None,
        }
        return JsonResponse(data, status=200)

    if request.method == "PUT":
        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        name = payload.get("name")
        description = payload.get("description")
        owner_id = payload.get("owner_id")

        if name is not None:
            project.name = name
        if description is not None:
            project.description = description
        if owner_id is not None:
            try:
                owner = ProductOwner.objects.get(pk=owner_id)
                project.owner = owner
            except ProductOwner.DoesNotExist:
                return JsonResponse({"error": "Owner with provided owner_id does not exist"}, status=400)

        project.save()
        return JsonResponse({"message": "Project updated successfully"}, status=200)

    if request.method == "DELETE":
        project.delete()
        return JsonResponse({"message": "Project deleted successfully"}, status=200)

    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def get_projects_by_owner(request, owner_id):
    """
    GET endpoint to retrieve all projects for a specific owner.
    URL: /userstorymanager/projects/owner/<owner_id>/
    """
    if request.method == "GET":
        try:
            owner = ProductOwner.objects.get(pk=owner_id)
        except ProductOwner.DoesNotExist:
            return JsonResponse({"error": "Owner not found"}, status=404)

        projects = list(Project.objects.filter(owner=owner).values(
            "id", "name", "description"
        ))
        return JsonResponse(projects, safe=False, status=200)
    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def get_all_projects(request):
    """
    GET endpoint to retrieve all projects.
    URL: /userstorymanager/projects/
    """
    if request.method == "GET":
        projects = list(Project.objects.values(
            "id", "name", "description", "owner_id"
        ))
        return JsonResponse(projects, safe=False, status=200)
    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def update_project(request, project_id):
    """
    PUT endpoint to update a project.
    URL: /userstorymanager/project/<project_id>/update/
    Expected JSON: {"name": "...", "description": "...", "owner_id": ...}
    """
    if request.method == "PUT":
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return JsonResponse({"error": "Project not found"}, status=404)

        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        name = payload.get("name")
        description = payload.get("description")
        owner_id = payload.get("owner_id")

        if name is not None:
            project.name = name
        if description is not None:
            project.description = description
        if owner_id is not None:
            try:
                owner = ProductOwner.objects.get(pk=owner_id)
                project.owner = owner
            except ProductOwner.DoesNotExist:
                return JsonResponse({"error": "Owner with provided owner_id does not exist"}, status=400)

        project.save()
        return JsonResponse({"message": "Project updated successfully", "project_id": project.id}, status=200)
    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def delete_project(request, project_id):
    """
    DELETE endpoint to delete a project.
    URL: /userstorymanager/project/<project_id>/delete/
    """
    if request.method == "DELETE":
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return JsonResponse({"error": "Project not found"}, status=404)

        project.delete()
        return JsonResponse({"message": "Project deleted successfully"}, status=200)
    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def create_project(request):
    """
    POST endpoint to create a new project.
    URL: /userstorymanager/project/create/
    Expected JSON: {"owner_id": ..., "name": "...", "description": "..."}
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        owner_id = data.get("owner_id")
        name = data.get("name")
        description = data.get("description", "")

        if not owner_id or not name:
            return JsonResponse({"error": "owner_id and name are required"}, status=400)

        try:
            owner = ProductOwner.objects.get(pk=owner_id)
        except ProductOwner.DoesNotExist:
            return JsonResponse({"error": "Owner not found"}, status=404)

        project = Project.objects.create(
            name=name,
            description=description,
            owner=owner
        )
        return JsonResponse({
            "message": "Project created successfully",
            "project_id": project.id,
            "name": project.name,
            "owner_id": project.owner.id
        }, status=201)
    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def get_project_id_by_name(request):
        """GET endpoint: return project id(s) for a given project name.

        Query parameter: `name` (string)
        - If one project matches (case-insensitive), returns {"project_id": <id>}.
        - If multiple projects match, returns {"project_ids": [<id>, ...]}.
        - If none match, returns 404.
        """
        if request.method != "GET":
            return JsonResponse({"error": "Invalid request method"}, status=405)

        name = request.GET.get("name")
        if not name:
            return JsonResponse({"error": "Query parameter 'name' is required"}, status=400)

        matches = list(Project.objects.filter(name__iexact=name).values("id", "name"))
        if not matches:
            # Try partial case-insensitive contains as a fallback
            matches = list(Project.objects.filter(name__icontains=name).values("id", "name"))

        if not matches:
            return JsonResponse({"error": "Project not found"}, status=404)

        ids = [m["id"] for m in matches]
        if len(ids) == 1:
            return JsonResponse({"project_id": ids[0], "name": matches[0].get("name")}, status=200)
        return JsonResponse({"project_ids": ids, "matches": matches}, status=200)
@csrf_exempt
def get_userstories_by_owner(request, owner_id):
    """
    GET endpoint to retrieve all UserStory records for a specific owner.
    URL: /userstorymanager/userstories/owner/<owner_id>/
    """
    if request.method == "GET":
        try:
            owner = ProductOwner.objects.get(pk=owner_id)
        except ProductOwner.DoesNotExist:
            return JsonResponse({"error": "Owner not found"}, status=404)

        stories = list(UserStory.objects.filter(owner=owner).values(
            "id", "role", "goal", "benefit", "priority", "project_id", "project_name"
        ))
        return JsonResponse(stories, safe=False, status=200)
    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def generate_password(length=10):
    """
    Generate a random password with letters + digits.
    This is what we will email to Scrum Master / PO / Team Member.
    """
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))

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
def get_userstories_by_project(request, project_id):
    """Return all UserStory records for a given project_id."""
    if request.method == 'GET':
        try:
            stories = list(UserStory.objects.filter(project_id=project_id).values(
                'id', 'owner_id', 'role', 'goal', 'benefit', 'priority', 'project_name', 'project_id'
            ))
            return JsonResponse(stories, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=405)