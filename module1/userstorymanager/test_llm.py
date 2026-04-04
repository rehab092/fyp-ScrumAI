"""
Test endpoint for LLM story decomposition debugging.
Add this to your Django app to test LLM responses directly.
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .views import call_llm, parse_or_raise
import json


@csrf_exempt
def test_llm_decomposition(request):
    """
    Test endpoint to debug LLM story decomposition.
    POST with JSON: {"story": "as a user I want to...", "priority": "High"}
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    
    try:
        data = json.loads(request.body)
        story_line = data.get('story', 'As a user, I want to login, so that I can access my account.')
        priority = data.get('priority', 'High')
        
        # Build a test prompt
        prompt = f"""You are an Agile story decomposition expert. Return ONLY valid JSON, NO markdown or code blocks.

CRITICAL RULES:
1. Priority is: {priority}
2. For EVERY task, MUST include: task_number (string), task (short string <=100 chars), subtasks (array of strings), skills (array), estimated_hours (number)
3. Subtasks should be realistic technical steps
4. Skills must be specific: Backend, Frontend, Database, API, Testing, Docs, DevOps, etc.
5. estimated_hours MUST be a number: 1, 2.5, 4, 6, 8, 12, 20 etc
6. Generate 3-5 essential tasks
7. ECHO the story line EXACTLY

Story:
{story_line}

You MUST return valid JSON:
{{
  "stories": [
    {{
      "story": "{story_line}",
      "priority": "{priority}",
      "tasks": [
        {{"task_number": "1", "task": "Task description", "subtasks": ["Step 1"], "skills": ["Skill1"], "estimated_hours": 4}}
      ]
    }}
  ]
}}
"""
        
        # Call LLM
        raw_response = call_llm(prompt, max_tokens=1500)
        
        # Try to parse
        try:
            parsed = parse_or_raise(raw_response)
            success = True
            error = None
        except Exception as e:
            parsed = None
            success = False
            error = str(e)
        
        return JsonResponse({
            'success': success,
            'story_input': story_line,
            'priority_input': priority,
            'raw_llm_response': raw_response[:500],  # First 500 chars
            'raw_response_full': raw_response,
            'parsed_json': parsed,
            'parse_error': error,
            'task_count': len(parsed.get('stories', [{}])['tasks']) if parsed else 0,
            'has_estimated_hours': False if not parsed else any(
                t.get('estimated_hours') for t in parsed.get('stories', [{}])[0].get('tasks', [])
            ),
            'has_skills': False if not parsed else any(
                t.get('skills') for t in parsed.get('stories', [{}])[0].get('tasks', [])
            ),
            'has_subtasks': False if not parsed else any(
                t.get('subtasks') for t in parsed.get('stories', [{}])[0].get('tasks', [])
            )
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def test_llm_batch(request):
    """
    Test batch LLM decomposition with multiple stories.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    
    try:
        data = json.loads(request.body)
        stories = data.get('stories', [
            'As a user, I want to login to the system, so that I can access my dashboard.',
            'As an admin, I want to manage users, so that I can control access | High',
            'As a developer, I want better logging, so that debugging is easier | Medium'
        ])
        
        results = []
        for story_line in stories:
            # Extract priority if included in story line
            if ' | ' in story_line:
                story_text, priority = story_line.split(' | ', 1)
                priority = priority.strip()
            else:
                story_text = story_line
                priority = 'Medium'
            
            prompt = f"""You are an Agile story decomposition expert. Return ONLY valid JSON, NO markdown.

Story to decompose:
{story_text}

Priority: {priority}

Return this exact format:
{{
  "stories": [
    {{
      "story": "{story_text}",
      "priority": "{priority}",
      "tasks": [
        {{"task_number": "1", "task": "First task", "subtasks": ["step a", "step b"], "skills": ["Skill1", "Skill2"], "estimated_hours": 4}},
        {{"task_number": "2", "task": "Second task", "subtasks": ["step c"], "skills": ["Skill3"], "estimated_hours": 6}}
      ]
    }}
  ]
}}
"""
            
            try:
                raw_response = call_llm(prompt, max_tokens=1200)
                parsed = parse_or_raise(raw_response)
                
                # Extract key metrics
                tasks = parsed.get('stories', [{}])[0].get('tasks', [])
                total_hours = sum(t.get('estimated_hours', 0) or 0 for t in tasks)
                all_skills = set()
                subtask_count = 0
                for t in tasks:
                    if t.get('skills'):
                        all_skills.update(t['skills'])
                    if t.get('subtasks'):
                        subtask_count += len(t['subtasks'])
                
                results.append({
                    'story': story_text,
                    'priority': priority,
                    'success': True,
                    'tasks_count': len(tasks),
                    'total_hours': total_hours,
                    'unique_skills': len(all_skills),
                    'subtasks_count': subtask_count,
                    'parsed': parsed
                })
            except Exception as e:
                results.append({
                    'story': story_text,
                    'priority': priority,
                    'success': False,
                    'error': str(e)
                })
        
        return JsonResponse({
            'test_results': results,
            'total_stories': len(stories),
            'successful': sum(1 for r in results if r.get('success'))
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
