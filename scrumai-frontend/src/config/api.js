// API Configuration
// Base URL for the backend API - Update this when backend is deployed
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication Endpoints
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    signup: `${API_BASE_URL}/auth/signup`,
    logout: `${API_BASE_URL}/auth/logout`,
    verifyToken: `${API_BASE_URL}/auth/verify`,
  },

  // User Stories / Backlog Endpoints
  userStories: {
    getAll: `${API_BASE_URL}/user-stories`,
    create: `${API_BASE_URL}/user-stories`,
    createBulk: `${API_BASE_URL}/user-stories/bulk`,
    getById: (id) => `${API_BASE_URL}/user-stories/${id}`,
    update: (id) => `${API_BASE_URL}/user-stories/${id}`,
    delete: (id) => `${API_BASE_URL}/user-stories/${id}`,
  },

  // Backlog Endpoints
  backlog: {
    getAll: `${API_BASE_URL}/backlog`,
    getById: (id) => `${API_BASE_URL}/backlog/${id}`,
    update: (id) => `${API_BASE_URL}/backlog/${id}`,
    delete: (id) => `${API_BASE_URL}/backlog/${id}`,
  },

  // Sprint Endpoints
  sprints: {
    getAll: `${API_BASE_URL}/sprints`,
    create: `${API_BASE_URL}/sprints`,
    getById: (id) => `${API_BASE_URL}/sprints/${id}`,
    update: (id) => `${API_BASE_URL}/sprints/${id}`,
    delete: (id) => `${API_BASE_URL}/sprints/${id}`,
  },

  // Tasks Endpoints
  tasks: {
    getAll: `${API_BASE_URL}/tasks`,
    create: `${API_BASE_URL}/tasks`,
    getById: (id) => `${API_BASE_URL}/tasks/${id}`,
    update: (id) => `${API_BASE_URL}/tasks/${id}`,
    delete: (id) => `${API_BASE_URL}/tasks/${id}`,
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
    console.error('API Request Error:', error);
    throw error;
  }
};

export default API_ENDPOINTS;


