# fyp-ScrumAI
# ScrumAI Module 

This module contains the backend implementation for the delay alert feature used by the ScrumAI project.

The goal is to detect delayed tasks, propagate dependency-based delay alerts, and expose project-scoped APIs that the frontend can use to show delay summaries, project drill-down views, and alert lists.

## What This Module Does

- Tracks task progress per workspace, task, and sprint.
- Detects direct delays when a task is overdue or not completed.
- Propagates delay impact through task dependencies using cascade and chain alerts.
- Returns project-level delay summaries for the dashboard.
- Lets the frontend fetch delay context for a selected project.
- Supports manual or scheduled delay checks through a Django management command.

## Main Apps Involved

- `delayalerts` - delay tracking, alert generation, and APIs.
- `taskdependency` - task dependency graph used for cascade detection.
- `userstorymanager` - project and backlog task data.
- `sprintmanager` - sprint data used for scope and scheduling.
- `assignment_module` - workspace ownership and tenant scoping.

## Data Model

### TaskProgress

Stores the current execution state of a task inside a workspace.

Fields:

- `workspace` - workspace owner of the record.
- `task` - related backlog task.
- `sprint` - optional sprint reference.
- `status` - `PENDING`, `IN_PROGRESS`, or `COMPLETED`.
- `deadline` - optional target date.
- `completed_at` - completion timestamp.
- `created_at` and `updated_at` - audit fields.

### DelayAlert

Stores detected delay issues for a task.

Fields:

- `workspace` - workspace owner of the alert.
- `sprint` - optional sprint reference.
- `task` - delayed task.
- `source_task` - original task that caused a propagated delay.
- `alert_type` - `DIRECT`, `CASCADE`, or `CHAIN`.
- `reason` - human-readable explanation.
- `severity` - numeric severity score.
- `is_active` - soft-resolve flag.
- `detected_at` and `updated_at` - timestamps.

## Delay Detection Flow

1. The engine reads task progress records for a workspace.
2. It marks overdue or incomplete tasks as direct delays.
3. It builds the dependency graph from `TaskDependency`.
4. It propagates delay impact to successor tasks.
5. It creates cascade alerts for the first level of propagation.
6. It creates chain alerts for deeper dependency levels.
7. If a task becomes `COMPLETED`, its active delay alerts are resolved by setting `is_active = false`.

## API Contract

All delay alert endpoints require the `Workspace-ID` request header.

### Project Summary

`GET /api/delay-alerts/projects/`

Used by the frontend dashboard to list projects that have delay activity.

Response fields:

- `projectId`
- `projectName`
- `description`
- `activeSprintId`
- `taskCount`
- `delayedTaskCount`
- `lastDelay`

### Project Context

`GET /api/delay-alerts/project/{projectId}/context/`

Returns task-level delay information for a selected project.

### Alerts List

`GET /api/delay-alerts/alerts/?active=true&projectId={projectId}`

Returns delay alerts filtered by project and active state.

### Upsert Task Progress

`POST /api/delay-alerts/task-progress/upsert/`

or

`PUT /api/delay-alerts/task-progress/upsert/`

Creates or updates task progress for a workspace task.

### Run Engine Manually

`POST /api/delay-alerts/engine/run/`

Runs delay detection for the current workspace.

### Resolve Alert

`POST /api/delay-alerts/alerts/{alertId}/resolve/`

or

`PATCH /api/delay-alerts/alerts/{alertId}/resolve/`

Marks an alert inactive without deleting the record.

## Scheduler Command

The module includes a management command for automation:

```bash
python manage.py run_delay_alerts --workspace-id 1
```

Useful options:

- `--all-workspaces` - run for every workspace.
- `--sprint-id` - run for one sprint.
- `--run-date YYYY-MM-DD` - override the evaluation date.
- `--default-status` - fallback status for missing progress rows.
- `--default-deadline` - fallback deadline for missing progress rows.
- `--default-deadline-offset-days` - fallback relative deadline.
- `--near-deadline-days` - automatically find active sprints ending soon and run the engine for them.

## Frontend Flow

The frontend should use this flow:

1. Read the workspace id from session or local storage.
2. Send it as `Workspace-ID` in every request.
3. Load project cards from `/api/delay-alerts/projects/`.
4. Open a project with `/api/delay-alerts/project/{projectId}/context/`.
5. Load the alert list using `projectId` instead of `sprintId`.
6. Filter alerts by `active=true` for the default dashboard view.

## Demo Story

If you are presenting this module, this is the easiest explanation:

1. A workspace sends its id in the request header.
2. The backend isolates all queries to that workspace.
3. Task progress is stored or updated for each task.
4. The engine checks overdue tasks and creates delay alerts.
5. Dependency-based delays are propagated to dependent tasks.
6. The dashboard reads project summaries and shows where delays exist.
7. Clicking a project opens the delay context and alert list for that project.
8. Completing a task resolves its active delay alerts automatically.

## Setup

From the `module1` directory:

```bash
python manage.py migrate
python manage.py runserver
python manage.py test delayalerts
```

## Notes

- The backend is workspace-scoped, so projects only appear for the selected workspace.
- Active alerts are soft-resolved instead of deleted.
- Some flows support fallback defaults so the module can run before full sprint integration is available.

## Status

This module is ready for frontend integration and demo usage.
