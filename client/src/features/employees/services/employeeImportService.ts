/**
 * Employee Import Service
 * Handles CSV file import to the server
 */

import { fetchAPI } from '../../../services/api';
import { ImportValidationResult } from './csvImportService';

export interface ImportResponse {
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

/**
 * Import employees from CSV file
 * Sends the file to the server for validation and import
 * 
 * @param file - The CSV file to import
 * @returns Promise resolving to import result
 */
export async function importEmployees(file: File): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchAPI<ImportResponse>('/employees/import', {
    method: 'POST',
    body: formData,
  });

  return response;
}

/**
 * Convert server import response to client ImportValidationResult format
 * for consistent UI display
 */
export function convertImportResponse(response: ImportResponse): ImportValidationResult {
  return {
    validRows: [], // Server doesn't return valid rows, only counts
    errors: response.errors.map(err => ({
      row: err.row,
      field: err.field,
      value: '', // Server doesn't return values
      message: err.message,
    })),
  };
}

