import axios from 'axios';  // HTTP client for API calls

  // API Configuration
const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:5000';

  // Ensure URL doesn't end with slash for consistent API calls
const normalizedURL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

  // Create axios instance with default configuration
const api = axios.create({  // API call to backend
  baseURL: normalizedURL,
  timeout: 15000,  // Reduced timeout to 15 seconds for better UX
  headers: {
    'Content-Type': 'application/json',
  }
  // IMPORTANT: Use axios default validateStatus (2xx). This ensures 401/403
  // trigger the error interceptor so we can refresh tokens and redirect.
});

  // Add retry functionality for network errors
const MAX_RETRIES = 2;  // Reduced retries for faster feedback
const RETRY_DELAY = 800;  // Reduced delay

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async (config, retryCount = 0) => {
  try {
    return await api(config);
  } catch (error) {
  // Retry on network errors or server errors (5xx)
    const shouldRetry = retryCount < MAX_RETRIES && (
      !error.response || 
      error.response.status >= 500 || 
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      error.message.includes('timeout') ||
      error.message.includes('Network Error')
    );
    
    if (shouldRetry) {
      if (import.meta.env.DEV) {
        console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`, error.message);
      }
      await sleep(RETRY_DELAY * (retryCount + 1));
      return retryRequest(config, retryCount + 1);
    }
    throw error;
  }
};

  // Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    try {
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      if (user.access_token) {
        config.headers.Authorization = `Bearer ${user.access_token}`;
        if (import.meta.env.DEV) {
          console.log(`Adding auth token to ${config.method?.toUpperCase()} ${config.url}`);
        }
      } else if (import.meta.env.DEV) {
        console.log(`No auth token found for ${config.method?.toUpperCase()} ${config.url}`);
      }
    } catch (error) {
      console.warn('Failed to parse auth user from localStorage:', error);
      localStorage.removeItem('auth_user');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

  // Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

  // Handle network errors (no response received)
    if (!error.response) {
      if (import.meta.env.DEV) {
        console.error('Network error:', error.message);
      }
      
  // Provide more specific error messages based on error type
      let errorMessage = 'Network error - please check your connection';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Unable to connect to server - please ensure the backend is running';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Server not found - please check the API endpoint configuration';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection timeout - please try again';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
      }
      
      return Promise.reject({
        message: errorMessage,
        status: 0,
        isNetworkError: true,
        originalError: error
      });
    }

  // Handle specific HTTP status codes
    switch (error.response.status) {
      case 401: {
  // Token expired - attempt to refresh if not already retrying
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
            if (user.refresh_token) {
              const response = await axios.post(  // API call to backend
                `${normalizedURL}/v1/token/refresh`,
                {},
                {
                  headers: { Authorization: `Bearer ${user.refresh_token}` }
                }
              );
              
              const newTokens = response.data;
              const updatedUser = { ...user, ...newTokens };
              localStorage.setItem('auth_user', JSON.stringify(updatedUser));
              
  // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
  // Refresh failed - redirect to login
            localStorage.removeItem('auth_user');
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && currentPath !== '/register') {
              const { default: globalRouter } = await import('../GlobalRouter');
              globalRouter.navigate('/login');
            }
            return Promise.reject(refreshError);
          }
        }
        
  // If retry failed or no refresh token, redirect to login
        localStorage.removeItem('auth_user');
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          const { default: globalRouter } = await import('../GlobalRouter');
          globalRouter.navigate('/login');
        }
        break;
      }
      case 403:
        if (import.meta.env.DEV) {
          console.error('Access forbidden:', error.response.data);
        }
        break;
      case 404:
        if (import.meta.env.DEV) {
          console.error('Resource not found:', error.response.data);
        }
        break;
      case 422:
        if (import.meta.env.DEV) {
          console.error('Validation error:', error.response.data);
        }
        break;
      case 429:
        if (import.meta.env.DEV) {
          console.error('Rate limit exceeded:', error.response.data);
        }
        break;
      case 500:
        if (import.meta.env.DEV) {
          console.error('Server error:', error.response.data);
        }
        break;
      case 503:
        if (import.meta.env.DEV) {
          console.error('Service unavailable:', error.response.data);
        }
        break;
      default:
        if (import.meta.env.DEV) {
          console.error('API error:', error.response.data);
        }
    }
    
    return Promise.reject(error);
  }
);

  // Connection status checker
export const checkConnection = async () => {  // Export for use in other modules
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return { 
      isConnected: true, 
      status: response.data.status,
      message: 'Connected to server'
    };
  } catch (error) {
    let message = 'Unable to connect to server';
    
    if (error.code === 'ECONNREFUSED') {
      message = 'Server is not running or unreachable';
    } else if (error.code === 'ENOTFOUND') {
      message = 'Server not found - check API endpoint configuration';
    } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      message = 'Connection timeout - server may be overloaded';
    } else if (error.response?.status >= 500) {
      message = 'Server error - please try again later';
    } else if (!navigator.onLine) {
      message = 'No internet connection';
    }
    
    return { 
      isConnected: false, 
      error: error.message,
      message: message
    };
  }
};

  // Enhanced API with retry capability
export const apiWithRetry = {  // Export for use in other modules
  get: (url, config = {}) => retryRequest({ ...config, method: 'GET', url }),
  post: (url, data, config = {}) => retryRequest({ ...config, method: 'POST', url, data }),
  put: (url, data, config = {}) => retryRequest({ ...config, method: 'PUT', url, data }),
  patch: (url, data, config = {}) => retryRequest({ ...config, method: 'PATCH', url, data }),
  delete: (url, config = {}) => retryRequest({ ...config, method: 'DELETE', url }),
};

export default api;  // Export for use in other modules
