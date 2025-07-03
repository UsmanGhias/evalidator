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

// Request interceptor
api.interceptors.request.use(
  (config) => {
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

// API functions
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
  const response = await axios.get(`${API_BASE_URL}/api/download/${jobId}`, {
    responseType: 'blob',
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

export const getStats = async () => {
  return await api.get('/api/stats');
};

export const healthCheck = async () => {
  return await api.get('/api/health');
};

export default api; 