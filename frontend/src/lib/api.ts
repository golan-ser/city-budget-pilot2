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
    ...additionalHeaders
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Authenticated fetch wrapper
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const { headers = {}, ...otherOptions } = options;
  
  // Handle relative URLs
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  return fetch(fullUrl, {
    ...otherOptions,
    headers: {
      ...(await getHeaders()),
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