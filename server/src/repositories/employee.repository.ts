import { query, getPool } from '../config/database';
import { Employee, EmployeeStatus, EmployeeRole, PaginatedResponse, EmployeeFilters } from '../../../shared/types/employee.types';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail, generateTempPassword } from '../services/email.service';
import { env } from '../config/env';

/**
 * Employee Repository
 * Requirements: 1.1, 2.1, 2.2, 2.3, 3.2, 3.3, 4.2, 5.4
 */

export interface EmployeeRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  position: string;
  department: string;
  employee_status: EmployeeStatus;
  account_status: 'Pending' | 'Active';
  phone: string | null;
  join_date: string | null;
  employee_id: string;
  role: EmployeeRole;
  created_at: string;
  updated_at: string;
}

/**
 * Data for creating a new employee
 * Note: 'status' refers to employment status (employee_status column), not account login status
 */
export interface CreateEmployeeData {
  fullName: string;
  email: string;
  phoneNumber: string;
  department: string;
  position: string;
  status: EmployeeStatus;        // Employment status - maps to employee_status column
  joinDate: string;
  avatarUrl?: string;
}

/**
 * Data for updating an employee
 * Note: 'status' refers to employment status (employee_status column), not account login status
 */
export interface UpdateEmployeeData {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  status?: EmployeeStatus;       // Employment status - maps to employee_status column
  joinDate?: string;
  avatarUrl?: string;
  role?: EmployeeRole;           // User role (Admin, Manager, Employee)
}

/**
 * Convert date to MySQL format (yyyy-MM-dd)
 */
function toMySQLDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  // If already in yyyy-MM-dd format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // Convert ISO string or other formats to yyyy-MM-dd
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Map database row to Employee type
 */
function mapRowToEmployee(row: EmployeeRow): Employee {
  // Convert join_date to yyyy-MM-dd format for frontend
  let joinDate = '';
  if (row.join_date) {
    const date = new Date(row.join_date);
    if (!isNaN(date.getTime())) {
      joinDate = date.toISOString().split('T')[0];
    }
  }
  
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phoneNumber: row.phone || '',
    department: row.department || '',
    position: row.position || '',
    status: row.employee_status || 'Active',
    joinDate,
    avatarUrl: row.avatar_url || '',
    employeeId: row.employee_id || '',
    role: row.role || 'Employee',
    accountStatus: row.account_status || 'Pending',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}


/**
 * Find all employees with pagination and filters
 * Requirements: 1.1, 2.1, 2.2, 2.3, 3.2, 3.3, 5.7
 */
export async function findAll(
  filters: EmployeeFilters,
  page: number = 1,
  pageSize: number = 10,
  includeTerminated: boolean = false
): Promise<PaginatedResponse<Employee>> {
  const pool = getPool();
  
  // Build WHERE clause
  const conditions: string[] = [];
  const params: any[] = [];
  
  // By default, exclude terminated employees (Requirement 5.7)
  if (!includeTerminated) {
    conditions.push("employee_status != 'Terminated'");
  }
  
  // Search filter (name or email contains search term) - Requirement 2.1
  if (filters.search && filters.search.trim()) {
    conditions.push('(full_name LIKE ? OR email LIKE ?)');
    const searchTerm = `%${filters.search.trim()}%`;
    params.push(searchTerm, searchTerm);
  }
  
  // Department filter - Requirement 2.2
  if (filters.department) {
    conditions.push('department = ?');
    params.push(filters.department);
  }
  
  // Status filter - Requirement 2.3
  if (filters.status) {
    conditions.push('employee_status = ?');
    params.push(filters.status);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
  const [countResult] = await pool.execute(countSql, params) as any;
  const total = countResult[0].total;
  
  // Calculate pagination - Requirements 3.2, 3.3
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;
  
  // Get paginated data
  const dataSql = `
    SELECT id, full_name, email, avatar_url, position, department, 
           employee_status, account_status, phone, join_date, employee_id, role, created_at, updated_at
    FROM users 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const [rows] = await pool.execute(dataSql, [...params, String(pageSize), String(offset)]) as any;
  const employees = (rows as EmployeeRow[]).map(mapRowToEmployee);
  
  return {
    data: employees,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Find employee by ID
 */
export async function findById(id: string): Promise<Employee | null> {
  const rows = await query<EmployeeRow[]>(
    `SELECT id, full_name, email, avatar_url, position, department, 
            employee_status, account_status, phone, join_date, employee_id, role, created_at, updated_at
     FROM users WHERE id = ?`,
    [id]
  );
  
  if (rows.length === 0) return null;
  return mapRowToEmployee(rows[0]);
}

/**
 * Find employee by email
 */
export async function findByEmail(email: string): Promise<Employee | null> {
  const rows = await query<EmployeeRow[]>(
    `SELECT id, full_name, email, avatar_url, position, department, 
            employee_status, account_status, phone, join_date, employee_id, role, created_at, updated_at
     FROM users WHERE email = ?`,
    [email]
  );
  
  if (rows.length === 0) return null;
  return mapRowToEmployee(rows[0]);
}


/**
 * Get department code from department name
 */
async function getDepartmentCode(departmentName: string): Promise<string> {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT code FROM departments WHERE name = ?',
    [departmentName]
  ) as any;
  
  if (rows.length > 0 && rows[0].code) {
    return rows[0].code;
  }
  
  // Fallback: tạo code từ tên phòng ban (lấy chữ cái đầu của mỗi từ)
  return departmentName
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 5) || 'EMP';
}

/**
 * Generate a unique employee ID
 * Format: DEPT_CODE + 6 random digits (e.g., TECH123456, HR987654)
 */
async function generateEmployeeId(departmentName: string): Promise<string> {
  const pool = getPool();
  const deptCode = await getDepartmentCode(departmentName);
  
  // Generate random 6 digits
  const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
  let employeeId = `${deptCode}${randomNum}`;
  
  // Check if ID already exists, regenerate if needed
  let attempts = 0;
  while (attempts < 10) {
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE employee_id = ?',
      [employeeId]
    ) as any;
    
    if (existing.length === 0) {
      return employeeId;
    }
    
    // Regenerate
    const newRandomNum = Math.floor(100000 + Math.random() * 900000).toString();
    employeeId = `${deptCode}${newRandomNum}`;
    attempts++;
  }
  
  // Fallback with timestamp if all attempts fail
  return `${deptCode}${Date.now().toString().slice(-6)}`;
}

/**
 * Custom error class for duplicate email violations
 */
export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Email already exists: ${email}`);
    this.name = 'DuplicateEmailError';
  }
}

