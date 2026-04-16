# views.py

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.conf import settings
import secrets
import requests
from django.contrib.auth.hashers import make_password
from assignment_module.models import AdminWorkspace, ManagementUser
from .models import ProductOwner, UserStory, Backlog, Project, SprintAssignment
from sprintmanager.models import Sprint, SprintItem

import json
import os
import re
import time
import uuid
from openai import OpenAI
from .jwt_utils import generate_jwt_token

# =========================
# OpenAI setup (v1.0.0+)
# =========================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
OPENAI_TIMEOUT = int(os.getenv("OPENAI_TIMEOUT", "30"))

# Initialize the new OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# =========================
# Helpers
# =========================
def call_llm(prompt: str, max_tokens: int = 2000, max_retries: int = 2) -> str:
    """Call OpenAI with JSON-only discipline + small retry."""
    if not client:
        raise RuntimeError("OpenAI API key not configured. Set OPENAI_API_KEY environment variable.")
    
    system_msg = (
        "You are an Agile decomposition engine. "
        "Return STRICT JSON only. No prose, markdown, or code fences."
    )
    for attempt in range(max_retries):
        try:
            # Try with JSON mode first (requires gpt-4-turbo or newer)
            try:
                resp = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    max_tokens=max_tokens,
                    response_format={"type": "json_object"},
                    timeout=OPENAI_TIMEOUT,
                )
            except TypeError:
                # Fall back if response_format not supported
                resp = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    max_tokens=max_tokens,
                    timeout=OPENAI_TIMEOUT,
                )
            return resp.choices[0].message.content
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
        owners = list(ManagementUser.objects.filter(role='PRODUCT_OWNER').values('id', 'name', 'email', 'workspace_id'))
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
            owner = ManagementUser.objects.get(pk=pk, role='PRODUCT_OWNER')
            owner.name = data.get("name", owner.name)
            owner.email = data.get("email", owner.email)
            owner.password = data.get("password", owner.password)
            # Update workspace_id if provided
            if 'workspace_id' in data:
                owner.workspace_id = data.get('workspace_id')
            owner.save()
            return JsonResponse({"message": "Owner updated successfully"})
        except ManagementUser.DoesNotExist:
            return JsonResponse({"error": "Owner not found"}, status=404)
    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def product_owner_delete(request, pk):
    if request.method == "DELETE":
        try:
            owner = ManagementUser.objects.get(pk=pk, role='PRODUCT_OWNER')
            owner.delete()
            return JsonResponse({"message": "Owner deleted successfully"})
        except ManagementUser.DoesNotExist:
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
                owner = ManagementUser.objects.get(email=email, role='PRODUCT_OWNER')
            except ManagementUser.DoesNotExist:
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

        # Validate owner exists
        try:
            owner = ManagementUser.objects.get(id=owner_id, role='PRODUCT_OWNER')
        except ManagementUser.DoesNotExist:
            return JsonResponse({'error': 'Owner not found'}, status=404)
        
        project = Project.objects.get(id=project_id)
        
        # Get the ProductOwner linked to this project
        product_owner = project.owner
        if not product_owner:
            return JsonResponse({'error': 'Project has no linked ProductOwner'}, status=400)

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
                owner=product_owner,
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
You are an Agile story decomposition expert. Return ONLY valid JSON, NO markdown or code blocks.

CRITICAL RULES:
1. Extract priority from format "story | Priority" - MUST be one of: High, Medium, Low
2. For EVERY task, MUST include: task_number (string), task (short string <=100 chars), subtasks (array of strings), skills (array), estimated_hours (number)
3. Subtasks should be realistic technical steps needed to complete the task
4. Skills must be specific technical skills like: Backend, Frontend, Database, API, Testing, Docs, etc.
5. estimated_hours MUST be a number (integer or decimal): 1, 2.5, 4, 6, 8, 12, 20 etc
6. Generate 3-5 essential tasks per story
7. ECHO the EXACT original line as "story" field

Stories to decompose:
{joined}

You MUST return valid JSON in this exact format - no escaping, no markdown:
{{
  "stories": [
    {{
      "story": "EXACT original line here",
      "priority": "High",
      "tasks": [
        {{"task_number": "1", "task": "Setup backend API endpoint", "subtasks": ["Create route", "Add validation", "Write tests"], "skills": ["Backend", "API"], "estimated_hours": 4}},
        {{"task_number": "2", "task": "Create database schema", "subtasks": ["Design tables", "Add indexes", "Migration"], "skills": ["Database"], "estimated_hours": 6}},
        {{"task_number": "3", "task": "Build frontend UI component", "subtasks": ["Design layout", "Write JSX", "Add styling"], "skills": ["Frontend", "React"], "estimated_hours": 5}}
      ]
    }}
  ]
}}
"""


        def build_single_prompt(line):
            return f"""
You are an Agile story decomposition expert. Return ONLY valid JSON, NO markdown or code blocks.

CRITICAL RULES:
1. Extract priority from format "story | Priority" - MUST be one of: High, Medium, Low
2. For EVERY task, MUST include: task_number (string), task (short string <=100 chars), subtasks (array of strings), skills (array), estimated_hours (number)
3. Subtasks should be realistic technical steps needed to complete the task
4. Skills must be specific: Backend, Frontend, Database, API, Testing, Docs, DevOps, etc.
5. estimated_hours MUST be a number (integer or decimal): 1, 2.5, 4, 6, 8, 12, 20 etc
6. Generate 3-5 essential tasks for this story
7. ECHO the story line EXACTLY as given

Story to decompose:
{line}

