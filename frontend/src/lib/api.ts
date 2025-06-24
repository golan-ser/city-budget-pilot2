// API utility functions with authentication
const DEMO_TOKEN = 'DEMO_SECURE_TOKEN_2024';

// Get auth token from localStorage or use demo token as fallback
const getAuthToken = () => {
  return localStorage.getItem('authToken') || DEMO_TOKEN;
};

// Default headers with auth token
const getHeaders = (additionalHeaders: Record<string, string> = {}) => {
  const token = getAuthToken();
  return {
    'x-demo-token': token, // Keep using x-demo-token header for compatibility
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
};

// Authenticated fetch wrapper
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const { headers = {}, ...otherOptions } = options;
  
  return fetch(url, {
    ...otherOptions,
    headers: {
      ...getHeaders(),
      ...headers
    }
  });
};

// Common API methods
export const api = {
  get: (url: string, options: RequestInit = {}) => 
    apiRequest(url, { ...options, method: 'GET' }),
  
  post: (url: string, body?: any, options: RequestInit = {}) =>
    apiRequest(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }),
  
  put: (url: string, body?: any, options: RequestInit = {}) =>
    apiRequest(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    }),
  
  delete: (url: string, options: RequestInit = {}) =>
    apiRequest(url, { ...options, method: 'DELETE' })
}; 