/**
 * Check if an error is a MySQL duplicate entry error
 */
function isDuplicateEntryError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: string }).code === 'ER_DUP_ENTRY'
  );
}

/**
 * Create a new employee
 * Requirement 4.2
 * - Generate temporary password
 * - Account status = Pending (not active until first login)
 * - Send welcome email with credentials
 */
export async function create(data: CreateEmployeeData): Promise<Employee> {
  const pool = getPool();
  const id = uuidv4();
  const employeeId = await generateEmployeeId(data.department);
  
  // Generate temporary password
  const tempPassword = generateTempPassword(10);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  
  try {
    await pool.execute(
      `INSERT INTO users (id, full_name, email, password_hash, phone, department, position, employee_status, join_date, avatar_url, employee_id, role, account_status, is_first_login)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Employee', 'Pending', TRUE)`,
      [
        id,
        data.fullName,
        data.email,
        passwordHash,
        data.phoneNumber || null,
        data.department,
        data.position,
        data.status,
        toMySQLDate(data.joinDate),
        data.avatarUrl || null,
        employeeId,
      ]
    );
  } catch (error) {
    // Handle duplicate email constraint violation
    if (isDuplicateEntryError(error)) {
      throw new DuplicateEmailError(data.email);
    }
    throw error;
  }
  
  const employee = await findById(id);
  if (!employee) {
    throw new Error('Failed to create employee');
  }
  
  // Send welcome email with temporary password
  const loginUrl = env.frontendUrl;
  await sendWelcomeEmail({
    to: data.email,
    fullName: data.fullName,
    email: data.email,
    tempPassword,
    loginUrl,
  });
  
  return employee;
}

/**
 * Update an existing employee
 */
export async function update(id: string, data: UpdateEmployeeData): Promise<Employee | null> {
  const pool = getPool();
  
  // Build SET clause dynamically
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.fullName !== undefined) {
    updates.push('full_name = ?');
    params.push(data.fullName);
  }
  if (data.email !== undefined) {
    updates.push('email = ?');
    params.push(data.email);
  }
  if (data.phoneNumber !== undefined) {
    updates.push('phone = ?');
    params.push(data.phoneNumber);
  }
  if (data.department !== undefined) {
    updates.push('department = ?');
    params.push(data.department);
  }
  if (data.position !== undefined) {
    updates.push('position = ?');
    params.push(data.position);
  }
  if (data.status !== undefined) {
    updates.push('employee_status = ?');
    params.push(data.status);
  }
  if (data.joinDate !== undefined) {
    updates.push('join_date = ?');
    params.push(toMySQLDate(data.joinDate));
  }
  if (data.avatarUrl !== undefined) {
    updates.push('avatar_url = ?');
    params.push(data.avatarUrl);
  }
  if (data.role !== undefined) {
    updates.push('role = ?');
    params.push(data.role);
  }
  
  if (updates.length === 0) {
    return findById(id);
  }
  
  params.push(id);
  
  await pool.execute(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return findById(id);
}

/**
 * Soft delete an employee (set status to Terminated)
 * Requirement 5.4
 */
export async function softDelete(id: string): Promise<boolean> {
  const pool = getPool();
  
  const [result] = await pool.execute(
    "UPDATE users SET employee_status = 'Terminated' WHERE id = ?",
    [id]
  ) as any;
  
  return result.affectedRows > 0;
}

/**
 * Check if email exists (for duplicate detection during import)
 * Requirement 6.6
 */
export async function emailExists(email: string, excludeId?: string): Promise<boolean> {
  const pool = getPool();
  
  let sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
  const params: any[] = [email];
  
  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }
  
  const [rows] = await pool.execute(sql, params) as any;
  return rows[0].count > 0;
}

export default {
  findAll,
  findById,
  findByEmail,
  create,
  update,
  softDelete,
  emailExists,
};
