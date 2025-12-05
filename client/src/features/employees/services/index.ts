// Employee services barrel exports

// Validation service
export {
  validateEmployee,
  getFieldError,
} from './validationService';

export type {
  ValidationError,
  ValidationResult,
} from './validationService';

// Serialization service
export {
  serializeEmployee,
  deserializeEmployee,
} from './serializationService';

// CSV Export service
export {
  generateCSVHeaders,
  employeeToCSVRow,
  generateCSVContent,
  exportToCSV,
} from './csvExportService';

// CSV Import service
export {
  parseCSV,
  validateImportRow,
  checkDuplicateEmail,
} from './csvImportService';

export type {
  ImportError,
  ImportValidationResult,
} from './csvImportService';

// Import Result service
export {
  createImportResult,
  serializeImportResult,
  deserializeImportResult,
  formatImportResultSummary,
} from './importResultService';

export type {
  ImportResult,
} from './importResultService';

// Employee Import service
export {
  importEmployees,
  convertImportResponse,
} from './employeeImportService';

export type {
  ImportResponse,
} from './employeeImportService';