You MUST return valid JSON in this exact format:
{{
  "stories": [
    {{
      "story": "{line}",
      "priority": "High",
      "tasks": [
        {{"task_number": "1", "task": "Task description", "subtasks": ["Step 1", "Step 2"], "skills": ["Skill1"], "estimated_hours": 4}},
        {{"task_number": "2", "task": "Task 2 description", "subtasks": ["Step A", "Step B"], "skills": ["Skill2"], "estimated_hours": 6}}
      ]
    }}
  ]
}}
"""


        # --- LLM calls ---
        all_stories = []
        llm_debug = []
        llm_errors = []
        llm_raw_responses = []  # Store raw responses for debugging

        for block in [story_lines[i:i+10] for i in range(0, len(story_lines), 10)]:
            try:
                raw = call_llm(build_block_prompt(block), max_tokens=1200)
                llm_raw_responses.append(raw[:300])  # Store first 300 chars
                
                try:
                    parsed = parse_or_raise(raw)
                    stories_in_response = parsed.get("stories", [])
                    
                    # Log detailed info about each story
                    for story_item in stories_in_response:
                        task_count = len(story_item.get("tasks", []))
                        task_hours = sum(t.get("estimated_hours", 0) or 0 for t in story_item.get("tasks", []))
                        llm_debug.append({
                            "story": story_item.get("story", "")[:50],
                            "priority": story_item.get("priority"),
                            "tasks": task_count,
                            "total_hours": task_hours,
                            "has_skills": all(t.get("skills") for t in story_item.get("tasks", []))
                        })
                    
                    all_stories.extend(stories_in_response)
                    
                except json.JSONDecodeError as je:
                    llm_errors.append(f"JSON parse error: {str(je)[:100]}, raw: {raw[:100]}")
                    # Fallback: process line by line
                    for ln in block:
                        try:
                            sraw = call_llm(build_single_prompt(ln), max_tokens=800)
                            sp = parse_or_raise(sraw)
                            all_stories.extend(sp.get("stories", []))
                        except Exception as se:
                            llm_errors.append(f"Single line error: {str(se)[:100]}")
            except Exception as e:
                llm_errors.append(f"LLM block error: {str(e)[:100]}")


        # --- Robust mapping: normalize both sides ---
        def norm(s: str) -> str:
            if not s: return ""
            s = s.strip().replace("\r", " ").replace("\n", " ")
            s = s.replace("“","\"").replace("”","\"").replace("’","'").replace("‘","'")
            s = re.sub(r"\s+", " ", s)
            return s


        # Create mapping: story_text -> (UserStory object, seq, priority, story_points from LLM)
        map_text = {norm(t): (obj, seq, pr) for (obj, t, seq, pr) in user_stories}


        # --- Persist Backlog & Calculate Story Points ---
        tasks_created = 0
        story_hours_tracking = {}  # Track total hours per story_id

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

            # Initialize hours tracking for this story if not exists
            if us_obj.id not in story_hours_tracking:
                story_hours_tracking[us_obj.id] = 0

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
                    est_hours_val = float(est_hours) if est_hours is not None else 0
                except Exception:
                    est_hours_val = 0

                # Accumulate hours for this story
                story_hours_tracking[us_obj.id] += est_hours_val

                Backlog.objects.create(
                    project_id=str(project.id),
                    user_story=us_obj,
                    tasks=numbered,
                    subtasks=subt_csv,
                    skills_required=skills_csv,
                    estimated_hours=est_hours_val,
                )
                tasks_created += 1

        # --- Update UserStory with story_points = sum of all task hours ---
        for us in user_stories:
            us_obj = us[0]
            total_hours = story_hours_tracking.get(us_obj.id, 0)
            us_obj.story_points = int(total_hours) if total_hours else 0
            us_obj.save()


        # Build comprehensive summary for each story
        story_points_summary = []
        for us in user_stories:
            us_obj = us[0]
            total_hours = story_hours_tracking.get(us_obj.id, 0)
            
            # Get all tasks for this story to extract skills
            story_tasks = list(Backlog.objects.filter(user_story=us_obj).values(
                'tasks', 'subtasks', 'skills_required', 'estimated_hours'
            ))
            
            # Aggregate skills
            all_skills = set()
            for task in story_tasks:
                if task.get('skills_required'):
                    skills = [s.strip() for s in task['skills_required'].split(',') if s.strip()]
                    all_skills.update(skills)
            
            story_points_summary.append({
                "story_id": us_obj.id,
                "title": us_obj.goal,
                "role": us_obj.role,
                "benefit": us_obj.benefit,
                "priority": us_obj.priority,
                "status": "Ready",
                "story_points": us_obj.story_points or 0,
                "total_estimated_hours": total_hours,
                "required_skills": sorted(list(all_skills)),
                "task_count": len(story_tasks),
                "tasks": story_tasks
            })

        return JsonResponse({
            "status": "success",
            "message": "User stories processed successfully",
            "project_id": project_id,
            "stories_created": len(user_stories),
            "tasks_created": tasks_created,
            "llm_stories_processed": len(all_stories),
            "stories": story_points_summary,  # Full details of created stories
            "summary": {
                "total_story_points": sum(s.get("story_points", 0) for s in story_points_summary),
                "total_hours": sum(s.get("total_estimated_hours", 0) for s in story_points_summary),
                "unique_skills": sorted(list(set(s for story in story_points_summary for s in story.get("required_skills", []))))
            },
            "debug": {
                "llm_calls": len(llm_debug),
                "llm_errors": llm_errors if llm_errors else [],
                "llm_debug_info": llm_debug,
                "raw_llm_samples": llm_raw_responses[:2] if llm_raw_responses else [],  # First 2 raw responses
                "input_stories": story_lines,  # Show what we sent to LLM
                "parsed_stories_from_llm": len(all_stories),  # How many stories LLM parsed
                "tasks_per_story": sum(len(s.get("tasks", [])) for s in all_stories),
            }
        })

    except ProductOwner.DoesNotExist:
        return JsonResponse({'error': 'Invalid owner ID'}, status=404)
    except Project.DoesNotExist:
        return JsonResponse({'error': 'Invalid project ID'}, status=404)
    except Exception as e:
        import traceback
        return JsonResponse({
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=500)
    

@csrf_exempt
def create_story_with_llm(request):
    """
    Create a single user story with LLM decomposition.
    Accepts JSON POST with: owner_id, project_id, role, goal, benefit, priority
    Returns: UserStory with story_points and tasks created from LLM
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        data = json.loads(request.body)
        
        owner_id = data.get('owner_id')
        project_id = data.get('project_id')
        role = data.get('role', '').strip()
        goal = data.get('goal', '').strip()
        benefit = data.get('benefit', '').strip()
        priority = data.get('priority', 'Medium').strip()

        if not all([owner_id, project_id, role, goal, benefit]):
            return JsonResponse({
                'error': 'owner_id, project_id, role, goal, and benefit are required.'
            }, status=400)

        # Validate owner exists
        try:
            owner = ManagementUser.objects.get(id=owner_id, role='PRODUCT_OWNER')
        except ManagementUser.DoesNotExist:
            return JsonResponse({'error': 'Owner not found'}, status=404)

        # Get project
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return JsonResponse({'error': 'Project not found'}, status=404)

        # Get the ProductOwner linked to this project
        product_owner = project.owner
        if not product_owner:
            return JsonResponse({'error': 'Project has no linked ProductOwner'}, status=400)

        # Create the UserStory
        us = UserStory.objects.create(
            owner=product_owner,
            project=project,
            role=role,
            goal=goal,
            benefit=benefit,
            priority=priority,
            project_name=project.name,
        )

        # Format story as text for LLM (same format as create_backlog)
        story_text = goal  # Use goal as the story line
        if priority and priority != 'Medium':
            story_text = f"{story_text} | {priority}"

        # Call LLM to decompose this single story
        llm_errors = []
        all_stories = []
        tasks_created = 0
        story_hours_tracking = {}

        try:
            prompt = f"""
You are an Agile story decomposition expert. Return ONLY valid JSON, NO markdown or code blocks.

CRITICAL RULES:
1. For EVERY task, MUST include: task_number (string), task (short string <=100 chars), subtasks (array of strings), skills (array), estimated_hours (number)
2. Subtasks should be realistic technical steps needed to complete the task
3. Skills must be specific: Backend, Frontend, Database, API, Testing, Docs, DevOps, etc.
4. estimated_hours MUST be a number (integer or decimal): 1, 2.5, 4, 6, 8, 12, 20 etc
5. Generate 3-5 essential tasks for this story
6. ECHO the story line EXACTLY as given

Story to decompose:
{story_text}

You MUST return valid JSON in this exact format:
{{
  "stories": [
    {{
      "story": "{story_text}",
      "priority": "{priority}",
      "tasks": [
        {{"task_number": "1", "task": "Task description", "subtasks": ["Step 1", "Step 2"], "skills": ["Skill1"], "estimated_hours": 4}},
        {{"task_number": "2", "task": "Task 2 description", "subtasks": ["Step A", "Step B"], "skills": ["Skill2"], "estimated_hours": 6}},
        {{"task_number": "3", "task": "Task 3", "subtasks": ["Part 1"], "skills": ["Skill3"], "estimated_hours": 5}}
      ]
    }}
  ]
}}
"""
            
            raw = call_llm(prompt, max_tokens=1000)
            parsed = parse_or_raise(raw)
            all_stories = parsed.get("stories", [])

            if all_stories:
                for story_item in all_stories:
                    tasks_list = story_item.get("tasks", [])
                    for idx, task in enumerate(tasks_list, start=1):
                        ttxt = (task.get("task") or "").strip()
                        subt = task.get("subtasks", []) or []
                        numbered = f"1.{idx} {ttxt}" if ttxt else f"1.{idx}"
                        subt_csv = ", ".join(subt) if isinstance(subt, list) and subt else "empty"

                        # Extract skills and hours
                        skills = task.get("skills", [])
                        skills_csv = ", ".join(map(str, skills)) if isinstance(skills, list) else str(skills)

                        est_hours = task.get("estimated_hours", 0)
                        try:
                            est_hours_val = float(est_hours) if est_hours is not None else 0
                        except:
                            est_hours_val = 0

                        story_hours_tracking[us.id] = story_hours_tracking.get(us.id, 0) + est_hours_val

                        Backlog.objects.create(
                            project_id=str(project.id),
                            user_story=us,
                            tasks=numbered,
                            subtasks=subt_csv,
                            skills_required=skills_csv,
                            estimated_hours=est_hours_val,
                        )
                        tasks_created += 1
            else:
                # Fallback: create default task with 8 hours
                llm_errors.append("NO_LLM_OUTPUT: Using fallback with default task (8 hours)")
                Backlog.objects.create(
                    project_id=str(project.id),
                    user_story=us,
                    tasks="1.1 " + goal[:80],
                    subtasks="Design, Implementation, Testing",
                    skills_required="Backend, API, Testing",
                    estimated_hours=8.0,
                )
                story_hours_tracking[us.id] = 8.0
                tasks_created = 1

        except Exception as e:
            llm_errors.append(f"LLM error: {str(e)[:100]}")
            # Still create fallback tasks
            Backlog.objects.create(
                project_id=str(project.id),
                user_story=us,
                tasks="1.1 " + goal[:80],
                subtasks="Design, Implementation, Testing",
                skills_required="Backend, API, Testing",
                estimated_hours=8.0,
            )
            story_hours_tracking[us.id] = 8.0
            tasks_created = 1

        # Update story with story_points
        total_hours = story_hours_tracking.get(us.id, 0)
        us.story_points = int(total_hours) if total_hours else 0
        us.save()

        # Get all tasks for response
        story_tasks = list(Backlog.objects.filter(user_story=us).values(
            'tasks', 'subtasks', 'skills_required', 'estimated_hours'
        ))

        # Aggregate skills
        all_skills = set()
        for task in story_tasks:
            if task.get('skills_required'):
                skills = [s.strip() for s in task['skills_required'].split(',') if s.strip()]
                all_skills.update(skills)

        return JsonResponse({
            "status": "success",
            "message": "User story created with LLM decomposition",
            "story_id": us.id,
            "title": us.goal,
            "role": us.role,
            "benefit": us.benefit,
            "priority": us.priority,
            "story_points": us.story_points,
            "total_estimated_hours": total_hours,
            "required_skills": sorted(list(all_skills)),
            "task_count": tasks_created,
            "tasks": story_tasks,
            "debug": {
                "llm_errors": llm_errors if llm_errors else [],
                "parsed_stories_from_llm": len(all_stories),
            }
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        import traceback
        return JsonResponse({
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=500)


@csrf_exempt
@csrf_exempt
def get_tasks_by_user_story(request, user_story_id):
    """Get all tasks + subtasks for a given user story, including aggregated skills."""
    if request.method == 'GET':
        try:
            story = UserStory.objects.get(id=user_story_id)
            tasks = list(Backlog.objects.filter(user_story=story).values('id', 'tasks', 'subtasks', 'skills_required', 'estimated_hours'))
            
            # Aggregate all unique skills from tasks
            all_skills = set()
            for task in tasks:
                if task.get('skills_required'):
                    # skills_required is a CSV string like "Backend, API, Testing"
                    skills = [s.strip() for s in task['skills_required'].split(',')]
                    all_skills.update(skills)
            
            # Aggregate total hours
            total_hours = sum(task.get('estimated_hours', 0) or 0 for task in tasks)
            
            return JsonResponse({
                'user_story_id': story.id,
                'title': story.goal,
                'role': story.role,
                'benefit': story.benefit,
                'priority': story.priority,
                'story_points': story.story_points,
                'status': story.status if hasattr(story, 'status') else 'Not Started',
                'total_estimated_hours': total_hours,
                'required_skills': sorted(list(all_skills)),  # Array of unique skills
                'tasks': tasks,
                'task_count': len(tasks)
            })
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
def update_task_status(request, task_id):
    """Update backlog task status to pending, In Progress, or Completed."""
    if request.method not in ['PUT', 'PATCH']:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    status_in = data.get('status')
    if status_in is None:
        return JsonResponse({'error': 'status is required'}, status=400)

    status_map = {
        'pending': Backlog.STATUS_PENDING,
        'in progress': Backlog.STATUS_IN_PROGRESS,
        'completed': Backlog.STATUS_COMPLETED,
    }

    normalized = str(status_in).strip().lower()
    if normalized not in status_map:
        return JsonResponse(
            {'error': 'Invalid status. Allowed values: pending, In Progress, Completed'},
            status=400
        )

    try:
        backlog = Backlog.objects.get(task_id=task_id)
    except Backlog.DoesNotExist:
        return JsonResponse({'error': 'Task not found'}, status=404)

    backlog.status = status_map[normalized]
    backlog.save(update_fields=['status'])

    return JsonResponse({
        'message': 'Task status updated successfully',
        'task_id': backlog.task_id,
        'status': backlog.status,
    })


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
@csrf_exempt
def delete_user_story(request, user_story_id):
    """Delete a UserStory by id."""
    if request.method == 'DELETE':
        try:
            story = UserStory.objects.get(id=user_story_id)
            
            # Manually delete all related Backlog tasks first (to avoid CASCADE issues)
            try:
                Backlog.objects.filter(user_story=story).delete()
            except Exception as e:
                # If Backlog deletion fails, continue anyway
                print(f"Warning: Failed to delete Backlog entries: {str(e)}")
            
            # Now delete the UserStory
            story.delete()
            return JsonResponse({'message': 'User story deleted successfully'})
        except UserStory.DoesNotExist:
            return JsonResponse({'error': 'User story not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': f'Failed to delete: {str(e)}'}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=405)
#get all user stories
@csrf_exempt
@csrf_exempt
def get_all_userstories(request):
    """Return all UserStory records as JSON or create a new one."""
    if request.method == 'GET':
        stories = list(UserStory.objects.all().values(
            'id', 'owner_id', 'role', 'goal', 'benefit', 'priority', 'project_name', 'project_id', 'story_points'
        ))
        return JsonResponse(stories, safe=False)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validate required fields
            required_fields = ['owner_id', 'role', 'goal', 'benefit', 'priority', 'project_name']
            for field in required_fields:
                if field not in data or not data[field]:
                    return JsonResponse({'error': f'{field} is required'}, status=400)
            
            # Get or create project if project_id provided
            project = None
            product_owner = None
            if data.get('project_id'):
                try:
                    project = Project.objects.get(id=data['project_id'])
                    # Get ProductOwner from project
                    product_owner = project.owner
                except Project.DoesNotExist:
                    pass
            
            # If no product_owner from project, try to get from owner_id (ManagementUser)
            if not product_owner:
                try:
                    owner = ManagementUser.objects.get(id=data['owner_id'], role='PRODUCT_OWNER')
                    workspace = owner.workspace
                    product_owner = ProductOwner.objects.filter(workspace=workspace).first()
                except ManagementUser.DoesNotExist:
                    pass
            
            if not product_owner:
                return JsonResponse({'error': 'Unable to determine ProductOwner for story'}, status=400)
            
            # Create the user story
            story = UserStory.objects.create(
                owner=product_owner,
                role=data['role'],
                goal=data['goal'],
                benefit=data['benefit'],
                priority=data['priority'],
                project_name=data['project_name'],
                project=project if project else None
            )
            
            return JsonResponse({
                'id': story.id,
                'owner_id': story.owner_id,
                'role': story.role,
                'goal': story.goal,
                'benefit': story.benefit,
                'priority': story.priority,
                'project_name': story.project_name,
                'project_id': story.project_id if project else None,
                'message': 'User story created successfully'
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

#edit userstory
@csrf_exempt
def update_user_story(request, user_story_id):
    """Update a UserStory by id (PUT request)."""
    if request.method == 'PUT':
        try:
            # Parse request body
            if not request.body:
                return JsonResponse({'error': 'Request body is empty'}, status=400)
            
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError as e:
                return JsonResponse({'error': f'Invalid JSON: {str(e)}'}, status=400)
            
            # Get the story
            try:
                story = UserStory.objects.get(id=user_story_id)
            except UserStory.DoesNotExist:
                return JsonResponse({'error': f'User story with id {user_story_id} not found'}, status=404)
            
            # Update fields
            if 'role' in data:
                story.role = data['role']
            if 'goal' in data:
                story.goal = data['goal']
            if 'benefit' in data:
                story.benefit = data['benefit']
            if 'priority' in data:
                story.priority = data['priority']
            if 'project_name' in data:
                story.project_name = data['project_name']
            
            story.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'User story updated successfully',
                'id': story.id,
                'role': story.role,
                'goal': story.goal,
                'benefit': story.benefit,
                'priority': story.priority
            }, status=200)
        except Exception as e:
            import traceback
            print(f"Error in update_user_story: {e}")
            print(traceback.format_exc())
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method. Expected PUT'}, status=405)
 
 
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
            owner_data = ManagementUser.objects.filter(email=email, role='PRODUCT_OWNER').values(
                "id", "name", "email", "workspace_id", "createdAt"
            ).first()
            if not owner_data:
                return JsonResponse({"error": "Owner not found"}, status=404)

            # Convert datetime to ISO string for JSON serialization
            if owner_data.get("createdAt"):
                owner_data["createdAt"] = owner_data["createdAt"].isoformat()

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
        project = Project.objects.get(owner_id=owner)
    except Project.DoesNotExist:
        return JsonResponse({"error": "Project not found"}, status=404)

    if request.method == "GET":
        data = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "owner_id": project.owner_id,
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
                owner_obj = ManagementUser.objects.get(pk=owner_id, role='PRODUCT_OWNER')
                project.owner_id = owner_id
            except ManagementUser.DoesNotExist:
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
    Filters projects by workspace that owns this ManagementUser
    """
    if request.method == "GET":
        try:
            owner = ManagementUser.objects.get(pk=owner_id, role='PRODUCT_OWNER')
        except ManagementUser.DoesNotExist:
            return JsonResponse({"error": "Owner not found"}, status=404)

        # Get the workspace this owner belongs to
        if not owner.workspace:
            return JsonResponse([], safe=False, status=200)
        
        # Filter projects by workspace (strict - only for this workspace)
        projects = Project.objects.filter(workspace_id=owner.workspace_id)
        
        project_list = []
        for p in projects:
            project_list.append({
                "id": p.id,
                "name": p.name,
                "description": p.description or "",
                "workspace_id": p.workspace_id
            })
        
        return JsonResponse(project_list, safe=False, status=200)
    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def get_projects_by_workspace(request, workspace_id):
    """
    GET endpoint to retrieve all projects for a specific workspace.
    URL: /userstorymanager/projects/workspace/<workspace_id>/
    """
    if request.method == "GET":
        try:
            workspace = AdminWorkspace.objects.get(pk=workspace_id)
        except AdminWorkspace.DoesNotExist:
            return JsonResponse({"error": "Workspace not found"}, status=404)

        projects = list(Project.objects.filter(workspace_id=workspace_id).values(
            "id", "name", "description", "owner_id"
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
                owner = ManagementUser.objects.get(pk=owner_id, role='PRODUCT_OWNER')
                project.owner_id = owner_id
            except ManagementUser.DoesNotExist:
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
    Expected JSON: {"owner_id": ..., "name": "...", "description": "...", "start_date": "YYYY-MM-DD"}
    Creates project linked to a ProductOwner in the same workspace
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        owner_id = data.get("owner_id")
        name = data.get("name")
        description = data.get("description", "")
        start_date = data.get("start_date")  # Optional: "YYYY-MM-DD" format

        # Validation
        if not owner_id or not name:
            return JsonResponse({"error": "owner_id and name are required"}, status=400)

        try:
            owner = ManagementUser.objects.get(pk=owner_id, role='PRODUCT_OWNER')
        except ManagementUser.DoesNotExist:
            return JsonResponse({"error": "Owner not found"}, status=404)

        if not owner.workspace:
            return JsonResponse({"error": "Owner must be assigned to a workspace"}, status=400)

        # Validate start_date format if provided
        parsed_start_date = None
        if start_date:
            try:
                from datetime import datetime
                # Parse the date string (format: YYYY-MM-DD)
                parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            except ValueError as e:
                return JsonResponse({
                    "error": f"Invalid date format. Use YYYY-MM-DD format. Error: {str(e)}"
                }, status=400)

        # Get or create ProductOwner for this workspace
        workspace = owner.workspace
        product_owner = ProductOwner.objects.filter(workspace=workspace).first()
        
        if not product_owner:
            # Create a ProductOwner for this workspace if it doesn't exist
            product_owner = ProductOwner.objects.create(
                name=f"PO - {owner.name}",
                email=f"po-{workspace.id}@scrumai.local",
                password="temp",
                company_name=workspace.companyName or "Company",
                workspace=workspace
            )

        # Create project linked to the ProductOwner and with workspace_id
        project_data = {
            "name": name,
            "description": description,
            "owner": product_owner,
            "workspace_id": workspace.id
        }
        
        # Add parsed start_date if provided
        if parsed_start_date:
            project_data["start_date"] = parsed_start_date
        
        try:
            project = Project.objects.create(**project_data)
        except Exception as e:
            return JsonResponse({"error": f"Failed to create project: {str(e)}"}, status=500)
        
        # Format response - start_date is now a date object after Django saves it
        response_data = {
            "status": "success",
            "message": "Project created successfully",
            "project_id": project.id,
            "name": project.name,
            "description": project.description,
            "owner_id": product_owner.id,
            "workspace_id": project.workspace_id,
            "start_date": project.start_date.isoformat() if project.start_date else None
        }
        
        return JsonResponse(response_data, status=201)
    
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
    
    This endpoint accepts a ManagementUser ID and returns all UserStories 
    linked to the ProductOwner in that ManagementUser's workspace.
    """
    if request.method == "GET":
        try:
            # Get the ManagementUser (auth user)
            management_user = ManagementUser.objects.get(pk=owner_id, role='PRODUCT_OWNER')
        except ManagementUser.DoesNotExist:
            return JsonResponse({"error": "Owner not found"}, status=404)

        # Get the ProductOwner in the same workspace
        try:
            product_owner = ProductOwner.objects.filter(workspace_id=management_user.workspace_id).first()
            if not product_owner:
                return JsonResponse({"error": "No ProductOwner found for this workspace"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Error retrieving ProductOwner: {str(e)}"}, status=500)

        # Get all stories for this ProductOwner with story_points included
        stories = list(UserStory.objects.filter(owner=product_owner).values(
            "id", "role", "goal", "benefit", "priority", "project_id", "project_name", "story_points"
        ))
        return JsonResponse(stories, safe=False, status=200)
    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def save_sprint_assignments(request):
    """
    Save sprint assignments made by the Product Owner.
    
    Expected POST data:
    {
      "owner_id": 1,
      "project_id": 5,
      "assignments": {
        "1": [{"user_story_id": 10, "priority": "High", "story_points": 8}, ...],
        "2": [{"user_story_id": 11, "priority": "Medium", "story_points": 5}, ...]
      }
    }
    """
    if request.method == 'POST':
        try:
            import json
            data = json.loads(request.body)
            
            owner_id = data.get('owner_id')
            project_id = data.get('project_id')
            assignments = data.get('assignments', {})  # Dict of {sprint_number: [stories]}
            
            if not owner_id or not project_id:
                return JsonResponse({"error": "Missing owner_id or project_id"}, status=400)
            
            # Convert to int if string
            try:
                owner_id = int(owner_id)
                project_id = int(project_id)
            except (ValueError, TypeError):
                return JsonResponse({"error": "Invalid owner_id or project_id format"}, status=400)
            
            # Get the ProductOwner
            try:
                product_owner = ProductOwner.objects.get(id=owner_id)
            except ProductOwner.DoesNotExist:
                return JsonResponse({"error": "ProductOwner not found"}, status=404)
            
            # Get the Project (flexible - just check if it exists)
            try:
                project = Project.objects.get(id=project_id)
                # Optionally verify owner, but be flexible
                if project.owner != product_owner and project.workspace_id != getattr(product_owner, 'workspace_id', None):
                    # It's okay, just use it anyway
                    pass
            except Project.DoesNotExist:
                return JsonResponse({"error": f"Project {project_id} not found"}, status=404)
            
            # Clear existing assignments for this project
            SprintAssignment.objects.filter(project=project, product_owner=product_owner).delete()
            
            # Create new sprint assignments
            created_count = 0
            for sprint_num, stories in assignments.items():
                for story_data in stories:
                    story_id = story_data.get('user_story_id') or story_data.get('id')
                    priority = story_data.get('priority', 'Medium')
                    story_points = story_data.get('story_points')
                    
                    # Validate priority
                    if priority not in ['High', 'Medium', 'Low']:
                        priority = 'Medium'
                    
                    try:
                        user_story = UserStory.objects.get(id=story_id)
                        
                        # Update or create the assignment
                        try:
                            assignment = SprintAssignment.objects.get(
                                user_story=user_story,
                                sprint_number=int(sprint_num),
                                project=project
                            )
                            # Update existing
                            assignment.priority = priority
                            assignment.story_points = story_points
                            assignment.save()
                        except SprintAssignment.DoesNotExist:
                            # Create new
                            assignment = SprintAssignment.objects.create(
                                user_story=user_story,
                                sprint_number=int(sprint_num),
                                project=project,
                                product_owner=product_owner,
                                priority=priority,
                                story_points=story_points
                            )
                        
                        created_count += 1
                            
                    except UserStory.DoesNotExist:
                        console_log = f"UserStory {story_id} not found, skipping"
                        continue
                    except SprintAssignment.DoesNotExist:
                        continue
                    except Exception as e:
                        print(f"Error creating assignment for story {story_id}: {str(e)}")
                        continue
            
            return JsonResponse({
                "success": True,
                "message": f"Saved {created_count} sprint assignments",
                "count": created_count
            }, status=200)
            
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            print(f"Error in save_sprint_assignments: {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({"error": f"Error saving assignments: {str(e)}"}, status=500)
    
    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def get_sprint_assignments(request, project_id):
    """
    Get all sprint assignments for a project.
    Returns assignments grouped by sprint number.
    """
    if request.method == 'GET':
        try:
            project = Project.objects.get(id=project_id)
            
            assignments = SprintAssignment.objects.filter(
                project=project
            ).values(
                'sprint_number', 
                'user_story__id',
                'user_story__role',
                'user_story__goal',
                'user_story__priority',
                'priority',
                'story_points'
            ).order_by('sprint_number')
            
            # Group by sprint number
            grouped = {}
            for assignment in assignments:
                sprint = assignment['sprint_number']
                if sprint not in grouped:
                    grouped[sprint] = []
                grouped[sprint].append(assignment)
            
            return JsonResponse({
                "success": True,
                "assignments": grouped
            }, status=200)
            
        except Project.DoesNotExist:
            return JsonResponse({"error": "Project not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Error retrieving assignments: {str(e)}"}, status=500)
    
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
    """Return all UserStory records for a given project_id WITH story_points and tasks."""
    if request.method == 'GET':
        try:
            stories = UserStory.objects.filter(project_id=project_id)
            stories_data = []
            
            for story in stories:
                # Get all tasks/subtasks for this story
                tasks = list(Backlog.objects.filter(user_story_id=story.id).values(
                    'task_id', 'tasks', 'subtasks', 'skills_required', 'estimated_hours'
                ))
                
                # Calculate total story points from tasks
                total_hours = sum(task.get('estimated_hours', 0) or 0 for task in tasks)
                story_points = int(total_hours)
                
                # Build story response
                story_data = {
                    'id': story.id,
                    'owner_id': story.owner_id,
                    'role': story.role,
                    'goal': story.goal,
                    'benefit': story.benefit,
                    'priority': story.priority,
                    'project_name': story.project_name,
                    'project_id': story.project_id,
                    'status': story.status if hasattr(story, 'status') else 'Ready',
                    'story_points': story_points,
                    'task_count': len(tasks),
                    'tasks': tasks
                }
                stories_data.append(story_data)
            
            return JsonResponse(stories_data, safe=False, status=200)
        except Exception as e:
            import traceback
            print(f"Error in get_userstories_by_project: {e}")
            print(traceback.format_exc())
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def debug_owner(request, owner_id):
    """Debug endpoint to check if owner exists and has projects."""
    try:
        owner = ManagementUser.objects.get(id=owner_id, role='PRODUCT_OWNER')
        projects = Project.objects.filter(owner_id=owner_id)
        
        return JsonResponse({
            'owner': {
                'id': owner.id,
                'name': owner.name,
                'email': owner.email,
                'workspace_id': owner.workspace_id if owner.workspace else None
            },
            'projects_count': projects.count(),
            'projects': list(projects.values('id', 'name'))
        }, status=200)
    except ManagementUser.DoesNotExist:
        return JsonResponse({'error': f'ProductOwner with id {owner_id} not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def debug_all(request):
    """Comprehensive debug endpoint showing all owners, projects, and relationships."""
    try:
        owners_data = []
        for owner in ManagementUser.objects.filter(role='PRODUCT_OWNER'):
            projects = Project.objects.filter(owner_id=owner.id)
            owners_data.append({
                'id': owner.id,
                'name': owner.name,
                'email': owner.email,
                'workspace_id': owner.workspace_id if owner.workspace else None,
                'project_count': projects.count(),
                'projects': list(projects.values('id', 'name'))
            })
        
        all_projects = list(Project.objects.values('id', 'name', 'owner_id', 'workspace_id'))
        
        return JsonResponse({
            'total_owners': ManagementUser.objects.filter(role='PRODUCT_OWNER').count(),
            'total_projects': Project.objects.count(),
            'owners': owners_data,
            'all_projects': all_projects
        }, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def debug_projects(request):
    """Debug endpoint showing projects with/without owner_id."""
    try:
        projects_with_owner = Project.objects.filter(owner_id__isnull=False).values(
            'id', 'name', 'owner_id', 'workspace_id'
        )
        projects_without_owner = Project.objects.filter(owner_id__isnull=True).values(
            'id', 'name', 'owner_id', 'workspace_id'
        )
        
        return JsonResponse({
            'projects_with_owner_id': list(projects_with_owner),
            'projects_without_owner_id': list(projects_without_owner),
            'total_with_owner': projects_with_owner.count(),
            'total_without_owner': projects_without_owner.count(),
        }, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def link_projects_to_owners(request):
    """Link orphan projects (with NULL owner_id) to owners based on workspace."""
    try:
        updated_count = 0
        
        # Find all projects with NULL owner_id
        orphan_projects = Project.objects.filter(owner_id__isnull=True)
        
        for project in orphan_projects:
            # Try to find a ProductOwner for this workspace
            if project.workspace_id:
                workspace = AdminWorkspace.objects.get(id=project.workspace_id)
                # Find first PRODUCT_OWNER in this workspace
                po = ManagementUser.objects.filter(
                    workspace=workspace,
                    role='PRODUCT_OWNER'
                ).first()
                
                if po:
                    project.owner_id = po.id
                    project.save()
                    updated_count += 1
        
        return JsonResponse({
            'message': f'Successfully linked {updated_count} projects to owners',
            'updated': updated_count
        }, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def seed_test_project(request, owner_id):
    """Create a test project for an owner if they don't have any."""
    try:
        owner = ManagementUser.objects.get(id=owner_id, role='PRODUCT_OWNER')
        
        # Get or create ProductOwner for this workspace
        workspace = owner.workspace
        product_owner = ProductOwner.objects.filter(workspace=workspace).first()
        
        if not product_owner:
            product_owner = ProductOwner.objects.create(
                name=f"PO - {owner.name}",
                email=f"po-{workspace.id}@scrumai.local",
                password="temp",
                company_name=workspace.companyName or "Company",
                workspace=workspace
            )
        
        # Check if owner already has projects
        existing_projects = Project.objects.filter(owner=product_owner)
        if existing_projects.exists():
            return JsonResponse({
                'message': 'Owner already has projects',
                'count': existing_projects.count(),
                'projects': list(existing_projects.values('id', 'name'))
            }, status=200)
        
        # Create test project
        test_project = Project.objects.create(
            name='E-Commerce Platform Redesign',
            description='Complete redesign of the e-commerce platform with modern UI/UX',
            owner=product_owner,
            workspace_id=owner.workspace_id if owner.workspace else None
        )
        
        # Create a test user story
        UserStory.objects.create(
            owner=product_owner,
            role='User',
            goal='User Authentication System',
            benefit='Secure login and registration for users',
            priority='High',
            story_points=13,
            project_name=test_project.name,
            project=test_project
        )
        
        return JsonResponse({
            'message': 'Test project created successfully',
            'project': {
                'id': test_project.id,
                'name': test_project.name,
                'owner_id': test_project.owner_id
            }
        }, status=201)
    except ManagementUser.DoesNotExist:
        return JsonResponse({'error': f'ProductOwner with id {owner_id} not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ========================================
# SPRINT TASK MANAGEMENT (Product Owner → Scrum Master)
# ========================================

@csrf_exempt
def add_task_to_sprint(request):
    """
    POST endpoint to add a task (Backlog item) to a sprint.
    URL: /userstorymanager/sprint/add-task/
    Expected JSON: {
        "sprint_id": <id>,
        "task_id": <id>,
        "priority": "High/Medium/Low"  # optional, for ordering
    }
    Response: {"message": "Task added to sprint", "sprint_item_id": <id>}
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    sprint_id = data.get('sprint_id')
    task_id = data.get('task_id')

    if not sprint_id or not task_id:
        return JsonResponse({'error': 'sprint_id and task_id are required'}, status=400)

    try:
        sprint = Sprint.objects.get(id=sprint_id)
        task = Backlog.objects.get(task_id=task_id)
    except Sprint.DoesNotExist:
        return JsonResponse({'error': 'Sprint not found'}, status=404)
    except Backlog.DoesNotExist:
        return JsonResponse({'error': 'Task not found'}, status=404)

    # Check if task is already in sprint
    if SprintItem.objects.filter(sprint=sprint, task=task).exists():
        return JsonResponse({'error': 'Task already in this sprint'}, status=400)

    # Create SprintItem
    sprint_item = SprintItem.objects.create(
        sprint=sprint,
        task=task
    )

    return JsonResponse({
        'message': 'Task added to sprint successfully',
        'sprint_item_id': sprint_item.id,
        'sprint_id': sprint.id,
        'task_id': task.task_id,
        'task_name': task.tasks
    }, status=201)


@csrf_exempt
def get_sprint_tasks(request, sprint_id):
    """
    GET endpoint to retrieve all tasks in a sprint (for Scrum Master).
    URL: /userstorymanager/sprint/<sprint_id>/tasks/
    Response: {
        "sprint_id": <id>,
        "sprint_name": "...",
        "tasks": [
            {
                "sprint_item_id": <id>,
                "task_id": <id>,
                "task_name": "...",
                "subtasks": "...",
                "skills_required": "...",
                "estimated_hours": <float>,
                "priority": "...",
                "added_at": "..."
            }
        ]
    }
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        sprint = Sprint.objects.get(id=sprint_id)
    except Sprint.DoesNotExist:
        return JsonResponse({'error': 'Sprint not found'}, status=404)

    # Get all sprint items with their task details
    sprint_items = SprintItem.objects.filter(sprint=sprint).select_related('task')
    
    tasks_data = []
    for item in sprint_items:
        task = item.task
        user_story = task.user_story

        tasks_data.append({
            'sprint_item_id': item.id,
            'task_id': task.task_id,
            'task_name': task.tasks,
            'subtasks': task.subtasks,
            'skills_required': task.skills_required,
            'estimated_hours': task.estimated_hours,
            'priority': user_story.priority if user_story else 'Medium',
            'story_points': user_story.story_points if user_story else 0,
            'user_story_id': user_story.id if user_story else None,
            'added_at': item.added_at.isoformat()
        })

    return JsonResponse({
        'sprint_id': sprint.id,
        'sprint_name': sprint.name,
        'sprint_start': sprint.start_date.isoformat(),
        'sprint_end': sprint.end_date.isoformat(),
        'is_active': sprint.is_active,
        'task_count': len(tasks_data),
        'tasks': tasks_data
    }, status=200)


@csrf_exempt
def remove_task_from_sprint(request, sprint_item_id):
    """
    DELETE endpoint to remove a task from sprint.
    URL: /userstorymanager/sprint/task/<sprint_item_id>/remove/
    Response: {"message": "Task removed from sprint"}
    """
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        sprint_item = SprintItem.objects.get(id=sprint_item_id)
    except SprintItem.DoesNotExist:
        return JsonResponse({'error': 'Sprint item not found'}, status=404)

    sprint_id = sprint_item.sprint.id
    sprint_item.delete()

    return JsonResponse({
        'message': 'Task removed from sprint successfully',
        'sprint_id': sprint_id
    }, status=200)