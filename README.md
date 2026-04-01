
# Delay Alerts Module

## Overview

The Delay Alerts module shows task delays in a project in two forms:

- Direct delays: a task misses its own deadline.
- Cascading delays: a task is delayed because an upstream dependency is delayed.

The module is available in both the Scrum Master portal and the Team Member portal. It uses the authenticated user's `Workspace-ID` so the backend only returns projects and delay data for that workspace.

## What The UI Does

- Loads project cards for the current workspace.
- Lets the user select a project by clicking its card.
- Loads delay details for the selected project.
- Distinguishes direct vs cascading delays.
- Shows the blocked task, root cause task, and dependency chain as readable task titles.
- Provides a `Recalculate Delays` action to run the delay engine again.
- Automatically refreshes delay data after recalculation.

## Backend Contract

The frontend expects these endpoints:

### 1. Project list

`GET /api/delay-alerts/projects/`

Request header:

- `Workspace-ID: <workspaceId>`

Expected response:

```json
{
  "success": true,
  "data": [
    {
      "projectId": 1,
      "projectName": "AI Assistant System",
      "description": "A project to build an AI assistant for product owners.",
      "activeSprintId": 1,
      "taskCount": 16,
      "delayedTaskCount": 11,
      "lastDelay": "42 minutes ago"
    }
  ]
}
```

### 2. Project delay context

`GET /api/delay-alerts/project/{projectId}/context/`

Request header:

- `Workspace-ID: <workspaceId>`

Expected response includes:

- `tasks`
- `dependencies`
- `summary`

### 3. Delay alerts list

`GET /api/delay-alerts/alerts/?active=true&projectId={projectId}`

Request header:

- `Workspace-ID: <workspaceId>`

Expected response includes active alerts for the selected project.

### 4. Recalculate engine

`POST /api/delay-alerts/engine/run/`

Request header:

- `Workspace-ID: <workspaceId>`

Used when the user clicks `Recalculate Delays`.

## Data Mapping In The UI

The project list card uses these fields:

- `projectId`
- `projectName`
- `description`
- `taskCount`
- `delayedTaskCount`
- `lastDelay`

The selected project view uses these task fields:

- `taskTitle`
- `status`
- `dueDate`
- `delayType`
- `reason`
- `directCause`
- `rootCause`
- `cascadeChain`

## Display Rules

- The module does not show raw task IDs in the UI.
- Delay cards show task names/descriptions instead.
- The reason text uses a user-friendly phrase like `Blocked by <task title>`.
- The dependency chain is rendered as a readable title chain instead of numeric IDs.

## Workspace Isolation

The app sends `Workspace-ID` automatically through the shared API helper in `src/config/api.js`.

That means:

- users only see projects from their own workspace,
- delay alerts are scoped to the same workspace,
- and no extra frontend filtering is needed for tenant isolation.

## Main Files

- `src/components/scrum-master/DelayAlerts.jsx`
- `src/config/api.js`
- `src/pages/ScrumMasterPortal.jsx`
- `src/pages/TeamMemberPortal.jsx`
- `src/pages/Login.jsx`

## Current UX Notes

- Project selection is done through clickable project cards.
- A project can be deselected using the `Back to Projects` button.
- The module shows loading and empty states for both project list and delay details.
- The delayed count badge and status tags are intentionally high-contrast for readability.

## Local Development

From the `scrumai-frontend` folder:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Notes

- The frontend assumes the backend returns JSON.
- If the project list appears empty, confirm the browser has a valid `workspaceId` in localStorage after login.
- If delays do not appear, confirm the backend returns the selected project's tasks and alerts for the current workspace.
