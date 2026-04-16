// API Configuration
// Base URL for the backend API
// Using direct URL since proxy may have issues
const API_BASE_URL = 'http://localhost:8000/';

// For direct backend calls (bypassing proxy), use this:
const DIRECT_API_BASE_URL = 'http://localhost:8000/';

// Match the pattern of old APIs:
// Old APIs: http://localhost:8000/userstories/...
// So module2 should be: http://localhost:8000/module2/... (if Django main urls.py has path('module2/', include(...)))
// OR: http://localhost:8000/api/module2/... (if Django main urls.py has path('api/module2/', include(...)))
// 
// Check your Django main urls.py file to see how module2 is included:
// - If it's: path('module2/', include('assignment_module.urls')) → use 'module2/'
// - If it's: path('api/module2/', include('assignment_module.urls')) → use 'api/module2/'
//
// Using direct backend URL
const MODULE2_BASE_URL = `${API_BASE_URL}api/module2/`;

// API Endpoints
export const LOGIN_ENDPOINTS = {
  // Authentication Endpoints
  auth: {
    // Admin Auth
    registerWorkspace: `${MODULE2_BASE_URL}auth/register-workspace/`,
    adminLogin: `${MODULE2_BASE_URL}auth/login/`,
    // Role Login (SM/PO/Dev)
    roleLogin: `${MODULE2_BASE_URL}auth/login-user/`,
    // Legacy endpoints
    login: `${API_BASE_URL}userstories/login/`,
    signup: `${API_BASE_URL}userstories/create/`,
  },

  // User Stories / Backlog Endpoints
  userStories: {
    getAll: `${API_BASE_URL}userstories/tasks/`, // Get all tasks with user stories
    create: `${API_BASE_URL}userstories`,
    getByOwner: (ownerId) => `${API_BASE_URL}userstories/userstories/owner/${ownerId}/`, // Get user stories by owner

    createBulk: `${API_BASE_URL}userstories/bulk`,
    upload: `${API_BASE_URL}userstories/create_backlog/`, // Upload with FormData
    getById: (id) => `${API_BASE_URL}userstories/${id}`,
    update: (id) => `${API_BASE_URL}userstories/${id}`,
    delete: (id) => `${API_BASE_URL}userstories/story/${id}/delete/`,

  },

  // // Backlog Endpoints
  // backlog: {
  //   getAll: `${API_BASE_URL}/backlog`,
  //   getById: (id) => `${API_BASE_URL}/backlog/${id}`,
  //   update: (id) => `${API_BASE_URL}/backlog/${id}`,
  //   delete: (id) => `${API_BASE_URL}/backlog/${id}`,
  // },

  // Sprint Endpoints
  sprints: {
    getAll: `${API_BASE_URL}sprints`,
    create: `${API_BASE_URL}sprints`,
    getById: (id) => `${API_BASE_URL}sprints/${id}`,
    update: (id) => `${API_BASE_URL}sprints/${id}`,
    delete: (id) => `${API_BASE_URL}sprints/${id}`,
  },
   projects: {
    getAll: `${API_BASE_URL}projects/`, // Get all projects
    getByOwner: (ownerId) => `${API_BASE_URL}userstories/projects/owner/${ownerId}/`, // Get projects by owner
    getIdByName: (name) => `${API_BASE_URL}userstories/project/id_by_name/?name=${encodeURIComponent(name)}`,
    create: `${API_BASE_URL}userstories/project/create/`, // Create project (POST)
    getUserStoryByProjectId: (projectId) => `${API_BASE_URL}userstories/us/projects/${projectId}/stories/`, // Get project for a user story
  },

  // Tasks Endpoints
  tasks: {
    getAll: `${API_BASE_URL}userstories/tasks/`, // Get all tasks
    getByUserStory: (userStoryId) => `${API_BASE_URL}userstories/tasks/${userStoryId}/`, // Get tasks for a user story
    update: (taskId) => `${API_BASE_URL}userstories/task/${taskId}/update/`, // Update task
    delete: (taskId) => `${API_BASE_URL}userstories/task/${taskId}/delete/`, // Delete task
  },

  // Team Members Endpoints (require Workspace-ID header)
  team: {
    add: `${MODULE2_BASE_URL}team/add/`, // Add team member (POST)
    getAll: `${MODULE2_BASE_URL}team/all/`, // Get all team members (GET)
    getById: (id) => `${MODULE2_BASE_URL}team/${id}/`, // Get team member by ID (GET)
    update: (id) => `${MODULE2_BASE_URL}team/update/${id}/`, // Update team member (PATCH)
    delete: (id) => `${MODULE2_BASE_URL}team/delete/${id}/`, // Delete team member (DELETE)
  },

  // Management Roles Endpoints (require Workspace-ID header)
  management: {
    addManagementUser: `${MODULE2_BASE_URL}roles/add-management-user/`, // Add Scrum Master or Product Owner (POST)
    getScrumMasters: `${MODULE2_BASE_URL}roles/get-scrum-masters/`, // Get all Scrum Masters (GET)
    getProductOwners: `${MODULE2_BASE_URL}roles/get-product-owners/`, // Get all Product Owners (GET)
    updateManagementUser: (id) => `${MODULE2_BASE_URL}roles/update-management-user/${id}/`, // Update Scrum Master or Product Owner (PATCH)
  },

  // Sprint Endpoints
  sprint: {
    list: `${API_BASE_URL}api/sprint/list/`,
    create: `${API_BASE_URL}api/sprint/create/`,
    getBacklog: (sprintId) => `${API_BASE_URL}api/sprint/${sprintId}/backlog/`,
    addTask: (sprintId) => `${API_BASE_URL}api/sprint/${sprintId}/add-task/`,
    removeTask: (sprintId, taskId) => `${API_BASE_URL}api/sprint/${sprintId}/remove-task/${taskId}/`,
    reoptimize: (sprintId) => `${API_BASE_URL}api/sprint/${sprintId}/reoptimize/`,
  },
};

