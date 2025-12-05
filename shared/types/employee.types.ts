/**
 * Employee List Module Types
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

/**
 * Employee employment status enum (maps to employee_status column in DB)
 * Requirement 8.3: Status must be one of: Active, On Leave, or Terminated
 * Note: This is distinct from AccountStatus which tracks login/account state
 */
export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated';

/**
 * Account status for login (maps to account_status column in DB)
 * Distinct from EmployeeStatus which tracks employment state
 */
export type AccountStatus = 'Pending' | 'Active';

/**
 * User role type (maps to role column in DB)
 */
export type EmployeeRole = 'Admin' | 'Manager' | 'Employee';

/**
 * Employee record interface
 * Requirements: 8.1 (UUID), 8.2 (email), 8.3 (status), 8.4 (joinDate)
 */
export interface Employee {
  id: string;                    // UUID format (Requirement 8.1)
  fullName: string;
  email: string;                 // Valid email format (Requirement 8.2)
  phoneNumber: string;
  department: string;
  position: string;
  status: EmployeeStatus;        // Employment status (Requirement 8.3) - maps to employee_status column
  joinDate: string;              // ISO 8601 date format (Requirement 8.4)
  avatarUrl: string;
  employeeId: string;            // Internal employee code
  role: EmployeeRole;            // User role (Admin, Manager, Employee)
  accountStatus?: AccountStatus; // Account/login status (Pending = chưa đăng nhập lần đầu) - maps to account_status column
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated response wrapper for API responses
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Form data for creating/editing employees
 * Note: 'status' here refers to employment status (EmployeeStatus), not account status
 */
export interface EmployeeFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  department: string;
  position: string;
  status: EmployeeStatus;        // Employment status - maps to employee_status column in DB
  joinDate: string;
  role: EmployeeRole;            // User role (Admin, Manager, Employee)
  avatarFile?: File;
}

/**
 * Filter parameters for employee list queries
 */
export interface EmployeeFilters {
  search: string;
  department: string | null;
  status: EmployeeStatus | null;
}
