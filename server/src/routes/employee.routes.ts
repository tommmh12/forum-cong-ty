import { Router, Request, Response } from 'express';
import * as employeeRepo from '../repositories/employee.repository';
import * as linkedAccountRepo from '../repositories/linked-account.repository';
import { EmployeeStatus, EmployeeRole, EmployeeFilters } from '../../../shared/types/employee.types';
import { authMiddleware } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'avatar') {
      // Accept images only
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for avatar'));
      }
    } else if (file.fieldname === 'file') {
      // Accept CSV only for import
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed for import'));
      }
    } else {
      cb(null, true);
    }
  },
});


/**
 * GET /employees
 * List employees with pagination and filters
 * Requirements: 1.1, 2.1, 2.2, 2.3, 3.2, 3.3
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = (req.query.search as string) || '';
    const department = (req.query.department as string) || null;
    const status = (req.query.status as EmployeeStatus) || null;
    const includeTerminated = req.query.includeTerminated === 'true';

    const filters: EmployeeFilters = {
      search,
      department,
      status,
    };

    const result = await employeeRepo.findAll(filters, page, size, includeTerminated);
    res.json(result);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

/**
 * Escape a value for CSV format
 */
function escapeCSVValue(value: string | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * GET /employees/export
 * Export employees to CSV
 * Requirements: 6.1, 6.2
 * 
 * CSV schema matches client-side csvExportService.ts for consistency:
 * ID, Full Name, Email, Phone Number, Department, Position, Status, Join Date, Avatar URL, Employee ID, Created At, Updated At
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const department = (req.query.department as string) || null;
    const status = (req.query.status as EmployeeStatus) || null;

    const filters: EmployeeFilters = {
      search,
      department,
      status,
    };

    // Get all employees matching filters (no pagination for export)
    const result = await employeeRepo.findAll(filters, 1, 10000, false);
    
    // Generate CSV content - headers match client-side CSV_HEADERS for consistency
    const headers = ['ID', 'Full Name', 'Email', 'Phone Number', 'Department', 'Position', 'Status', 'Join Date', 'Avatar URL', 'Employee ID', 'Created At', 'Updated At'];
    const csvRows = [headers.join(',')];
    
    for (const emp of result.data) {
      const row = [
        escapeCSVValue(emp.id),
        escapeCSVValue(emp.fullName),
        escapeCSVValue(emp.email),
        escapeCSVValue(emp.phoneNumber),
        escapeCSVValue(emp.department),
        escapeCSVValue(emp.position),
        escapeCSVValue(emp.status),
        escapeCSVValue(emp.joinDate),
        escapeCSVValue(emp.avatarUrl),
        escapeCSVValue(emp.employeeId),
        escapeCSVValue(emp.createdAt),
        escapeCSVValue(emp.updatedAt),
      ];
      csvRows.push(row.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    
    // Add BOM for Excel compatibility (matches client-side export)
    const BOM = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
    res.send(BOM + csvContent);
  } catch (error) {
    console.error('Error exporting employees:', error);
    res.status(500).json({ error: 'Failed to export employees' });
  }
});

