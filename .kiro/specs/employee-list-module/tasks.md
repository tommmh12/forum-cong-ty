# Implementation Plan

- [x] 1. Set up Employee module structure and types





  - [x] 1.1 Create Employee type definitions and extend existing types

    - Create `shared/types/employee.types.ts` with Employee, EmployeeStatus, PaginatedResponse types
    - Add EmployeeFormData and EmployeeFilters interfaces
    - Export types from `shared/types/index.ts`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 1.2 Create employee feature folder structure

    - Create `client/src/features/employees/` directory
    - Create subdirectories: components, hooks, services, utils
    - Create index.ts barrel exports
    - _Requirements: 1.1_

- [-] 2. Implement validation services




  - [x] 2.1 Create validation utility functions

    - Implement validateEmail function with regex pattern
    - Implement validateUUID function for UUID v4 format
    - Implement validateDate function for ISO 8601 format
    - Implement validateStatus function for enum values
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ]* 2.2 Write property test for email validation
    - **Property 6: Email Format Validation**
    - **Validates: Requirements 4.5, 8.2**
  - [ ]* 2.3 Write property test for UUID validation
    - **Property 14: UUID Format Validation**
    - **Validates: Requirements 8.1**
  - [ ]* 2.4 Write property test for status enum validation
    - **Property 15: Status Enum Validation**
    - **Validates: Requirements 8.3**
  - [ ]* 2.5 Write property test for date format validation
    - **Property 16: Date Format Validation**
    - **Validates: Requirements 8.4**

  - [x] 2.6 Create employee form validation service


    - Implement validateEmployee function checking all required fields
    - Return ValidationResult with field-specific error messages
    - _Requirements: 4.3, 4.4, 4.5_
  - [ ]* 2.7 Write property test for validation rejection
    - **Property 5: Validation Rejection Correctness**
    - **Validates: Requirements 4.3, 4.4**

- [x] 3. Checkpoint - Ensure all validation tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement filter and pagination logic





  - [x] 4.1 Create filter utility functions


    - Implement filterBySearch function (name or email contains)
    - Implement filterByDepartment function
    - Implement filterByStatus function
    - Implement combineFilters function with AND logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 4.2 Write property test for filter combination
    - **Property 1: Filter Combination Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - [x] 4.3 Create pagination utility functions


    - Implement paginateData function for slicing data by page/pageSize
    - Implement calculateTotalPages function
    - _Requirements: 3.2, 3.3_
  - [ ]* 4.4 Write property test for pagination page size
    - **Property 2: Pagination Page Size Correctness**
    - **Validates: Requirements 3.2**
  - [ ]* 4.5 Write property test for pagination navigation
    - **Property 3: Pagination Navigation Correctness**
    - **Validates: Requirements 3.3**

- [x] 5. Implement serialization services





  - [x] 5.1 Create JSON serialization utilities


    - Implement serializeEmployee function
    - Implement deserializeEmployee function
    - _Requirements: 8.5_
  - [ ]* 5.2 Write property test for Employee JSON round-trip
    - **Property 17: Employee JSON Round-Trip**
    - **Validates: Requirements 8.5**

  - [x] 5.3 Create CSV export service

    - Implement generateCSVHeaders function
    - Implement employeeToCSVRow function
    - Implement exportToCSV function with file download
    - _Requirements: 6.1, 6.2_
  - [ ]* 5.4 Write property test for CSV export completeness
    - **Property 10: CSV Export Completeness**
    - **Validates: Requirements 6.1, 6.2**

  - [x] 5.5 Create CSV import service

    - Implement parseCSV function
    - Implement validateImportRow function
    - Implement checkDuplicateEmail function
    - _Requirements: 6.4, 6.6_
  - [ ]* 5.6 Write property test for CSV parsing round-trip
    - **Property 11: CSV Parsing Round-Trip**
    - **Validates: Requirements 6.4**
  - [ ]* 5.7 Write property test for duplicate email detection
    - **Property 12: Duplicate Email Detection**
    - **Validates: Requirements 6.6**

  - [x] 5.8 Create import result reporting

    - Implement ImportResult interface
    - Implement serializeImportResult function
    - _Requirements: 6.8_
  - [ ]* 5.9 Write property test for import report serialization
    - **Property 13: Import Report JSON Serialization**
    - **Validates: Requirements 6.8**

