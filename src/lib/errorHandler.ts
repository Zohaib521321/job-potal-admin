/**
 * Error Handling Utilities for Frontend
 * Provides consistent error handling and user-friendly messages
 */

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: unknown;
}

interface ErrorWithResponse {
  response?: {
    data?: {
      error?: {
        message?: string;
        statusCode?: number;
        details?: unknown;
      };
    };
  };
  message?: string;
  statusCode?: number;
  name?: string;
}

/**
 * Parse error from API response or catch block
 */
export function parseError(error: unknown): ApiError {
  const err = error as ErrorWithResponse;
  
  // API error response
  if (err?.response?.data?.error) {
    return {
      message: err.response.data.error.message || 'An error occurred',
      statusCode: err.response.data.error.statusCode,
      details: err.response.data.error.details,
    };
  }

  // Error with message property
  if (err?.message) {
    return {
      message: err.message,
      statusCode: err.statusCode,
    };
  }

  // Network error
  if (err?.name === 'TypeError' && err.message?.includes('fetch')) {
    return {
      message: 'Network error. Please check your internet connection.',
      statusCode: 0,
    };
  }

  // Rate limiting error
  if (err?.statusCode === 429) {
    return {
      message: 'Too many requests. Please wait a moment and try again.',
      statusCode: 429,
    };
  }

  // Unknown error
  return {
    message: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Get user-friendly error message based on status code
 */
export function getUserFriendlyMessage(statusCode?: number, defaultMessage?: string): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'Authentication required. Please log in.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This item already exists. Please use a different name.',
    422: 'The data provided is invalid. Please check and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. Please try again later.',
    503: 'Service temporarily unavailable. Please try again later.',
  };

  if (statusCode && messages[statusCode]) {
    return messages[statusCode];
  }

  return defaultMessage || 'An error occurred. Please try again.';
}

/**
 * Log error for debugging (development only)
 */
export function logError(error: unknown, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`Error${context ? ` in ${context}` : ''}`);
    console.error('Error object:', error);
    console.error('Parsed:', parseError(error));
    console.groupEnd();
  }
}

/**
 * Handle API error with user notification
 */
export function handleApiError(
  error: unknown,
  setError: (message: string) => void,
  context?: string
): void {
  const parsedError = parseError(error);
  const userMessage = getUserFriendlyMessage(parsedError.statusCode, parsedError.message);
  
  setError(userMessage);
  logError(error, context);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags
  return input
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate required fields
 */
export function validateRequired(
  fields: Record<string, unknown>,
  fieldNames: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = fieldNames.filter(field => !fields[field] || String(fields[field]).trim() === '');
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Format validation error message
 */
export function getValidationMessage(missingFields: string[]): string {
  if (missingFields.length === 0) return '';
  if (missingFields.length === 1) return `${missingFields[0]} is required.`;
  
  const formatted = missingFields.map(field => 
    field.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
  );
  
  return `Please fill in: ${formatted.join(', ')}`;
}

interface ErrorWithStatusCode {
  statusCode?: number;
}

/**
 * Retry API request with exponential backoff
 */
export async function retryApiRequest<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      const err = error as ErrorWithStatusCode;
      
      // Don't retry client errors (4xx)
      if (err?.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (i === maxRetries - 1) {
        break;
      }

      // Wait before retry (exponential backoff)
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}


