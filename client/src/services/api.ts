/**
 * API Client Service
 * Centralized HTTP client for making API requests to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

/**
 * Get the stored auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Generic fetch function for API requests
 * Automatically handles Content-Type for JSON vs FormData
 * Automatically includes Authorization header when token is available
 */
export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    // Build headers - don't set Content-Type for FormData (browser will set it with boundary)
    const headers: HeadersInit = { ...options?.headers };
    const isFormData = options?.body instanceof FormData;
    
    if (!isFormData && !headers['Content-Type' as keyof HeadersInit]) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
    
    // Add Authorization header if token is available
    const token = getAuthToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      // Log token prefix for debugging (first 20 chars only for security)
      if (import.meta.env.DEV) {
        console.debug(`[API] Sending request to ${endpoint} with token: ${token.substring(0, 20)}...`);
      }
    } else {
      console.warn(`[API] No auth token found for request to ${endpoint}`);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `HTTP Error: ${response.status}`;
      console.error(`[API] Request failed: ${endpoint}`, {
        status: response.status,
        error: errorMessage,
        errorData,
      });
      throw new APIError(errorMessage, response.status);
    }
    
    const data = await response.json();
    if (import.meta.env.DEV) {
      console.debug(`[API] Request successful: ${endpoint}`, data);
    }
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

/**
 * GET request helper
 */
export function get<T>(endpoint: string): Promise<T> {
  return fetchAPI<T>(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export function post<T>(endpoint: string, data: unknown): Promise<T> {
  return fetchAPI<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request helper
 */
export function put<T>(endpoint: string, data: unknown): Promise<T> {
  return fetchAPI<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export function del<T>(endpoint: string): Promise<T> {
  return fetchAPI<T>(endpoint, { method: 'DELETE' });
}

export default { fetchAPI, get, post, put, del, APIError };