/**
 * GET /employees/:id
 * Get employee by ID with linked accounts
 * Requirement 5.2: Fetch employee details with linked accounts
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const employee = await employeeRepo.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Fetch linked accounts for this employee (Requirement 5.2)
    const linkedAccounts = await linkedAccountRepo.findByUserId(req.params.id);
    
    // Return employee with linked accounts
    res.json({
      ...employee,
      linkedAccounts: linkedAccounts.map(account => ({
        provider: account.provider,
        email: account.providerEmail || '',
        connected: account.connected,
        lastSynced: account.lastSynced,
      })),
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});


/**
 * POST /employees
 * Create a new employee
 * Requirement: 4.2
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fullName, email, phoneNumber, department, position, status, joinDate, avatarUrl } = req.body;

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!fullName || !fullName.trim()) errors.fullName = 'Full name is required';
    if (!email || !email.trim()) errors.email = 'Email is required';
    if (!department || !department.trim()) errors.department = 'Department is required';
    if (!position || !position.trim()) errors.position = 'Position is required';
    if (!status) errors.status = 'Status is required';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      errors.email = 'Invalid email format';
    }

    // Check for duplicate email
    if (email && await employeeRepo.emailExists(email)) {
      errors.email = 'Email already exists';
    }

    // Validate status
    const validStatuses: EmployeeStatus[] = ['Active', 'On Leave', 'Terminated'];
    if (status && !validStatuses.includes(status)) {
      errors.status = 'Invalid status value';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const employee = await employeeRepo.create({
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber?.trim() || '',
      department: department.trim(),
      position: position.trim(),
      status,
      joinDate: joinDate || new Date().toISOString().split('T')[0],
      avatarUrl: avatarUrl || '',
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    // Handle duplicate email constraint violation (race condition)
    if (error instanceof Error && error.name === 'DuplicateEmailError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        errors: { email: 'Email already exists' } 
      });
    }
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

/**
 * PUT /employees/:id
 * Update an existing employee
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, phoneNumber, department, position, status, joinDate, avatarUrl, role } = req.body;

    // Check if employee exists
    const existing = await employeeRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validate email format if provided
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      errors.email = 'Invalid email format';
    }

    // Check for duplicate email (excluding current employee)
    if (email && await employeeRepo.emailExists(email, id)) {
      errors.email = 'Email already exists';
    }

    // Validate status if provided
    const validStatuses: EmployeeStatus[] = ['Active', 'On Leave', 'Terminated'];
    if (status && !validStatuses.includes(status)) {
      errors.status = 'Invalid status value';
    }

    // Validate role if provided
    const validRoles: EmployeeRole[] = ['Admin', 'Manager', 'Employee'];
    if (role && !validRoles.includes(role)) {
      errors.role = 'Invalid role value';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const employee = await employeeRepo.update(id, {
      fullName: fullName?.trim(),
      email: email?.trim(),
      phoneNumber: phoneNumber?.trim(),
      department: department?.trim(),
      position: position?.trim(),
      status,
      joinDate,
      avatarUrl,
      role,
    });

    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});


/**
 * DELETE /employees/:id
 * Soft delete an employee (set status to Terminated)
 * Requirement: 5.4
 * Security: Requires authentication - uses req.user.id from authMiddleware (not spoofable headers)
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get current user from auth middleware only (secure, not spoofable)
    // req.user is guaranteed to exist after authMiddleware
    const currentUserId = req.user!.id;

    // Prevent self-deletion (Requirement 5.6)
    if (currentUserId === id) {
      return res.status(400).json({ 
        error: 'SELF_DELETE_FORBIDDEN', 
        message: 'Không thể xóa tài khoản của chính mình.' 
      });
    }

    // Check if employee exists
    const existing = await employeeRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy nhân viên.' });
    }

    const success = await employeeRepo.softDelete(id);
    if (!success) {
      return res.status(500).json({ error: 'DELETE_FAILED', message: 'Không thể xóa nhân viên.' });
    }

    res.json({ message: 'Xóa nhân viên thành công.' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống.' });
  }
});

/**
 * POST /employees/import
 * Import employees from CSV
 * Requirements: 6.4, 6.5, 6.6, 6.7, 6.8
 */
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvContent = fs.readFileSync(req.file.path, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'CSV file is empty or has no data rows' });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as { row: number; field: string; message: string }[],
    };

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const rowData: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        rowData[header] = values[index]?.trim() || '';
      });

      // Map CSV columns to employee fields
      const fullName = rowData['full name'] || rowData['fullname'] || rowData['name'] || '';
      const email = rowData['email'] || '';
      const phoneNumber = rowData['phone'] || rowData['phonenumber'] || rowData['phone number'] || '';
      const department = rowData['department'] || '';
      const position = rowData['position'] || '';
      // Note: 'status' here refers to employee_status (employment status), not account login status
      const employeeStatus = (rowData['status'] || 'Active') as EmployeeStatus;
      const joinDateRaw = rowData['join date'] || rowData['joindate'] || '';

      // Validate required fields
      if (!fullName) {
        results.errors.push({ row: i + 1, field: 'fullName', message: 'Full name is required' });
        results.skipped++;
        continue;
      }
      if (!email) {
        results.errors.push({ row: i + 1, field: 'email', message: 'Email is required' });
        results.skipped++;
        continue;
      }
      if (!department) {
        results.errors.push({ row: i + 1, field: 'department', message: 'Department is required' });
        results.skipped++;
        continue;
      }
      if (!position) {
        results.errors.push({ row: i + 1, field: 'position', message: 'Position is required' });
        results.skipped++;
        continue;
      }

      // Check for duplicate email (Requirement 6.6)
      if (await employeeRepo.emailExists(email)) {
        results.errors.push({ row: i + 1, field: 'email', message: 'Email already exists' });
        results.skipped++;
        continue;
      }

      // Validate and normalize join date
      let normalizedJoinDate = new Date().toISOString().split('T')[0];
      if (joinDateRaw) {
        const parsedDate = normalizeDate(joinDateRaw);
        if (!parsedDate) {
          results.errors.push({ row: i + 1, field: 'joinDate', message: `Invalid date format: ${joinDateRaw}` });
          results.skipped++;
          continue;
        }
        normalizedJoinDate = parsedDate;
      }

      // Validate employee status (employment status, not account status)
      const validStatuses: EmployeeStatus[] = ['Active', 'On Leave', 'Terminated'];
      const normalizedStatus = validStatuses.find(s => s.toLowerCase() === employeeStatus.toLowerCase()) || 'Active';

      try {
        await employeeRepo.create({
          fullName,
          email,
          phoneNumber,
          department,
          position,
          status: normalizedStatus, // This maps to employee_status column
          joinDate: normalizedJoinDate,
        });
        results.imported++;
      } catch (err) {
        // Handle duplicate email constraint violation (race condition during import)
        if (err instanceof Error && err.name === 'DuplicateEmailError') {
          results.errors.push({ row: i + 1, field: 'email', message: 'Email already exists (duplicate detected during import)' });
        } else {
          results.errors.push({ row: i + 1, field: 'general', message: 'Failed to create employee' });
        }
        results.skipped++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(results);
  } catch (error) {
    console.error('Error importing employees:', error);
    res.status(500).json({ error: 'Failed to import employees' });
  }
});

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Normalize date string to MySQL format (YYYY-MM-DD)
 * Handles various input formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, ISO strings
 * Returns null if date is invalid
 */
function normalizeDate(dateStr: string): string | null {
  if (!dateStr || !dateStr.trim()) return null;
  
  const trimmed = dateStr.trim();
  
  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) return trimmed;
    return null;
  }
  
  // DD/MM/YYYY format
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime()) && date.getDate() === parseInt(day)) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return null;
  }
  
  // MM/DD/YYYY format (US style)
  const mmddyyyy = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime()) && date.getDate() === parseInt(day)) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return null;
  }
  
  // Try ISO string or other parseable formats
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Fall through to return null
  }
  
  return null;
}


/**
 * POST /employees/avatar
 * Upload employee avatar
 */
router.post('/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate avatar URL (in production, this would be a CDN URL)
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    res.json({ avatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

export default router;
