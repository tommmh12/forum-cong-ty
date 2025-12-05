/**
 * Property-Based Tests for Hook Error Handling
 * 
 * **Feature: real-data-migration, Property 11: Hook Error Handling**
 * **Validates: Requirements 10.5**
 * 
 * Tests that for any API error, the corresponding hook SHALL set error state
 * and not crash the application.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { APIError } from '../services/api';
import { 
  getUserFriendlyMessage, 
  toApiError, 
  ApiError 
} from './useApiError';

/**
 * Arbitrary for generating HTTP status codes
 */
const httpStatusArb = fc.oneof(
  fc.constant(400), // Bad Request
  fc.constant(401), // Unauthorized
  fc.constant(403), // Forbidden
  fc.constant(404), // Not Found
  fc.constant(409), // Conflict
  fc.constant(422), // Unprocessable Entity
  fc.constant(429), // Too Many Requests
  fc.constant(500), // Internal Server Error
  fc.constant(502), // Bad Gateway
  fc.constant(503), // Service Unavailable
  fc.constant(0),   // Network error
  fc.integer({ min: 100, max: 599 }) // Any valid HTTP status
);

/**
 * Arbitrary for generating error messages
 */
const errorMessageArb = fc.oneof(
  fc.constant('Network error'),
  fc.constant('Failed to fetch'),
  fc.constant('HTTP Error: 500'),
  fc.string({ minLength: 1, maxLength: 200 }),
  fc.constant('')
);

/**
 * Arbitrary for generating APIError instances
 */
const apiErrorArb = fc.tuple(errorMessageArb, httpStatusArb).map(
  ([message, status]) => new APIError(message || 'Unknown error', status)
);

/**
 * Arbitrary for generating generic Error instances
 */
const genericErrorArb = errorMessageArb.map(
  message => new Error(message || 'Unknown error')
);

/**
 * Arbitrary for generating any type of error
 */
const anyErrorArb = fc.oneof(
  apiErrorArb,
  genericErrorArb,
  fc.string().map(s => s), // String errors
  fc.constant(null),
  fc.constant(undefined)
);

describe('Hook Error Handling Property Tests', () => {
  /**
   * **Feature: real-data-migration, Property 11: Hook Error Handling**
   * **Validates: Requirements 10.5**
   * 
   * Property: For any APIError, getUserFriendlyMessage SHALL return a non-empty string
   */
  it('Property 11a: getUserFriendlyMessage returns non-empty string for any APIError', async () => {
    await fc.assert(
      fc.property(apiErrorArb, (error) => {
        const message = getUserFriendlyMessage(error);
        
        // Message should be a string
        expect(typeof message).toBe('string');
        
        // Message should not be empty
        expect(message.length).toBeGreaterThan(0);
        
        // Should not crash - if we got here, it didn't crash
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: real-data-migration, Property 11: Hook Error Handling**
   * **Validates: Requirements 10.5**
   * 
   * Property: For any generic Error, getUserFriendlyMessage SHALL return a non-empty string
   */
  it('Property 11b: getUserFriendlyMessage returns non-empty string for any generic Error', async () => {
    await fc.assert(
      fc.property(genericErrorArb, (error) => {
        const message = getUserFriendlyMessage(error);
        
        // Message should be a string
        expect(typeof message).toBe('string');
        
        // Message should not be empty
        expect(message.length).toBeGreaterThan(0);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: real-data-migration, Property 11: Hook Error Handling**
   * **Validates: Requirements 10.5**
   * 
   * Property: For any error input, toApiError SHALL return a valid ApiError object
   */
  it('Property 11c: toApiError converts any error to valid ApiError structure', async () => {
    await fc.assert(
      fc.property(anyErrorArb, (error) => {
        // toApiError should not throw for any input
        let apiError: ApiError;
        try {
          apiError = toApiError(error);
        } catch (e) {
          // If it throws, the test fails
          expect.fail('toApiError should not throw');
          return false;
        }
        
        // Result should have required properties
        expect(apiError).toHaveProperty('message');
        expect(apiError).toHaveProperty('userMessage');
        expect(apiError).toHaveProperty('status');
        expect(apiError).toHaveProperty('originalError');
        
        // Types should be correct
        expect(typeof apiError.message).toBe('string');
        expect(typeof apiError.userMessage).toBe('string');
        expect(typeof apiError.status).toBe('number');
        expect(apiError.originalError).toBeInstanceOf(Error);
        
        // userMessage should not be empty
        expect(apiError.userMessage.length).toBeGreaterThan(0);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: real-data-migration, Property 11: Hook Error Handling**
   * **Validates: Requirements 10.5**
   * 
   * Property: For any HTTP status code, there SHALL be a user-friendly message
   */
  it('Property 11d: All HTTP status codes produce user-friendly messages', async () => {
    await fc.assert(
      fc.property(httpStatusArb, (status) => {
        const error = new APIError(`HTTP Error: ${status}`, status);
        const message = getUserFriendlyMessage(error);
        
        // Message should be a string
        expect(typeof message).toBe('string');
        
        // Message should not be empty
        expect(message.length).toBeGreaterThan(0);
        
        // Message should not just be the raw HTTP error
        // (it should be user-friendly, not technical)
        if ([400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 0].includes(status)) {
          // Known status codes should have specific messages
          expect(message).not.toBe(`HTTP Error: ${status}`);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: real-data-migration, Property 11: Hook Error Handling**
   * **Validates: Requirements 10.5**
   * 
   * Property: Network errors (status 0) SHALL produce non-empty message without crashing
   */
  it('Property 11e: Network errors produce non-empty user message', async () => {
    const networkErrorMessages = ['Network error', 'Failed to fetch', '', 'Connection refused'];
    
    await fc.assert(
      fc.property(
        fc.constantFrom(...networkErrorMessages),
        (errorMessage) => {
          const error = new APIError(errorMessage || 'Network error', 0);
          const message = getUserFriendlyMessage(error);
          
          // Message should be a non-empty string (error handling works)
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: real-data-migration, Property 11: Hook Error Handling**
   * **Validates: Requirements 10.5**
   * 
   * Property: Null error input SHALL return empty string (not crash)
   */
  it('Property 11f: Null error returns empty string without crashing', () => {
    const message = getUserFriendlyMessage(null);
    expect(message).toBe('');
  });

  /**
   * **Feature: real-data-migration, Property 11: Hook Error Handling**
   * **Validates: Requirements 10.5**
   * 
   * Property: APIError status is preserved through toApiError conversion
   */
  it('Property 11g: APIError status is preserved through conversion', async () => {
    await fc.assert(
      fc.property(apiErrorArb, (error) => {
        const apiError = toApiError(error);
        
        // Status should be preserved
        expect(apiError.status).toBe(error.status);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: real-data-migration, Property 11: Hook Error Handling**
   * **Validates: Requirements 10.5**
   * 
   * Property: Generic errors get status 0
   */
  it('Property 11h: Generic errors get status 0', async () => {
    await fc.assert(
      fc.property(genericErrorArb, (error) => {
        const apiError = toApiError(error);
        
        // Generic errors should have status 0
        expect(apiError.status).toBe(0);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
