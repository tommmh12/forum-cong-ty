/**
 * Employee Validation Utilities
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import type { EmployeeStatus } from '@shared/types';

/**
 * Valid employee status values
 * Requirement 8.3: Status must be one of: Active, On Leave, or Terminated
 */
const VALID_STATUSES: EmployeeStatus[] = ['Active', 'On Leave', 'Terminated'];

/**
 * Email validation regex pattern
 * Matches standard email format: local@domain.tld
 * Requirement 8.2: Validate that email follows valid email format
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * UUID v4 validation regex pattern
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y is 8, 9, a, or b
 * Requirement 8.1: Validate that id is a unique identifier (UUID format)
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * ISO 8601 date validation regex pattern
 * Format: YYYY-MM-DD
 * Requirement 8.4: Validate that joinDate is a valid date format (ISO 8601)
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates email format
 * @param email - The email string to validate
 * @returns true if the email matches standard email format (local@domain.tld)
 * 
 * Property 6: Email Format Validation
 * Validates: Requirements 4.5, 8.2
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email);
}

/**
 * Validates UUID v4 format
 * @param id - The string to validate as UUID v4
 * @returns true if the string matches UUID v4 format
 * 
 * Property 14: UUID Format Validation
 * Validates: Requirements 8.1
 */
export function validateUUID(id: string): boolean {
  if (typeof id !== 'string') {
    return false;
  }
  return UUID_V4_REGEX.test(id);
}


/**
 * Validates ISO 8601 date format (YYYY-MM-DD)
 * Also validates that the date is a real calendar date
 * @param dateStr - The date string to validate
 * @returns true if the string is a valid ISO 8601 date
 * 
 * Property 16: Date Format Validation
 * Validates: Requirements 8.4
 */
export function validateDate(dateStr: string): boolean {
  if (typeof dateStr !== 'string') {
    return false;
  }
  
  // Check format first
  if (!ISO_DATE_REGEX.test(dateStr)) {
    return false;
  }
  
  // Parse and validate the date is real
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Validates employee status enum value
 * @param status - The status string to validate
 * @returns true if the status is one of: "Active", "On Leave", or "Terminated"
 * 
 * Property 15: Status Enum Validation
 * Validates: Requirements 8.3
 */
export function validateStatus(status: string): status is EmployeeStatus {
  return VALID_STATUSES.includes(status as EmployeeStatus);
}
