import axios from 'axios';

// Configure the base URL for your FastAPI backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8008';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Making API request to:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API response received:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions
export const modelsAPI = {
  // Get all models
  getModels: () => api.get('/connect/models'),
  
  // Create a new model
  createModel: (modelData) => api.post('/connect/models', null, { params: modelData }),
  
  // Delete a model
  deleteModel: (assetId) => api.delete('/connect/models', { params: { asset_id: assetId } }),
};

export const streamsAPI = {
  // Get all streams
  getStreams: () => api.get('/connect/streams'),
};

export default api;