- [x] 6. Checkpoint - Ensure all service tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement API hooks





  - [x] 7.1 Create useEmployees hook


    - Implement data fetching with filters and pagination params
    - Handle loading, error, and success states
    - Implement refetch function
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 3.2, 3.3_
  - [ ]* 7.2 Write property test for loading state consistency
    - **Property 19: Loading State Consistency**
    - **Validates: Requirements 1.2**

  - [x] 7.3 Create useEmployeeMutations hook

    - Implement createEmployee function
    - Implement updateEmployee function
    - Implement deleteEmployee function (soft delete)
    - Implement uploadAvatar function
    - _Requirements: 4.2, 5.4_
  - [ ]* 7.4 Write property test for employee creation persistence
    - **Property 4: Employee Creation Persistence**
    - **Validates: Requirements 4.2**
  - [ ]* 7.5 Write property test for soft delete status change
    - **Property 8: Soft Delete Status Change**
    - **Validates: Requirements 5.4**
  - [ ]* 7.6 Write property test for default list excludes terminated
    - **Property 9: Default List Excludes Terminated**
    - **Validates: Requirements 5.7**

- [x] 8. Implement UI components




  - [x] 8.1 Create FilterToolbar component


    - Implement search input with debounce
    - Implement department dropdown filter
    - Implement status dropdown filter
    - Add Export CSV and Import Data buttons
    - Add "Add New Employee" button
    - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.3_
  - [x] 8.2 Create EmployeeDataTable component


    - Implement table with columns: Avatar+Name, Email, Department, Position, Status, Actions
    - Implement skeleton loading state
    - Implement error state with retry button
    - Implement empty state
    - Implement row hover effects
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 8.3 Create StatusBadge component

    - Implement color mapping: Active→green, On Leave→yellow, Terminated→red
    - _Requirements: 1.6_
  - [ ]* 8.4 Write property test for status badge color mapping
    - **Property 18: Status Badge Color Mapping**
    - **Validates: Requirements 1.6**

  - [x] 8.5 Create PaginationControl component

    - Implement page navigation (prev, next, page numbers)
    - Implement rows-per-page selector (10, 20, 50)
    - Display current range and total count
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 8.6 Create ActionMenu component


    - Implement three-dot menu with View, Edit, Delete options
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 8.7 Create ConfirmDialog component


    - Implement modal with title, message, confirm/cancel buttons
    - Support danger/warning/info variants
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 8.8 Create EmployeeModal component

    - Implement form with all employee fields
    - Support create and edit modes
    - Implement avatar upload with preview
    - Display validation errors
    - Implement self-deletion prevention check
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.6_
  - [ ]* 8.9 Write property test for edit modal pre-population
    - **Property 7: Edit Modal Pre-population**
    - **Validates: Requirements 5.2**

- [x] 9. Implement main page component





  - [x] 9.1 Create EmployeeListPage component

    - Integrate FilterToolbar, EmployeeDataTable, PaginationControl
    - Manage modal states (create, edit, delete confirmation)
    - Handle export/import workflows
    - Implement file size validation for import (5MB limit)
    - _Requirements: 1.1, 6.5, 6.7_
  - [x] 9.2 Add route configuration


    - Add employee list route to router configuration
    - _Requirements: 1.1_
- [x] 10. Implement responsive design




- [ ] 10. Implement responsive design

  - [x] 10.1 Add responsive styles for mobile view


    - Implement horizontal scroll for table on mobile
    - Ensure touch-friendly action buttons
    - _Requirements: 7.1_
  - [x] 10.2 Add keyboard navigation support


    - Implement tab navigation through interactive elements
    - _Requirements: 7.2_

- [x] 11. Implement backend API endpoints






  - [x] 11.1 Create employee repository

    - Implement findAll with pagination and filters
    - Implement findById
    - Implement create
    - Implement update
    - Implement softDelete (update status to Terminated)
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.2, 3.3, 4.2, 5.4_

  - [x] 11.2 Create employee API routes

    - GET /api/v1/employees with query params
    - POST /api/v1/employees
    - PUT /api/v1/employees/:id
    - DELETE /api/v1/employees/:id (soft delete)
    - GET /api/v1/employees/export
    - POST /api/v1/employees/import
    - POST /api/v1/employees/avatar
    - _Requirements: All API Contract endpoints_

- [x] 12. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
