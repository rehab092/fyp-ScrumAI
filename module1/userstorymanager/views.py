# views.py

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

from .models import ProductOwner, UserStory, Backlog, Project

import json
import os
import re
import time
import uuid
import openai

# =========================
# OpenAI setup
# =========================
openai.api_key = os.getenv("OPENAI_API_KEY")
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
OPENAI_TIMEOUT = int(os.getenv("OPENAI_TIMEOUT", "30"))

# =========================
# Helpers
# =========================
def call_llm(prompt: str, max_tokens: int = 2000, max_retries: int = 2) -> str:
    """
    Call OpenAI with JSON-only discipline + small retry.
    """
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
    Make best-effort to extract valid JSON:
    - Trim to the first '{' or '[' and the last '}' or ']'
    - Remove JS-style comments (// and /* */)
    - Remove trailing commas before } or ]
    - Normalize smart quotes
    """
    if not raw:
        return ""

    text = raw.strip()

    # Remove code fences if any
    if text.startswith("```"):
        lines = text.splitlines()
        # drop the first line and any closing fence line
        if lines and lines[-1].strip().startswith("```"):
            text = "\n".join(lines[1:-1]).strip()
        else:
            text = "\n".join(lines[1:]).strip()

    # Normalize smart quotes
    text = (
        text.replace("“", '"').replace("”", '"')
            .replace("‘", "'").replace("’", "'")
    )

    # Strip JS-style comments
    text = re.sub(r"//.*?$", "", text, flags=re.MULTILINE)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)

    # Keep only from first JSON opener to last closer
    start = None
    for opener in ("{", "["):
        idx = text.find(opener)
        if idx != -1 and (start is None or idx < start):
            start = idx
    if start is None:
        return text

    end = None
    for closer in ("}", "]"):
        idx = text.rfind(closer)
        if idx != -1 and (end is None or idx < end):
            # keep the farthest-right closer
            end = idx if end is None else max(end, idx)
    if end is None or end < start:
        candidate = text[start:]
    else:
        candidate = text[start:end + 1]

    # Remove trailing commas before } or ]
    candidate = re.sub(r",\s*(\])", r"\1", candidate)
    candidate = re.sub(r",\s*(\})", r"\1", candidate)

    # Sometimes models produce keys with single quotes → make double-quoted JSON
    # (only if we still can't parse)
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
        # Remove any new trailing commas after quote-fixing
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
        owner = ProductOwner.objects.create(
            name=data["name"],
            email=data["email"],
            password=data["password"],
            company_name=data["company_name"],
        )
        return JsonResponse({"id": owner.id, "message": "Owner created successfully"})
    return JsonResponse({"error": "Invalid request method"}, status=405)


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
            return JsonResponse({"message": "Login successful", "owner_id": owner.id})
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
        priority   = request.POST.get('priority')
        stories_tx = (request.POST.get('stories_text') or '').strip()

        if not all([owner_id, project_id, role, benefit, priority]):
            return JsonResponse({'error': 'owner_id, project_id, role, benefit, priority are required.'}, status=400)
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

        # --- Create UserStory rows ---
        user_stories = []  # (UserStory, original_text, seq)
        for seq, story_text in enumerate(story_lines, start=1):
            m = re.match(r"As an? ([^,]+), (?:I want )?([^,]+?)(?:, so that |, so )(.+)", story_text, flags=re.IGNORECASE)
            if m:
                story_role, story_goal, story_benefit = m.groups()
            else:
                story_role, story_goal, story_benefit = role, story_text, benefit

            us = UserStory.objects.create(
                owner=owner,
                project=project,
                role=story_role.strip(),
                goal=story_goal.strip(),
                benefit=story_benefit.strip(),
                priority=priority,
                project_name=project.name,
                text_file=None,
            )
            user_stories.append((us, story_text, seq))

        # --------- PROMPTS (force exact echo) ----------
        def build_block_prompt(lines):
            joined = "\n".join(lines)
            return f"""
Return strictly VALID JSON only. Do NOT include markdown/code fences.

For each non-empty line below (ONE user story per line):
- Produce essential developer tasks only (no over-fragmentation).
- Subtasks ONLY if necessary, else ["empty"].
- Strings <= 120 chars.
- Number tasks as strings "1","2","3",...
- MOST IMPORTANT: ECHO THE STORY TEXT EXACTLY AS GIVEN (byte-for-byte); DO NOT REPHRASE OR TRIM.

Input:
{joined}

Output JSON (ONLY):
{{
  "stories": [
    {{
      "story": "EXACT original line here",
      "tasks": [
        {{"task_number": "1", "task": "short technical description", "subtasks": ["empty"]}}
      ]
    }}
  ]
}}
""".strip()

        def build_single_prompt(line):
            return f"""
Return strictly VALID JSON only. No markdown.

ECHO THE STORY TEXT EXACTLY AS GIVEN (no edits):
{line}

Rules:
- Essential, concrete tasks.
- Subtasks only if really needed, else ["empty"].
- Strings <= 120 chars.
- JSON keys: "story","tasks","task_number","task","subtasks".

Output:
{{
  "stories": [
    {{
      "story": "{line}",
      "tasks": [{{"task_number": "1", "task": "short technical description", "subtasks": ["empty"]}}]
    }}
  ]
}}
""".strip()

        # --- LLM calls ---
        all_stories = []
        llm_debug = []  # capture what came back to help debug
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

        map_text = {norm(t): (obj, seq) for (obj, t, seq) in user_stories}

        # --- Persist Backlog ---
        tasks_created = 0
        for item in all_stories:
            text = norm(item.get("story") or "")
            pair = map_text.get(text)

            if pair is None:
                # Fallback: loose contains (helps if model added/removed a space)
                for (obj, t, seq) in user_stories:
                    nt = norm(t)
                    if text and (text in nt or nt in text):
                        pair = (obj, seq)
                        break
            if pair is None:
                # couldn't match; skip
                continue

            us_obj, seq = pair
            for idx, task in enumerate(item.get("tasks", []) or [], start=1):
                ttxt = (task.get("task") or "").strip()
                subt = task.get("subtasks", []) or []
                numbered = f"{seq}.{idx} {ttxt}" if ttxt else f"{seq}.{idx}"
                subt_csv = ", ".join(subt) if isinstance(subt, list) and subt else "empty"

                Backlog.objects.create(
                    project_id=str(project.id),
                    user_story=us_obj,    # FK field name in Django
                    tasks=numbered,       # e.g., "1.1 Implement X"
                    subtasks=subt_csv     # "empty" or CSV
                )
                tasks_created += 1

        return JsonResponse({
            "message": "Processed successfully.",
            "project_id": project_id,
            "stories_created": len(user_stories),
            "tasks_created": tasks_created,
            "llm_empty_hint": (len(all_stories) == 0),   # quick hint for you
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
            tasks = list(Backlog.objects.filter(user_story=story).values('user_story_id', 'tasks', 'subtasks'))
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