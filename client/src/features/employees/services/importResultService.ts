/**
 * Import Result Reporting Service
 * Requirements: 6.8
 * 
 * Property 13: Import Report JSON Serialization
 * For any import operation result, serializing the result to JSON and deserializing
 * back SHALL produce an equivalent ImportResult object with the same imported count
 * and error details.
 */

import type { ImportError } from './csvImportService';

/**
 * Result of an import operation
 * Requirement 6.8: Produce a report that can be serialized to JSON for review
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: ImportError[];
  timestamp: string;
}

/**
 * Creates an ImportResult from import operation data
 * @param imported - Number of successfully imported records
 * @param errors - Array of import errors
 * @returns ImportResult object
 */
export function createImportResult(
  imported: number,
  errors: ImportError[]
): ImportResult {
  return {
    success: errors.length === 0,
    imported,
    skipped: errors.length,
    errors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Serializes an ImportResult to JSON string
 * @param result - The ImportResult to serialize
 * @returns JSON string representation
 * 
 * Requirement 6.8: Serialize import result to JSON for review
 */
export function serializeImportResult(result: ImportResult): string {
  return JSON.stringify(result);
}


/**
 * Deserializes a JSON string to an ImportResult object
 * @param json - The JSON string to deserialize
 * @returns The deserialized ImportResult object
 * @throws Error if JSON is invalid or missing required fields
 * 
 * Requirement 6.8: Deserialize JSON back to ImportResult for review
 */
export function deserializeImportResult(json: string): ImportResult {
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
  
  // Validate required fields
  if (typeof obj.success !== 'boolean') {
    throw new Error('Missing or invalid field: success');
  }
  
  if (typeof obj.imported !== 'number') {
    throw new Error('Missing or invalid field: imported');
  }
  
  if (typeof obj.skipped !== 'number') {
    throw new Error('Missing or invalid field: skipped');
  }
  
  if (!Array.isArray(obj.errors)) {
    throw new Error('Missing or invalid field: errors');
  }
  
  if (typeof obj.timestamp !== 'string') {
    throw new Error('Missing or invalid field: timestamp');
  }
  
  // Validate each error object
  const errors: ImportError[] = obj.errors.map((error: unknown, index: number) => {
    if (typeof error !== 'object' || error === null) {
      throw new Error(`Invalid error at index ${index}`);
    }
    
    const errObj = error as Record<string, unknown>;
    
    if (typeof errObj.row !== 'number') {
      throw new Error(`Invalid error.row at index ${index}`);
    }
    if (typeof errObj.field !== 'string') {
      throw new Error(`Invalid error.field at index ${index}`);
    }
    if (typeof errObj.value !== 'string') {
      throw new Error(`Invalid error.value at index ${index}`);
    }
    if (typeof errObj.message !== 'string') {
      throw new Error(`Invalid error.message at index ${index}`);
    }
    
    return {
      row: errObj.row,
      field: errObj.field,
      value: errObj.value,
      message: errObj.message,
    };
  });
  
  return {
    success: obj.success,
    imported: obj.imported,
    skipped: obj.skipped,
    errors,
    timestamp: obj.timestamp,
  };
}

/**
 * Formats an ImportResult for display to the user
 * @param result - The ImportResult to format
 * @returns Human-readable summary string
 */
export function formatImportResultSummary(result: ImportResult): string {
  const lines: string[] = [];
  
  if (result.success) {
    lines.push(`✓ Import completed successfully`);
  } else {
    lines.push(`⚠ Import completed with errors`);
  }
  
  lines.push(`Imported: ${result.imported} records`);
  
  if (result.skipped > 0) {
    lines.push(`Skipped: ${result.skipped} records due to errors`);
  }
  
  return lines.join('\n');
}
