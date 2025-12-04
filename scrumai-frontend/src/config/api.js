// API Configuration
// Base URL for the backend API - Update this when backend is deployed
const API_BASE_URL =  'http://127.0.0.1:8000/';

// API Endpoints
export const LOGIN_ENDPOINTS = {
  // Authentication Endpoints
  auth: {
    login: `${API_BASE_URL}userstories/login/`,
    signup: `${API_BASE_URL}userstories/create/`,
  },

  // User Stories / Backlog Endpoints
  userStories: {
    getAll: `${API_BASE_URL}userstories/tasks/`, // Get all tasks with user stories
    create: `${API_BASE_URL}/userstories`,
    createBulk: `${API_BASE_URL}/userstories/bulk`,
    upload: `${API_BASE_URL}userstories/create_backlog/`, // Upload with FormData
    getById: (id) => `${API_BASE_URL}/userstories/${id}`,
    update: (id) => `${API_BASE_URL}/userstories/${id}`,
    delete: (id) => `${API_BASE_URL}/userstories/${id}`,
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
    getAll: `${API_BASE_URL}/sprints`,
    create: `${API_BASE_URL}/sprints`,
    getById: (id) => `${API_BASE_URL}/sprints/${id}`,
    update: (id) => `${API_BASE_URL}/sprints/${id}`,
    delete: (id) => `${API_BASE_URL}/sprints/${id}`,
  },
  projects: {
    getAll: `${API_BASE_URL}projects/`, // Get all projects
    getByOwner: (ownerId) => `${API_BASE_URL}/userstories/projects/owner/${ownerId}/`, // Get projects by owner
  },

  // Tasks Endpoints
  tasks: {
    getAll: `${API_BASE_URL}userstories/tasks/`, // Get all tasks
    getByUserStory: (userStoryId) => `${API_BASE_URL}userstories/tasks/${userStoryId}/`, // Get tasks for a user story
    update: (taskId) => `${API_BASE_URL}userstories/task/${taskId}/update/`, // Update task
    delete: (taskId) => `${API_BASE_URL}userstories/task/${taskId}/delete/`, // Delete task
  },
};

// API Helper Functions
export const apiRequest = async (url, options = {}) => {
  try {
    const token = localStorage.getItem('authToken');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
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