// API Helper Functions
export const apiRequest = async (url, options = {}) => {
  try {
    const token = localStorage.getItem('authToken');
    const workspaceId = localStorage.getItem('workspaceId');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(workspaceId && { 'Workspace-ID': workspaceId }), // Add Workspace-ID header if available
    };

    const config = {
      ...options,
      mode: 'cors', // Enable CORS mode
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      
      if (isJson) {
        try {
          const error = await response.json();
          // Handle different error response formats
          if (error.message) {
            errorMessage = error.message;
          } else if (error.error) {
            errorMessage = error.error;
          } else if (error.detail) {
            errorMessage = error.detail;
          } else if (error.non_field_errors) {
            errorMessage = Array.isArray(error.non_field_errors) 
              ? error.non_field_errors.join(', ') 
              : error.non_field_errors;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else if (Object.keys(error).length > 0) {
            // Handle field-level errors (e.g., {email: ["This field is required"]})
            const fieldErrors = Object.entries(error)
              .map(([field, messages]) => {
                const msg = Array.isArray(messages) ? messages.join(', ') : messages;
                return `${field}: ${msg}`;
              })
              .join('; ');
            errorMessage = fieldErrors || errorMessage;
          }
        } catch (e) {
          // If JSON parsing fails, use default message
          console.error('Error parsing JSON response:', e);
        }
      } else {
        // If response is HTML (error page), try to get text
        try {
          const text = await response.text();
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            errorMessage = `Server returned HTML instead of JSON. The endpoint may not exist or there's a server error. Status: ${response.status}`;
          } else {
            errorMessage = text || errorMessage;
          }
        } catch (e) {
          // Use default error message
        }
      }
      
      throw new Error(errorMessage);
    }

    // Check if response is JSON before parsing
    if (!isJson) {
      const text = await response.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error('Server returned HTML instead of JSON. The endpoint may not exist or there\'s a server error.');
      }
      throw new Error('Response is not valid JSON');
    }

    return await response.json();
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message &&
      error.message.includes('Failed to fetch')
    ) {
      const errorMsg = 'Network error or CORS issue: Please ensure the backend server is running at ' + url + ' and CORS is enabled.';
      console.error('API Request Error:', error);
      console.error('Request URL:', url);
      console.error('Request Options:', JSON.stringify(options, null, 2));
      throw new Error(errorMsg);
    }
    console.error('API Request Error:', error);
    console.error('Request URL:', url);
    console.error('Request Options:', JSON.stringify(options, null, 2));
    throw error;
  }
};

// Sprint API Functions
export const getAllSprints = async (workspaceId) => {
  // Changed to use project-based API instead of workspace-based
  // Using project ID 1 as specified by user
  const data = await getSprintsByProject(1);
  return Array.isArray(data) ? data : [];
};

export const getSprintBacklog = async (sprintId) => {
  return await apiRequest(LOGIN_ENDPOINTS.sprint.getBacklog(sprintId));
};

export const createSprint = async (sprintData) => {
  return await apiRequest(LOGIN_ENDPOINTS.sprint.create, {
    method: 'POST',
    body: JSON.stringify(sprintData),
  });
};

export const getProjectsByWorkspace = async (workspaceId) => {
  if (!workspaceId) {
    throw new Error('workspaceId is required to fetch projects by workspace');
  }
  return await apiRequest(`${API_BASE_URL}userstories/projects/workspace/${workspaceId}/`);
};

export const getSprintsByProject = async (projectId) => {
  if (!projectId) {
    throw new Error('projectId is required to fetch sprints by project');
  }
  return await apiRequest(`${API_BASE_URL}api/sprint/project/${projectId}/sprints/`);
};

export const addTaskToSprint = async (sprintId, taskId) => {
  return await apiRequest(LOGIN_ENDPOINTS.sprint.addTask(sprintId), {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId }),
  });
};

export const updateTaskStatus = async (taskId, status, method = 'PATCH') => {
  return await apiRequest(`${API_BASE_URL}userstories/task/${taskId}/status/`, {
    method,
    body: JSON.stringify({ status }),
  });
};

export const removeTaskFromSprint = async (sprintId, taskId) => {
  return await apiRequest(LOGIN_ENDPOINTS.sprint.removeTask(sprintId, taskId), {
    method: 'DELETE',
  });
};

export const reoptimizeSprint = async (sprintId, projectId) => {
  return await apiRequest(LOGIN_ENDPOINTS.sprint.reoptimize(sprintId), {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId }),
  });
};

// API Helper Function for FormData requests
export const apiRequestFormData = async (url, formData) => {
  try {
    const token = localStorage.getItem('authToken');
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary

    const config = {
      method: 'POST',
      headers: headers,
      body: formData,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'API request failed' }));
      throw new Error(error.error || error.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message &&
      error.message.includes('Failed to fetch')
    ) {
      alert('Network error or CORS issue: Please ensure the backend server is running and CORS is enabled.');
    }
    console.error('API Request Error:', error);
    throw error;
  }
};
 
export default LOGIN_ENDPOINTS;