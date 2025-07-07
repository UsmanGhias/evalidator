import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.reload();
      throw new Error('Authentication required. Please log in again.');
    }
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'Server error';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// Authentication functions
export const register = async (email, password) => {
  return await api.post('/api/auth/register', { email, password });
};

export const login = async (email, password) => {
  return await api.post('/api/auth/login', { email, password });
};

export const getCurrentUser = async () => {
  return await api.get('/api/auth/me');
};

// Email validation functions
export const validateEmails = async (emails, file) => {
  const formData = new FormData();
  
  if (file) {
    formData.append('file', file);
  } else if (emails) {
    formData.append('emails', emails);
  }
  
  return await api.post('/api/validate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const validateEmailsAnonymous = async (emails, file) => {
  const formData = new FormData();
  
  if (file) {
    formData.append('file', file);
  } else if (emails) {
    formData.append('emails', emails);
  }
  
  return await api.post('/api/validate/anonymous', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getJobStatus = async (jobId) => {
  return await api.get(`/api/status/${jobId}`);
};

export const getResults = async (jobId, page = 1, perPage = 50, statusFilter = '') => {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  
  if (statusFilter) {
    params.append('status', statusFilter);
  }
  
  return await api.get(`/api/results/${jobId}?${params}`);
};

export const downloadResults = async (jobId) => {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${API_BASE_URL}/api/download/${jobId}`, {
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  // Create blob link to download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `email_validation_results_${jobId.slice(0, 8)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Subscription functions
export const getSubscription = async () => {
  return await api.get('/api/subscription');
};

export const upgradeSubscription = async (plan, billingCycle) => {
  return await api.post('/api/subscription', {
    action: 'upgrade',
    plan,
    billing_cycle: billingCycle,
  });
};

export const getPlans = async () => {
  return await api.get('/api/plans');
};

// Utility functions
export const healthCheck = async () => {
  return await api.get('/api/health');
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.reload();
};

export default api; 