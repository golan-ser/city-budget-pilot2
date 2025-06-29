import { supabase } from '@/supabaseClient';
import { API_BASE_URL } from './apiConfig';

// Get auth token from Supabase or use fallback
const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || localStorage.getItem('authToken') || null;
  } catch (error) {
    console.warn('Failed to get auth token:', error);
    return localStorage.getItem('authToken') || null;
  }
};

// Default headers with auth token
const getHeaders = async (additionalHeaders: Record<string, string> = {}) => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Force demo token for now until auth is properly configured
    'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
    ...additionalHeaders
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Handle CORS preflight requests
const handleCorsError = (error: any, url: string) => {
  console.warn(`CORS error for ${url}:`, error);
  console.warn('📋 API not available, using fallback or default data');
  return null;
};

// Authenticated fetch wrapper with CORS handling
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const { headers = {}, ...otherOptions } = options;
  
  // Check for undefined or invalid URLs
  if (!url || url === 'undefined' || url.includes('undefined')) {
    console.error('❌ API Request Error: Invalid URL detected', { url, API_BASE_URL });
    throw new Error(`Invalid API URL: "${url}". Check API_ENDPOINTS configuration.`);
  }
  
  // Handle relative URLs
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  // Additional check for the full URL
  if (!fullUrl || fullUrl.includes('undefined')) {
    console.error('❌ API Request Error: Invalid full URL', { fullUrl, API_BASE_URL, originalUrl: url });
    throw new Error(`Invalid full API URL: "${fullUrl}". Check API_BASE_URL configuration.`);
  }
  
  try {
    const response = await fetch(fullUrl, {
      ...otherOptions,
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit', // Don't send credentials for cross-origin requests
      headers: {
        ...(await getHeaders()),
        ...headers
      }
    });

    if (!response.ok) {
      console.warn(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('Network error or CORS issue:', error);
      handleCorsError(error, fullUrl);
      throw new Error(`Network error: Unable to connect to API at ${fullUrl}`);
    }
    throw error;
  }
};

// Common API methods with error handling
export const api = {
  get: async (url: string, options: RequestInit = {}) => {
    try {
      const response = await apiRequest(url, { ...options, method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`Expected JSON but got ${contentType}: ${text.substring(0, 200)}...`);
        throw new Error(`Invalid response format: expected JSON, got ${contentType}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`GET ${url} failed:`, error);
      throw error;
    }
  },
  
  post: async (url: string, body?: any, options: RequestInit = {}) => {
    try {
      const response = await apiRequest(url, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`POST ${url} failed:`, error);
      throw error;
    }
  },
  
  put: async (url: string, body?: any, options: RequestInit = {}) => {
    try {
      const response = await apiRequest(url, {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`PUT ${url} failed:`, error);
      throw error;
    }
  },
  
  delete: async (url: string, options: RequestInit = {}) => {
    try {
      const response = await apiRequest(url, { ...options, method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      // DELETE might not return JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error(`DELETE ${url} failed:`, error);
      throw error;
    }
  }
}; 