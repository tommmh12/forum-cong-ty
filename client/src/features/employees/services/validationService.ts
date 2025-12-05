/**
 * Employee Form Validation Service
 * Requirements: 4.3, 4.4, 4.5
 */

import type { EmployeeFormData } from '@shared/types';
import { validateEmail, validateStatus } from '../utils/validation';

/**
 * Validation error for a specific field
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Result of validation operation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Field-specific error messages
 * Based on design document error handling section
 */
const VALIDATION_MESSAGES = {
  fullName: {
    required: 'Họ và tên là bắt buộc',
  },
  email: {
    required: 'Email là bắt buộc',
    invalid: 'Email không đúng định dạng',
  },
  department: {
    required: 'Phòng ban là bắt buộc',
  },
  position: {
    required: 'Chức danh là bắt buộc',
  },
  status: {
    required: 'Trạng thái là bắt buộc',
    invalid: 'Trạng thái không hợp lệ',
  },
} as const;


/**
 * Checks if a string value is empty or only whitespace
 */
function isEmpty(value: string | undefined | null): boolean {
  return value === undefined || value === null || value.trim() === '';
}

/**
 * Validates employee form data
 * Checks all required fields and returns validation result with field-specific errors
 * 
 * Required fields: fullName, email, department, position, status
 * 
 * Property 5: Validation Rejection Correctness
 * Validates: Requirements 4.3, 4.4, 4.5
 * 
 * @param data - The employee form data to validate
 * @returns ValidationResult with isValid flag and array of errors
 */
export function validateEmployee(data: Partial<EmployeeFormData>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate fullName (required)
  if (isEmpty(data.fullName)) {
    errors.push({
      field: 'fullName',
      message: VALIDATION_MESSAGES.fullName.required,
    });
  }

  // Validate email (required and format)
  if (isEmpty(data.email)) {
    errors.push({
      field: 'email',
      message: VALIDATION_MESSAGES.email.required,
    });
  } else if (!validateEmail(data.email!)) {
    errors.push({
      field: 'email',
      message: VALIDATION_MESSAGES.email.invalid,
    });
  }

  // Validate department (required)
  if (isEmpty(data.department)) {
    errors.push({
      field: 'department',
      message: VALIDATION_MESSAGES.department.required,
    });
  }

  // Validate position (required)
  if (isEmpty(data.position)) {
    errors.push({
      field: 'position',
      message: VALIDATION_MESSAGES.position.required,
    });
  }

  // Validate status (required and enum value)
  if (isEmpty(data.status)) {
    errors.push({
      field: 'status',
      message: VALIDATION_MESSAGES.status.required,
    });
  } else if (!validateStatus(data.status!)) {
    errors.push({
      field: 'status',
      message: VALIDATION_MESSAGES.status.invalid,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets error message for a specific field from validation result
 * @param result - The validation result
 * @param field - The field name to get error for
 * @returns The error message or undefined if no error
 */
export function getFieldError(result: ValidationResult, field: string): string | undefined {
  const error = result.errors.find(e => e.field === field);
  return error?.message;
}
