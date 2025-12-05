/**
 * CSV Export Service
 * Requirements: 6.1, 6.2
 * 
 * Property 10: CSV Export Completeness
 * For any filtered employee list, the exported CSV SHALL contain exactly the same
 * records as the filtered list, with all employee fields represented as columns
 * with proper headers.
 */

import type { Employee } from '@shared/types';

/**
 * CSV column headers mapping to Employee fields
 * Requirement 6.2: Include all employee fields with proper column headers
 */
const CSV_HEADERS = [
  'ID',
  'Full Name',
  'Email',
  'Phone Number',
  'Department',
  'Position',
  'Status',
  'Join Date',
  'Avatar URL',
  'Employee ID',
  'Created At',
  'Updated At',
] as const;

/**
 * Employee field keys in the same order as CSV_HEADERS
 */
const EMPLOYEE_FIELDS: (keyof Employee)[] = [
  'id',
  'fullName',
  'email',
  'phoneNumber',
  'department',
  'position',
  'status',
  'joinDate',
  'avatarUrl',
  'employeeId',
  'createdAt',
  'updatedAt',
];

/**
 * Generates CSV header row
 * @returns CSV header string with all column names
 * 
 * Requirement 6.2: Include proper column headers
 */
export function generateCSVHeaders(): string {
  return CSV_HEADERS.join(',');
}


/**
 * Escapes a value for CSV format
 * Handles commas, quotes, and newlines by wrapping in quotes and escaping internal quotes
 * @param value - The value to escape
 * @returns Escaped CSV value
 */
function escapeCSVValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Converts an Employee object to a CSV row string
 * @param employee - The employee to convert
 * @returns CSV row string with all employee fields
 * 
 * Requirement 6.2: Include all employee fields
 */
export function employeeToCSVRow(employee: Employee): string {
  return EMPLOYEE_FIELDS
    .map(field => escapeCSVValue(String(employee[field] ?? '')))
    .join(',');
}

/**
 * Generates complete CSV content from an array of employees
 * @param employees - Array of employees to export
 * @returns Complete CSV string with headers and all employee rows
 * 
 * Requirement 6.1: Generate a CSV file containing all currently filtered employee records
 * Requirement 6.2: Include all employee fields with proper column headers
 */
export function generateCSVContent(employees: Employee[]): string {
  const headers = generateCSVHeaders();
  const rows = employees.map(employeeToCSVRow);
  return [headers, ...rows].join('\n');
}

/**
 * Exports employees to a CSV file and triggers browser download
 * @param employees - Array of employees to export
 * @param filename - Name of the file to download (default: 'employees.csv')
 * 
 * Requirement 6.1: Generate a CSV file containing all currently filtered employee records
 */
export function exportToCSV(employees: Employee[], filename: string = 'employees.csv'): void {
  const csvContent = generateCSVContent(employees);
  
  // Create blob with BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link and trigger download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}
