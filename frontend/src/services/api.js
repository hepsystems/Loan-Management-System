import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(error.response.data?.message || 'An error occurred');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user') || 'null');
  },
};

// Loan services
export const loanService = {
  apply: async (loanData) => {
    const response = await api.post('/loans/apply', loanData);
    return response.data;
  },

  getUserLoans: async () => {
    const response = await api.get('/loans/my-loans');
    return response.data;
  },

  getLoanDetails: async (loanId) => {
    const response = await api.get(`/loans/${loanId}`);
    return response.data;
  },

  updateLoan: async (loanId, updates) => {
    const response = await api.put(`/loans/${loanId}`, updates);
    return response.data;
  },

  // Admin/Officer methods
  getAllLoans: async (filters = {}) => {
    const response = await api.get('/loans', { params: filters });
    return response.data;
  },

  approveLoan: async (loanId, approvalData) => {
    const response = await api.post(`/loans/${loanId}/approve`, approvalData);
    return response.data;
  },

  rejectLoan: async (loanId, reason) => {
    const response = await api.post(`/loans/${loanId}/reject`, { reason });
    return response.data;
  },

  disburseLoan: async (loanId, disbursementData) => {
    const response = await api.post(`/loans/${loanId}/disburse`, disbursementData);
    return response.data;
  },
};

// Verification services
export const verificationService = {
  startVerification: async (applicationId) => {
    const response = await api.post(`/verifications/${applicationId}/start`);
    return response.data;
  },

  submitPhoto: async (applicationId, photoData) => {
    const response = await api.post(`/verifications/${applicationId}/photo`, photoData);
    return response.data;
  },

  submitLocation: async (applicationId, locationData) => {
    const response = await api.post(`/verifications/${applicationId}/location`, locationData);
    return response.data;
  },

  submitWitness: async (applicationId, witnessData) => {
    const response = await api.post(`/verifications/${applicationId}/witness`, witnessData);
    return response.data;
  },

  submitID: async (applicationId, idData) => {
    const response = await api.post(`/verifications/${applicationId}/id`, idData);
    return response.data;
  },

  submitMobileMoney: async (applicationId, mobileData) => {
    const response = await api.post(`/verifications/${applicationId}/mobile-money`, mobileData);
    return response.data;
  },

  getVerificationStatus: async (applicationId) => {
    const response = await api.get(`/verifications/${applicationId}/status`);
    return response.data;
  },
};

// Admin services
export const adminService = {
  // User management
  getUsers: async (filters = {}) => {
    const response = await api.get('/admin/users', { params: filters });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (userId, updates) => {
    const response = await api.put(`/admin/users/${userId}`, updates);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Analytics
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getLoanAnalytics: async (period = 'monthly') => {
    const response = await api.get('/admin/analytics/loans', { params: { period } });
    return response.data;
  },

  // Settings
  updateSystemSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },

  getSystemSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },
};

// File upload service
export const uploadService = {
  uploadFile: async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadMultiple: async (files, type) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    formData.append('type', type);

    const response = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
