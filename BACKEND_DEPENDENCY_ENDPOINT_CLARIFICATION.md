# Backend Dependency Endpoint Clarification Request

## Current Status
The frontend `DependencyMapper` component is attempting to fetch project dependencies, but **the endpoint is not yet defined in the API configuration**.

## Frontend Current Implementation

### Component Calling the Endpoint
- **File**: [src/components/portal/DependencyMapper.jsx](src/components/portal/DependencyMapper.jsx)
- **Line**: ~315-320
- **Call Pattern**:
```javascript
const response = await apiRequest(
  LOGIN_ENDPOINTS.dependencies.getByProject(selectedProjectId),
  { method: "GET" }
);
```

### Expected Response Structure
The frontend component expects and normalizes the following response format:
```javascript
// Response can be one of:
// 1. Array directly: [{...}, {...}]
// 2. Object with dependencies property: {dependencies: [{...}, {...}]}

// Each dependency object should contain:
{
  predecessor_id: Number,           // ID of the task that must be completed first
  successor_id: Number,             // ID of the task that depends on predecessor
  confidence_score: Number,          // Optional: confidence score (0-1 or 0-100)
  source: String,                    // Optional: source of the dependency (e.g., "ML", "MANUAL")
  predecessor_status: String         // Optional: status of predecessor task
}
```

### Alternative Field Names Supported
The frontend gracefully handles multiple field naming conventions:
- **Dependency IDs**: `predecessor_id`, `predecessor.id`, `from_task_id`, `from`, `to_task_id`, `to`, `successor_id`, `successor.id`
- **Confidence**: `confidence_score`, `confidence`
- **Source**: `source`, `model_source`, `dependency_source`
- **Status**: `predecessor_status`, `predecessor.status`

---

## Questions for Backend Team

### 1. **Endpoint Path/URL**
   - What is the exact endpoint path for fetching dependencies of a specific project?
   - Example format needed: 
     - `/api/dependencies/project/{projectId}/`
     - `/api/dependencies/projects/{projectId}/`
     - Something else?

### 2. **Request Method**
   - Is it **GET**, POST, or another method?
   - Any query parameters needed? (e.g., filters, pagination)

### 3. **Response Structure**
   - What is the **exact JSON response format**?
   - Is it:
     - Direct array: `[{dependency1}, {dependency2}]`
     - Wrapped object: `{dependencies: [{...}]}`
     - Another format?
   - **List all response fields** with their types and meanings

### 4. **Endpoint Status**
   - Does this endpoint **already exist** in the backend?
   - Is it **fully implemented and working**?
   - If not, when is it expected to be available?

### 5. **Authentication & Headers**
   - Does this endpoint require any specific headers besides:
     - `Authorization: Bearer {token}`
     - `Workspace-ID: {workspaceId}`
   - Any rate limiting or pagination requirements?

---

## Frontend Configuration Status

### Missing Configuration
The `LOGIN_ENDPOINTS` object in [src/config/api.js](src/config/api.js) is missing the dependencies endpoint:

```javascript
// NOT YET DEFINED - needs to be added:
dependencies: {
  getByProject: (projectId) => `{ENDPOINT_PATH}`,
}
```

### Next Steps
Once backend confirms the endpoint details, frontend will:
1. Add the endpoint to `LOGIN_ENDPOINTS.dependencies`
2. Update DependencyMapper component if response format differs from expectations
3. Add error handling for missing or malformed responses

---

## Related Components
- **Primary Consumer**: [DependencyMapper.jsx](src/components/portal/DependencyMapper.jsx)
- **API Config**: [src/config/api.js](src/config/api.js)
- **Other Consumer**: [DependencyMonitor.jsx](src/components/scrum-master/DependencyMonitor.jsx) (if applicable)

---

**Please provide the endpoint details so we can update the frontend configuration accordingly.**
