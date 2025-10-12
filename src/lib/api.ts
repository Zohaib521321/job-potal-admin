/**
 * API Utility Functions
 * Centralized API calls with API key authentication, error handling, and XSS prevention
 */

import { parseError, sanitizeInput } from './errorHandler';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

/**
 * Get default headers with API key
 */
function getHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  // Add API key if configured
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  } else {
    console.warn('⚠️ NEXT_PUBLIC_API_KEY not configured. API calls may fail.');
  }

  return headers;
}

/**
 * Sanitize object values to prevent XSS
 */
function sanitizeObject(obj: any): any {
  if (!obj) return obj;
  if (typeof obj === 'string') return sanitizeInput(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Generic API request function with error handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: getHeaders(options?.headers as Record<string, string>),
    });

    const data = await response.json();

    if (!response.ok) {
      const error: any = new Error(data.error?.message || 'API request failed');
      error.statusCode = data.error?.statusCode || response.status;
      error.details = data.error?.details;
      throw error;
    }

    return data;
  } catch (error: any) {
    // Network errors
    if (error.name === 'TypeError' && !error.statusCode) {
      const networkError: any = new Error('Network error. Please check your internet connection.');
      networkError.statusCode = 0;
      throw networkError;
    }
    throw error;
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request with XSS prevention
 */
export async function apiPost<T = any>(
  endpoint: string,
  body?: any
): Promise<T> {
  // Sanitize body to prevent XSS
  const sanitizedBody = sanitizeObject(body);
  
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(sanitizedBody),
  });
}

/**
 * PUT request with XSS prevention
 */
export async function apiPut<T = any>(
  endpoint: string,
  body?: any
): Promise<T> {
  // Sanitize body to prevent XSS
  const sanitizedBody = sanitizeObject(body);
  
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(sanitizedBody),
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * Legacy fetch with API key (for direct use)
 */
export function fetchWithApiKey(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  return fetch(url, {
    ...options,
    headers: getHeaders(options?.headers as Record<string, string>),
  });
}

export { API_URL };

