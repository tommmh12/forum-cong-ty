/**
 * CSV Import Service
 * Requirements: 6.4, 6.6
 * 
 * Property 11: CSV Parsing Round-Trip
 * For any valid CSV file containing employee data, parsing the CSV and then
 * exporting the parsed data back to CSV SHALL produce an equivalent CSV structure.
 * 
 * Property 12: Duplicate Email Detection
 * For any CSV import containing an email that already exists in the system,
 * the import service SHALL flag that specific row as an error and exclude it
 * from successful imports.
 */

import type { EmployeeFormData, EmployeeStatus, EmployeeRole } from '@shared/types';
import { validateEmail, validateStatus, validateDate } from '../utils/validation';

/**
 * Import error for a specific row
 */
export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

/**
 * Result of CSV import validation
 */
export interface ImportValidationResult {
  validRows: EmployeeFormData[];
  errors: ImportError[];
}

/**
 * Expected CSV column headers (case-insensitive matching)
 */
const EXPECTED_HEADERS = [
  'full name',
  'email',
  'phone number',
  'department',
  'position',
  'status',
  'join date',
];

/**
 * Parses a CSV line handling quoted values
 * @param line - CSV line to parse
 * @returns Array of values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // End of quoted value
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted value
        inQuotes = true;
      } else if (char === ',') {
        // End of value
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  // Add last value
  values.push(current.trim());
  
  return values;
}

/**
 * Parses CSV content into rows of string arrays
 * @param content - Raw CSV content
 * @returns Array of rows, each row is an array of values
 */
function parseCSVContent(content: string): string[][] {
  // Normalize line endings and split into lines
  const lines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter(line => line.trim() !== '');
  
  return lines.map(parseCSVLine);
}

/**
 * Maps CSV headers to column indices
 * @param headers - Array of header strings from CSV
 * @returns Map of field name to column index
 */
function mapHeaders(headers: string[]): Map<string, number> {
  const headerMap = new Map<string, number>();
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  normalizedHeaders.forEach((header, index) => {
    if (header === 'full name' || header === 'fullname') {
      headerMap.set('fullName', index);
    } else if (header === 'email') {
      headerMap.set('email', index);
    } else if (header === 'phone number' || header === 'phonenumber' || header === 'phone') {
      headerMap.set('phoneNumber', index);
    } else if (header === 'department') {
      headerMap.set('department', index);
    } else if (header === 'position') {
      headerMap.set('position', index);
    } else if (header === 'status') {
      headerMap.set('status', index);
    } else if (header === 'join date' || header === 'joindate') {
      headerMap.set('joinDate', index);
    }
  });
  
  return headerMap;
}


/**
 * Validates a single import row and returns errors if any
 * @param values - Array of values from CSV row
 * @param headerMap - Map of field names to column indices
 * @param rowNumber - Row number for error reporting (1-indexed)
 * @returns Array of validation errors for this row
 * 
 * Requirement 6.4: Parse the file and create Employee_Records for each valid row
 */
export function validateImportRow(
  values: string[],
  headerMap: Map<string, number>,
  rowNumber: number
): ImportError[] {
  const errors: ImportError[] = [];
  
  // Get values using header map
  const getValue = (field: string): string => {
    const index = headerMap.get(field);
    return index !== undefined ? (values[index] ?? '') : '';
  };
  
  // Validate required fields
  const fullName = getValue('fullName');
  if (!fullName) {
    errors.push({
      row: rowNumber,
      field: 'fullName',
      value: fullName,
      message: 'Full name is required',
    });
  }
  
  const email = getValue('email');
  if (!email) {
    errors.push({
      row: rowNumber,
      field: 'email',
      value: email,
      message: 'Email is required',
    });
  } else if (!validateEmail(email)) {
    errors.push({
      row: rowNumber,
      field: 'email',
      value: email,
      message: 'Invalid email format',
    });
  }
  
  const department = getValue('department');
  if (!department) {
    errors.push({
      row: rowNumber,
      field: 'department',
      value: department,
      message: 'Department is required',
    });
  }
  
  const position = getValue('position');
  if (!position) {
    errors.push({
      row: rowNumber,
      field: 'position',
      value: position,
      message: 'Position is required',
    });
  }
  
  const status = getValue('status');
  if (!status) {
    errors.push({
      row: rowNumber,
      field: 'status',
      value: status,
      message: 'Status is required',
    });
  } else if (!validateStatus(status)) {
    errors.push({
      row: rowNumber,
      field: 'status',
      value: status,
      message: 'Invalid status value. Must be Active, On Leave, or Terminated',
    });
  }
  
  const joinDate = getValue('joinDate');
  if (joinDate && !validateDate(joinDate)) {
    errors.push({
      row: rowNumber,
      field: 'joinDate',
      value: joinDate,
      message: 'Invalid date format. Use YYYY-MM-DD',
    });
  }
  
  return errors;
}


