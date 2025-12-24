// API Base Url uses Vite proxy in development
const API_BASE_URL = '/api';


const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  // Handle 401 unauthorized
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await response.json().catch(() => null);
  
  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }
  
  return { data, status: response.status };
};

// Auth API
export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};

// Project API
export const projectAPI = {
  getAll: () => apiRequest('/projects'),
  getById: (id) => apiRequest(`/projects/${id}`),
  create: (data) => apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Task API
export const taskAPI = {
  getByProject: (projectId) => apiRequest(`/projects/${projectId}/tasks`),
  create: (projectId, data) => apiRequest(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  complete: (projectId, taskId) => apiRequest(`/projects/${projectId}/tasks/${taskId}/complete`, {
    method: 'PUT',
  }),
  toggle: (projectId, taskId) => apiRequest(`/projects/${projectId}/tasks/${taskId}/toggle`, {
    method: 'PUT',
  }),
  delete: (projectId, taskId) => apiRequest(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
  }),
};