/**
 * Employee JSON Serialization Service
 * Requirements: 8.5
 * 
 * Property 17: Employee JSON Round-Trip
 * For any valid Employee object, serializing to JSON and deserializing back
 * SHALL produce an Employee object with all fields equal to the original.
 */

import type { Employee, EmployeeStatus, EmployeeRole } from '@shared/types';
import { validateUUID, validateEmail, validateStatus, validateDate } from '../utils/validation';

/**
 * Serializes an Employee object to a JSON string
 * @param employee - The Employee object to serialize
 * @returns JSON string representation of the employee
 * 
 * Requirement 8.5: Serialize Employee_Record to JSON
 */
export function serializeEmployee(employee: Employee): string {
  return JSON.stringify(employee);
}

/**
 * Deserializes a JSON string to an Employee object
 * Validates the structure and returns a properly typed Employee
 * @param json - The JSON string to deserialize
 * @returns The deserialized Employee object
 * @throws Error if JSON is invalid or missing required fields
 * 
 * Requirement 8.5: Deserialize JSON back to an equivalent Employee_Record
 */
export function deserializeEmployee(json: string): Employee {
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON format');
  }
  
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('JSON must be an object');
  }
  
  const obj = parsed as Record<string, unknown>;
  
  // Validate required fields exist and have correct types
  validateRequiredStringField(obj, 'id');
  validateRequiredStringField(obj, 'fullName');
  validateRequiredStringField(obj, 'email');
  validateRequiredStringField(obj, 'phoneNumber');
  validateRequiredStringField(obj, 'department');
  validateRequiredStringField(obj, 'position');
  validateRequiredStringField(obj, 'status');
  validateRequiredStringField(obj, 'joinDate');
  validateRequiredStringField(obj, 'avatarUrl');
  validateRequiredStringField(obj, 'employeeId');
  validateRequiredStringField(obj, 'createdAt');
  validateRequiredStringField(obj, 'updatedAt');

  
  // Validate field formats
  if (!validateUUID(obj.id as string)) {
    throw new Error('Invalid UUID format for id');
  }
  
  if (!validateEmail(obj.email as string)) {
    throw new Error('Invalid email format');
  }
  
  if (!validateStatus(obj.status as string)) {
    throw new Error('Invalid status value');
  }
  
  if (!validateDate(obj.joinDate as string)) {
    throw new Error('Invalid date format for joinDate');
  }
  
  return {
    id: obj.id as string,
    fullName: obj.fullName as string,
    email: obj.email as string,
    phoneNumber: obj.phoneNumber as string,
    department: obj.department as string,
    position: obj.position as string,
    status: obj.status as EmployeeStatus,
    joinDate: obj.joinDate as string,
    avatarUrl: obj.avatarUrl as string,
    employeeId: obj.employeeId as string,
    role: (obj.role as EmployeeRole) || 'Employee',
    createdAt: obj.createdAt as string,
    updatedAt: obj.updatedAt as string,
  };
}

/**
 * Helper function to validate a required string field exists
 */
function validateRequiredStringField(obj: Record<string, unknown>, field: string): void {
  if (!(field in obj)) {
    throw new Error(`Missing required field: ${field}`);
  }
  if (typeof obj[field] !== 'string') {
    throw new Error(`Field ${field} must be a string`);
  }
}