/**
 * Checks for duplicate emails in the import data against existing emails
 * @param emails - Array of emails from import data
 * @param existingEmails - Set of emails that already exist in the system
 * @returns Map of email to row numbers where duplicates were found
 * 
 * Property 12: Duplicate Email Detection
 * Requirement 6.6: Flag rows with existing emails as errors
 */
export function checkDuplicateEmail(
  emails: Array<{ email: string; row: number }>,
  existingEmails: Set<string>
): ImportError[] {
  const errors: ImportError[] = [];
  const seenEmails = new Map<string, number>(); // email -> first row seen
  
  for (const { email, row } of emails) {
    const normalizedEmail = email.toLowerCase();
    
    // Check against existing system emails
    if (existingEmails.has(normalizedEmail)) {
      errors.push({
        row,
        field: 'email',
        value: email,
        message: 'Email already exists in the system',
      });
    }
    // Check for duplicates within the import file
    else if (seenEmails.has(normalizedEmail)) {
      errors.push({
        row,
        field: 'email',
        value: email,
        message: `Duplicate email in import file (first seen in row ${seenEmails.get(normalizedEmail)})`,
      });
    } else {
      seenEmails.set(normalizedEmail, row);
    }
  }
  
  return errors;
}

/**
 * Converts a validated CSV row to EmployeeFormData
 * @param values - Array of values from CSV row
 * @param headerMap - Map of field names to column indices
 * @returns EmployeeFormData object
 * 
 * Note: Role is intentionally not imported from CSV - all imported employees
 * default to 'Employee' role. Role assignment should be done through the UI
 * by administrators after import.
 */
function rowToEmployeeFormData(
  values: string[],
  headerMap: Map<string, number>
): EmployeeFormData {
  const getValue = (field: string): string => {
    const index = headerMap.get(field);
    return index !== undefined ? (values[index] ?? '') : '';
  };
  
  return {
    fullName: getValue('fullName'),
    email: getValue('email'),
    phoneNumber: getValue('phoneNumber'),
    department: getValue('department'),
    position: getValue('position'),
    status: getValue('status') as EmployeeStatus,
    joinDate: getValue('joinDate') || new Date().toISOString().split('T')[0],
    // Role is not imported from CSV - defaults to 'Employee' for security
    // Administrators can change roles after import through the UI
    role: 'Employee' as EmployeeRole,
  };
}

/**
 * Parses a CSV file and validates all rows
 * @param content - Raw CSV file content
 * @param existingEmails - Set of emails that already exist in the system
 * @returns ImportValidationResult with valid rows and errors
 * 
 * Requirement 6.4: Parse the file and create Employee_Records for each valid row
 * Requirement 6.6: Flag rows with existing emails as errors
 */
export function parseCSV(
  content: string,
  existingEmails: Set<string> = new Set()
): ImportValidationResult {
  const rows = parseCSVContent(content);
  
  if (rows.length === 0) {
    return { validRows: [], errors: [] };
  }
  
  // First row is headers
  const headers = rows[0];
  const headerMap = mapHeaders(headers);
  
  // Validate we have required headers
  const requiredFields = ['fullName', 'email', 'department', 'position', 'status'];
  const missingHeaders = requiredFields.filter(f => !headerMap.has(f));
  
  if (missingHeaders.length > 0) {
    return {
      validRows: [],
      errors: [{
        row: 1,
        field: 'headers',
        value: headers.join(', '),
        message: `Missing required headers: ${missingHeaders.join(', ')}`,
      }],
    };
  }
  
  const dataRows = rows.slice(1);
  const allErrors: ImportError[] = [];
  const validRows: EmployeeFormData[] = [];
  const emailsForDuplicateCheck: Array<{ email: string; row: number }> = [];
  
  // First pass: validate each row
  const rowValidationResults = dataRows.map((values, index) => {
    const rowNumber = index + 2; // +2 because 1-indexed and skip header
    const errors = validateImportRow(values, headerMap, rowNumber);
    
    if (errors.length === 0) {
      const emailIndex = headerMap.get('email');
      const email = emailIndex !== undefined ? values[emailIndex] : '';
      emailsForDuplicateCheck.push({ email, row: rowNumber });
    }
    
    return { values, rowNumber, errors };
  });
  
  // Check for duplicate emails
  const duplicateErrors = checkDuplicateEmail(emailsForDuplicateCheck, existingEmails);
  const duplicateRowNumbers = new Set(duplicateErrors.map(e => e.row));
  
  // Collect results
  for (const { values, rowNumber, errors } of rowValidationResults) {
    if (errors.length > 0) {
      allErrors.push(...errors);
    } else if (duplicateRowNumbers.has(rowNumber)) {
      // Row has duplicate email error
      const dupError = duplicateErrors.find(e => e.row === rowNumber);
      if (dupError) {
        allErrors.push(dupError);
      }
    } else {
      validRows.push(rowToEmployeeFormData(values, headerMap));
    }
  }
  
  return { validRows, errors: allErrors };
}
