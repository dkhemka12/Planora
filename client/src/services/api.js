/**
 * Planora API Service
 * Centralized client-side API communication layer with token management and async/await.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get stored JWT token
 */
export const getToken = () => localStorage.getItem('planora_token');

/**
 * Set JWT token in localStorage
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('planora_token', token);
  } else {
    localStorage.removeItem('planora_token');
  }
};

/**
 * Get stored user profile
 */
export const getUser = () => {
  const user = localStorage.getItem('planora_user');
  return user ? JSON.parse(user) : null;
};

/**
 * Set stored user profile
 */
export const setUser = (user) => {
  if (user) {
    localStorage.setItem('planora_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('planora_user');
  }
};

/**
 * Remove auth session
 */
export const clearAuth = () => {
  localStorage.removeItem('planora_token');
  localStorage.removeItem('planora_user');
};

/**
 * Generic fetch wrapper with auth header injection and standardized error throwing
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// Authentication API
export const authAPI = {
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  getProfile: () => apiRequest('/auth/me', { method: 'GET' }),
};

// Subjects API
export const subjectAPI = {
  getAll: () => apiRequest('/subjects', { method: 'GET' }),
  getById: (id) => apiRequest(`/subjects/${id}`, { method: 'GET' }),
  create: (data) => apiRequest('/subjects', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/subjects/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/subjects/${id}`, { method: 'DELETE' }),
};

// Tasks API
export const taskAPI = {
  getAll: (params = '') => apiRequest(`/tasks${params ? `?${params}` : ''}`, { method: 'GET' }),
  getById: (id) => apiRequest(`/tasks/${id}`, { method: 'GET' }),
  create: (data) => apiRequest('/tasks', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/tasks/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/tasks/${id}`, { method: 'DELETE' }),
};

// AI API
export const aiAPI = {
  generatePlan: (planInput) => apiRequest('/ai/study-plan', { method: 'POST', body: planInput }),
  explainConcept: (conceptInput) => apiRequest('/ai/explain', { method: 'POST', body: conceptInput }),
};

// Study Plans API
export const studyPlanAPI = {
  getAll: () => apiRequest('/study-plans', { method: 'GET' }),
  getById: (id) => apiRequest(`/study-plans/${id}`, { method: 'GET' }),
  create: (planData) => apiRequest('/study-plans', { method: 'POST', body: planData }),
  delete: (id) => apiRequest(`/study-plans/${id}`, { method: 'DELETE' }),
};
