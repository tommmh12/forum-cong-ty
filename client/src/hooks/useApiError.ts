import { useState, useCallback, useRef } from 'react';
import { APIError } from '../services/api';

/**
 * User-friendly error messages for common API errors
 * Requirement 10.5: Display appropriate error message to user
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The resource may have been modified.',
  422: 'The provided data is invalid. Please check and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'An unexpected server error occurred. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again later.',
  0: 'Network error. Please check your internet connection.',
};

/**
 * Get user-friendly error message from error
 */
export function getUserFriendlyMessage(error: Error | APIError | null): string {
  if (!error) return '';
  
  if (error instanceof APIError) {
    // Use specific message if available, otherwise use status-based message
    if (error.message && !error.message.startsWith('HTTP Error:')) {
      return error.message;
    }
    return ERROR_MESSAGES[error.status] || `An error occurred (${error.status})`;
  }
  
  // Handle network errors
  if (error.message === 'Network error' || error.message === 'Failed to fetch') {
    return ERROR_MESSAGES[0];
  }
  
  return error.message || 'An unexpected error occurred';
}

/**
 * Standardized API error type for hooks
 */
export interface ApiError {
  message: string;
  userMessage: string;
  status: number;
  originalError: Error;
}

/**
 * Convert any error to standardized ApiError
 */
export function toApiError(err: unknown): ApiError {
  const error = err instanceof Error ? err : new Error(String(err));
  const status = err instanceof APIError ? err.status : 0;
  
  return {
    message: error.message,
    userMessage: getUserFriendlyMessage(error),
    status,
    originalError: error,
  };
}

/**
 * Options for useApiError hook
 */
export interface UseApiErrorOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay between retries in ms (will be multiplied by attempt number) */
  retryDelay?: number;
  /** HTTP status codes that should trigger a retry */
  retryableStatuses?: number[];
}

const DEFAULT_OPTIONS: Required<UseApiErrorOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504, 0], // Timeout, rate limit, server errors, network
};

/**
 * Hook for consistent error handling with retry logic
 * Requirement 10.5: WHEN any hook encounters an error THEN the Real_Data_System SHALL display appropriate error message to user
 */
export function useApiError(options: UseApiErrorOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handle an error and optionally trigger retry
   */
  const handleError = useCallback((err: unknown, onRetry?: () => Promise<void>) => {
    const apiError = toApiError(err);
    setError(apiError);

    // Check if we should retry
    const shouldRetry = 
      onRetry && 
      retryCount < opts.maxRetries && 
      opts.retryableStatuses.includes(apiError.status);

    if (shouldRetry) {
      const delay = opts.retryDelay * (retryCount + 1); // Exponential backoff
      retryTimeoutRef.current = setTimeout(async () => {
        setRetryCount(prev => prev + 1);
        try {
          await onRetry();
          clearError();
        } catch (retryErr) {
          // Error will be handled by the next call to handleError
        }
      }, delay);
    }
  }, [retryCount, opts.maxRetries, opts.retryDelay, opts.retryableStatuses, clearError]);

  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(<T>(
    fn: () => Promise<T>,
    options?: { enableRetry?: boolean }
  ): Promise<T> => {
    return fn().catch(err => {
      const retryFn = options?.enableRetry ? async () => { await fn(); } : undefined;
      handleError(err, retryFn);
      throw err;
    });
  }, [handleError]);

  return {
    error,
    userMessage: error?.userMessage || null,
    status: error?.status || null,
    retryCount,
    isRetrying: retryCount > 0 && retryCount < opts.maxRetries,
    clearError,
    handleError,
    withErrorHandling,
  };
}

export default useApiError;
