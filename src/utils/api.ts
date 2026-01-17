// API utility functions for backend communication

const BACKEND_URL = 'http://localhost:5000'; // Backend server URL

export const apiClient = {
  get: async (endpoint: string, authToken?: string, options: RequestInit = {}) => {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
      ...options,
    });
    return response;
  },

  post: async (endpoint: string, data?: any, authToken?: string, options: RequestInit = {}) => {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return response;
  },

  put: async (endpoint: string, data?: any, authToken?: string, options: RequestInit = {}) => {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return response;
  },

  delete: async (endpoint: string, authToken?: string, options: RequestInit = {}) => {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
      ...options,
    });
    return response;
  },
};

export default apiClient;