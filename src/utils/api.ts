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

  // Admin-specific API methods
  admin: {
    getUsers: async (page: number = 1, limit: number = 10, search?: string, role?: string, authToken?: string) => {
      let url = `/api/admin/users?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (role) url += `&role=${encodeURIComponent(role)}`;

      const response = await fetch(`${BACKEND_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'x-auth-token': `${authToken}` } : {}),
        },
      });
      return response;
    },

    updateUserRole: async (userId: string, role: string, authToken?: string) => {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': `${authToken}`,
        },
        body: JSON.stringify({ role }),
      });
      return response;
    },

    suspendUser: async (userId: string, authToken?: string) => {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': `${authToken}`,
        },
      });
      return response;
    },

    getSessions: async (page: number = 1, limit: number = 10, search?: string, isActive?: boolean, authToken?: string) => {
      let url = `/api/admin/sessions?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (isActive !== undefined) url += `&isActive=${isActive}`;

      const response = await fetch(`${BACKEND_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'x-auth-token': `${authToken}` } : {}),
        },
      });
      return response;
    },

    getStats: async (authToken?: string) => {
      const response = await fetch(`${BACKEND_URL}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'x-auth-token': `${authToken}` } : {}),
        },
      });
      return response;
    },

    getReports: async (page: number = 1, limit: number = 10, search?: string, status?: string, authToken?: string) => {
      let url = `/api/admin/reports?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;

      const response = await fetch(`${BACKEND_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'x-auth-token': `${authToken}` } : {}),
        },
      });
      return response;
    },

    updateReportStatus: async (reportId: string, status: string, resolutionNotes?: string, authToken?: string) => {
      const response = await fetch(`${BACKEND_URL}/api/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': `${authToken}`,
        },
        body: JSON.stringify({ status, resolutionNotes }),
      });
      return response;
    }
  }
};

export default apiClient;