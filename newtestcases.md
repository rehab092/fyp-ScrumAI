# ScrumAI - New Test Cases

Format: Each test follows the template columns from your attachment: `Test case ID | Test Objective | Precondition | Steps | Test data | Expected result | Post-condition | Actual Result | Pass/fail`

NOTE: Roles in the system: `Product Owner`, `Scrum Master`, `Team Member`.
Module 1: Upload user stories (role, goal, benefit, priority) → LLM decomposes into tasks & subtasks → CRUD for user stories and tasks.
Module 2: LLM generates required skills and estimated hours per task → ILP algorithm matches tasks to team members based on skills and available hours (capacity).

---

## Priority: First 10 Test Cases

| Test case ID | Test Objective | Precondition | Steps | Test data | Expected result | Post-condition | Actual Result | Pass/fail |
|---|---|---|---|---|---|---|---|---|
| NT001 | Verify `Product Owner` signup (create account) | No existing account with given email | 1. POST to `/userstorymanager/create/` (owner create) with JSON name,email,password,company_name 2. Inspect response | {"name":"Alice","email":"alice@example.com","password":"Pass123","company_name":"Acme"} | HTTP 200/201 with owner id and message; DB has ProductOwner row | New ProductOwner exists with provided email |  |  |
| NT002 | Verify login for `Product Owner` returns JWT | ProductOwner `alice@example.com` exists with password `Pass123` | 1. POST to `/userstorymanager/login/` with email/password 2. Inspect response | {"email":"alice@example.com","password":"Pass123"} | HTTP 200, response includes `token`, `owner_id`, `email` | Token is a JWT containing email claim and expiration |  |  |
| NT003 | Verify signup/login for `Scrum Master` role (if separate table/flag) | System supports a Scrum Master record (or reuse ProductOwner model with role flag) | 1. Create Scrum Master account (if flow exists) or ensure account with role flag 2. Attempt login | payload as per signup/login | Account created and able to login, receives token | Scrum Master can authenticate |  |  |
| NT004 | Verify signup/login for `Team Member` | Team member account exists with skills profile (if separate) | 1. Create team member 2. Login with credentials | {"email":"dev1@example.com","password":"DevPass"} | Login succeeds with token; team member profile created | Team Member record created/available |  |  |
| NT005 | Create a single User Story (manual CRUD) | ProductOwner and Project exist | 1. POST to story create endpoint (module1) with role, goal, benefit, priority, project_id, owner_id 2. Inspect response | {"owner_id":1,"project_id":1,"role":"Manager","goal":"Track spending","benefit":"Detect fraud","priority":"High"} | HTTP 200/201; UserStory created with given fields | UserStory inserted and returns id |  |  |
| NT006 | Upload multiple user stories (multi-line) and ensure LLM decomposition triggers | ProductOwner and Project exist; OPENAI_API_KEY configured | 1. POST multipart/form-data to `/userstorymanager/create_backlog/` with `stories_text` containing 3 lines of "<story> | Priority" and role/goal/benefit fields 2. Inspect response | stories_text: "As a manager, I want ... | High\nAs a user, I want ... | Medium\n..." | HTTP 200; response includes `stories_created` and `tasks_created` counts; UserStory rows created and Backlog tasks created | DB has UserStory rows and Backlog entries for tasks |  |  |
| NT007 | Verify LLM-produced JSON parsing is robust to fences/comments | Same as NT006 but LLM returns fenced or commented output (simulate) | 1. Mock LLM to return text with ```json fences or // comments 2. System should sanitize and parse 3. Verify Backlog created | Simulated LLM response with code fences and comments | System sanitizes and successfully parses JSON; Backlog created | Backlog exists; no crash |  |  |
| NT008 | CRUD: Update User Story fields | A UserStory id=2 exists | 1. PUT to `/userstorymanager/story/2/update/` with new role/goal/priority 2. Inspect response, then GET all stories | {"role":"Product Owner","goal":"New goal","priority":"Low"} | HTTP 200 message; UserStory fields updated in DB | DB reflects updated fields |  |  |
| NT009 | CRUD: Delete User Story and cascade-delete tasks | UserStory id=3 exists with N Backlog tasks | 1. DELETE `/userstorymanager/story/3/delete/` 2. Inspect response 3. Confirm Backlog entries for that story removed | user_story_id:3 | HTTP 200; UserStory removed; related Backlog rows deleted (cascade) | No UserStory id=3; no Backlog rows referencing it |  |  |
| NT010 | CRUD: Retrieve all User Stories (list) | Several UserStory rows exist | 1. GET `/userstorymanager/stories/` 2. Inspect JSON response | none | HTTP 200; JSON array includes id, owner_id, role, goal, benefit, priority, project_name, project_id | Response lists all stories |  |  |

---

## Module 1 — User Stories & Task Decomposition (additional tests)

| Test case ID | Test Objective | Precondition | Steps | Test data | Expected result | Post-condition | Actual Result | Pass/fail |
|---|---|---|---|---|---|---|---|---|
| NT011 | Verify priority extraction when input omits `| Priority` (default to Medium) | Upload line without `|` token | 1. POST `stories_text` with line "As a user, I want X" and role/goal/benefit defaults 2. Inspect created UserStory priority | single line without `|` | UserStory created with priority `Medium` (default) | DB shows priority=Medium |  |  |
| NT012 | Verify deduplication of identical story lines (order preserved) | `stories_text` includes duplicate lines | 1. Upload lines: A, A, B 2. Inspect counts | A\nA\nB | Only two UserStories created (A then B), duplicates ignored | DB has 2 stories |  |  |
| NT013 | Verify task numbering `seq.idx` corresponds to original story sequence | Multiple stories uploaded (seq 1..n) | 1. Upload 3 stories 2. Inspect Backlog.tasks format strings | multiple stories | Backlog.tasks strings start with `1.1`,`1.2` for story1 tasks, `2.1` for story2 etc. | Backlog tasks show sequence prefixes |  |  |
| NT014 | Verify updating a Backlog task (tasks and subtasks) via API | Backlog task exists id=task_id | 1. PUT `/userstorymanager/task/<task_id>/update/` with new `tasks` and `subtasks` 2. Verify DB | {"tasks":"2.1 Implement API","subtasks":"auth,tests"} | HTTP 200; Backlog record updated | DB shows updated tasks/subtasks |  |  |
| NT015 | Verify delete a Backlog task by `task_id` | Backlog record with task_id exists | 1. DELETE `/userstorymanager/task/<task_id>/delete/` 2. Verify DB | task_id: 7 | HTTP 200; Backlog row removed | Row deleted from DB |  |  |
| NT016 | LLM error handling: when LLM times out or returns invalid JSON | Simulate OpenAI API failure or invalid output | 1. Upload stories 2. LLM fails for a block → system falls back to per-line calls or returns error gracefully | Simulated failure | System either retries per-line, or returns HTTP 500 with descriptive error; no partial DB corruption | DB consistent; partial changes either rolled back or clearly reported |  |  |
| NT017 | Tasks created have `subtasks` stored as CSV or "empty" as per code | After decomposition, inspect Backlog.subtasks field | 1. Upload story that produces subtasks 2. GET tasks | story producing subtasks | `subtasks` contains comma-separated values or `empty` when none | Backlog rows show expected subtasks |  |  |
| NT018 | Verify GET tasks by user_story id returns tasks array | UserStory with tasks exists | 1. GET `/userstorymanager/tasks/<user_story_id>/` 2. Inspect JSON | user_story_id: existing | HTTP 200; JSON contains user_story id and `tasks` list with user_story_id, tasks, subtasks | Correct tasks returned |  |  |
| NT019 | Validate string length constraints (<=120 chars for LLM outputs) are enforced/assumed | LLM returns longer strings (simulate) | 1. Simulate LLM output with >120 chars for task strings 2. System should accept but code expects <=120; verify behavior | simulated long task strings | System should trim/enforce or accept but store full string; ensure no crash | Data stored without breaking JSON or DB constraints |  |  |
| NT020 | Verify project linkage: created UserStory.project_name equals Project.name | Project exists | 1. Create Project name X 2. Upload story referencing project_id for that Project 3. Inspect UserStory.project_name | project_id -> Project.name | UserStory.project_name == Project.name | Relationship consistent in DB |  |  |

---

## Module 2 — Skills, Hours, and ILP Matching (task assignment)

Notes: Module 2 behavior: For each Backlog task, an LLM call proposes required `skills` (list) and `estimated_hours`. Team members have skill sets and available capacity (hours). ILP solver assigns each task to a team member who has required skills and sufficient hours. The solver optimizes e.g., minimize total unfilled hours or maximize fit; tests below verify correctness and edge cases.

| Test case ID | Test Objective | Precondition | Steps | Test data | Expected result | Post-condition | Actual Result | Pass/fail |
|---|---|---|---|---|---|---|---|---|
| NT021 | LLM generates skills & hours for a task | Backlog task exists; OPENAI key configured | 1. For a specific Backlog task, call module2 generation 2. Inspect result | task text: "1.1 Implement login API" | Response includes `skills`: ["python","django","jwt"] and `estimated_hours`: numeric >0 | DB stores task metadata or returned payload contains skills and estimated hours |  |  |
| NT022 | Verify team member profile creation with skills and capacity | Create team members with skills and capacity fields | 1. Create team member A skills:[python,django], capacity:20 2. Create B skills:[js], capacity:10 | payloads | Team members stored with skills and hours capacity | Profiles available for ILP |  |  |
| NT023 | ILP match: single task matches exactly one team member by skills & capacity | One task requires skills present in member A and A has enough hours | 1. Run matching on task list 2. Inspect assignments | task hours 8, skills match A | Task assigned to A; A capacity reduced accordingly | Assignment recorded (task->team_member) |  |  |
| NT024 | ILP match: multiple tasks assigned optimally across multiple members to honor capacity | 3 tasks totaling 30 hours; members capacities 20 and 15 | 1. Run ILP 2. Inspect distribution | tasks: 12,10,8; members capacities 20 and 15 | Solver assigns tasks so no member is over capacity and skills constraints satisfied; feasible assignment exists | Assignments recorded and capacities updated |  |  |
| NT025 | ILP edge: insufficient total capacity → identify unassigned tasks | Sum(task_hours) > sum(capacity) | 1. Run ILP 2. Inspect result | tasks sum 50, capacities sum 30 | ILP reports which tasks remain unassigned or marks feasibility=false; returns partial assignment maximizing coverage | Partial assignment recorded; unassigned tasks flagged |  |  |
| NT026 | ILP edge: skills mismatch (no member has required skill) | Task requires RareSkill not present in any member | 1. Run ILP 2. Inspect assignments | task skills: [RareSkill] | Task remains unassigned; system reports missing skill / candidate list empty | Task unassigned; alert/log created |  |  |
| NT027 | Tie-breaking: when multiple members satisfy skill & capacity, prefer highest skill match count or least residual capacity | Members A and B both qualify; A has more matching skills | 1. Run ILP 2. Inspect chosen assignment | members: A(sk1,sk2),B(sk1); task requires sk1,sk2 | Task assigned to A (better fit) | Assignment matches priority rule |  |  |
| NT028 | Verify hours update after assignment reduces member capacity | Member capacity 20, assigned task 8 → capacity becomes 12 | 1. Run matching 2. Inspect member capacities | task hours 8 | Member capacity decreased by assigned hours | Capacity field updated |  |  |
| NT029 | Re-run matching after manual capacity change (dynamic update) | After initial assignment, change a member's capacity | 1. Increase/decrease capacity 2. Re-run ILP 3. Observe re-assignment possibilities | Updated capacities | ILP respects new capacities and may reassign tasks if optimal | New assignments persisted |  |  |
| NT030 | Verify matching respects subtasks as separate tasks (if treated so) | Backlog.entries may have subtasks CSV | 1. Expand subtasks into separate assignment items 2. Run ILP | tasks and subtasks | Subtasks either assigned separately or handled as part of parent task; verify consistent behavior | Assignment results consistent and documented |  |  |

---

## Integration & Edge Cases

| Test case ID | Test Objective | Precondition | Steps | Test data | Expected result | Post-condition | Actual Result | Pass/fail |
|---|---|---|---|---|---|---|---|---|
| NT031 | End-to-end: Upload stories → LLM decompose → LLM skills/hours → ILP match → confirm assignments | All services configured (OpenAI, ILP solver); team members exist | 1. Upload 3 user stories 2. System creates UserStories and Backlog tasks 3. For each task, generate skills/hours 4. Run ILP 5. Inspect assignments | 3 stories with varied skills | End-to-end flow completes without errors; tasks assigned to qualified members and capacities respected | DB reflects complete pipeline outputs and assignments |  |  |
| NT032 | Authorization: endpoints requiring authentication reject unauthenticated requests | Token-based endpoints exist (if applicable) | 1. Call protected endpoint without `Authorization` header 2. Expect rejection | none | HTTP 401/403 and error message | No change applied |  |  |
| NT033 | Performance: Upload large batch (100 stories) in blocks and ensure LLM block batching works | Large stories_text with 100 lines | 1. Upload 100-line stories_text 2. Monitor processing time and memory | 100 lines | System processes in blocks (10 per block) and returns `stories_created` and `tasks_created` without crash | System processes and returns counts; no OOM |  |  |
| NT034 | Data integrity: Partial failure rollback or clear partial state reporting | Force error during processing after some DB writes (simulate) | 1. Cause error mid-processing 2. Inspect DB and response | simulated exception | System does not leave inconsistent partial state; either rolls back or reports exact counts/failed items | DB consistent and error reported |  |  |
| NT035 | Logging & Error Messages: Ensure user-facing errors are descriptive | Trigger known errors (invalid JSON, missing fields, invalid IDs) | 1. Call endpoints with invalid payloads 2. Inspect error messages | invalid payloads | Responses include helpful `error` messages and appropriate HTTP codes | Good UX for failure cases |  |  |

---

## Execution Notes & Recommended Test Data Setup
- Create at least one `Product Owner`, one `Scrum Master`, and 3 `Team Members` with diverse skills and capacities (e.g., 20, 15, 10 hours).
- Ensure `Project` records exist to attach user stories.
- Configure `OPENAI_API_KEY` and an ILP solver (or a test double) for module2 tests.
- For LLM-dependent tests, consider stubbing/mocking OpenAI responses to reliably test parsing and downstream behavior.

---

If you want, I can:
- Convert these into a CSV or Excel test-plan.
- Generate pytest/DRF API tests skeletons for the top-priority cases (NT001–NT010).
- Produce a condensed checklist for manual QA execution.

Which next step would you like?