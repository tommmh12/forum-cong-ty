/**
 * EmployeeListPage Component
 * Requirements: 1.1, 6.5, 6.7, 7.1, 7.2
 * 
 * Main page component that integrates FilterToolbar, EmployeeDataTable, PaginationControl.
 * Manages modal states (create, edit, delete confirmation) and handles export/import workflows.
 * 
 * Responsive Design (Requirement 7.1):
 * - All child components support mobile-friendly layouts
 * - Touch-friendly interactive elements
 * 
 * Keyboard Navigation (Requirement 7.2):
 * - Tab navigation through all interactive elements
 * - Focus trapping in modals
 * - Escape key to close modals
 */

import React, { useState, useCallback, useMemo } from 'react';
import { FilterToolbar } from '../components/FilterToolbar';
import { EmployeeDataTable } from '../components/EmployeeDataTable';
import { PaginationControl } from '../components/PaginationControl';
import { EmployeeModal } from '../components/EmployeeModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeeMutations } from '../hooks/useEmployeeMutations';
import { useDepartments } from '../../../hooks/useDepartments';
import { useAuthContext } from '../../auth/context/AuthContext';
import { exportToCSV } from '../services/csvExportService';
import { parseCSV, ImportValidationResult } from '../services/csvImportService';
import { importEmployees, convertImportResponse } from '../services/employeeImportService';
import type { Employee, EmployeeFilters, EmployeeFormData } from '@shared/types';

/**
 * Maximum file size for import (5MB)
 * Requirement 6.7: Reject files larger than 5MB
 */
const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Initial filter state
 */
const INITIAL_FILTERS: EmployeeFilters = {
  search: '',
  department: null,
  status: null,
};

/**
 * Page size options for pagination
 */
const PAGE_SIZE_OPTIONS = [10, 20, 50];

/**
 * EmployeeListPage - Main page for employee management
 * 
 * Requirements:
 * - 1.1: Display employee list in data table
 * - 6.5: Display summary of import errors and successful imports
 * - 6.7: Reject import files larger than 5MB
 */
export const EmployeeListPage: React.FC = () => {
  // Auth context for current user ID (self-deletion prevention)
  const { user } = useAuthContext();

  // Departments for filter and modal dropdowns
  const { departments } = useDepartments();
  const departmentNames = useMemo(
    () => departments.map(d => d.name),
    [departments]
  );

  // Filter and pagination state
  const [filters, setFilters] = useState<EmployeeFilters>(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  // Employee data fetching
  const {
    employees,
    total,
    totalPages,
    loading,
    error,
    refetch,
  } = useEmployees({ filters, page: currentPage, pageSize });

  // Employee mutations
  const {
    createEmployee,
    updateEmployee,
    deleteEmployee,
    uploadAvatar,
    loading: mutationLoading,
  } = useEmployeeMutations();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Import result state for displaying summary
  const [importResult, setImportResult] = useState<ImportValidationResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  /**
   * Handle filter changes
   * Reset to page 1 when filters change
   */
  const handleFiltersChange = useCallback((newFilters: EmployeeFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * Handle page size change
   * Reset to page 1 when page size changes
   */
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  /**
   * Handle CSV export
   * Requirement 6.1: Export filtered employee records to CSV
   */
  const handleExport = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(employees, `employees_${timestamp}.csv`);
  }, [employees]);

  /**
   * Handle CSV import
   * Requirements: 6.5, 6.7
   */
  const handleImport = useCallback(async (file: File) => {
    setImportError(null);
    setImportResult(null);

    // Requirement 6.7: Validate file size (5MB limit)
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      setImportError('File vượt quá giới hạn 5MB. Vui lòng chọn file nhỏ hơn.');
      return;
    }

    try {
      // Client-side validation for immediate feedback
      const content = await file.text();
      const existingEmails = new Set(employees.map(e => e.email.toLowerCase()));
      const clientResult = parseCSV(content, existingEmails);
      
      // Send file to server for import (server will validate again)
      const serverResponse = await importEmployees(file);
      
      // Convert server response to client format for display
      const serverResult = convertImportResponse(serverResponse);
      
      // Merge client and server validation results
      const mergedResult: ImportValidationResult = {
        validRows: [], // Server doesn't return valid rows
        errors: [
          ...clientResult.errors,
          ...serverResult.errors,
        ],
      };
      
      // Update result with server import statistics
      setImportResult({
        ...mergedResult,
        // Use server response for accurate counts
        validRows: Array(serverResponse.imported).fill(null).map((_, i) => ({
          fullName: `Imported ${i + 1}`,
          email: '',
          phoneNumber: '',
          department: '',
          position: '',
          status: 'Active' as const,
          joinDate: new Date().toISOString().split('T')[0],
        })),
      });

      // Refetch only if import was successful
      if (serverResponse.imported > 0) {
        refetch();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể import file. Vui lòng kiểm tra định dạng CSV và thử lại.';
      setImportError(errorMessage);
    }
  }, [employees, refetch]);


  /**
   * Handle add new employee button click
   */
  const handleAddNew = useCallback(() => {
    setSelectedEmployee(null);
    setIsCreateModalOpen(true);
  }, []);

  /**
   * Handle view employee action
   */
  const handleView = useCallback((employee: Employee) => {
    // For now, open edit modal in view mode
    // Could navigate to a detail page in the future
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  }, []);

  /**
   * Handle edit employee action
   */
  const handleEdit = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  }, []);

  /**
   * Handle delete employee action
   * Opens confirmation dialog
   */
  const handleDelete = useCallback((employee: Employee) => {
    // Requirement 5.6: Prevent self-deletion
    if (employee.id === user?.id) {
      // Could show a toast/notification here
      return;
    }
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  }, [user?.id]);

  /**
   * Handle create employee form submission
   */
  const handleCreateSubmit = useCallback(async (data: EmployeeFormData) => {
    let avatarUrl: string | undefined;

    // Upload avatar if provided
    if (data.avatarFile) {
      avatarUrl = await uploadAvatar(data.avatarFile);
    }

    await createEmployee({
      ...data,
      avatarFile: undefined,
    });

    setIsCreateModalOpen(false);
    refetch();
  }, [createEmployee, uploadAvatar, refetch]);

  /**
   * Handle edit employee form submission
   */
  const handleEditSubmit = useCallback(async (data: EmployeeFormData) => {
    if (!selectedEmployee) return;

    let avatarUrl: string | undefined;

    // Upload avatar if provided
    if (data.avatarFile) {
      avatarUrl = await uploadAvatar(data.avatarFile);
    }

    await updateEmployee(selectedEmployee.id, {
      ...data,
      avatarFile: undefined,
    });

    setIsEditModalOpen(false);
    setSelectedEmployee(null);
    refetch();
  }, [selectedEmployee, updateEmployee, uploadAvatar, refetch]);

  /**
   * Handle delete confirmation
   * Requirement 5.4: Soft delete by setting status to Terminated
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedEmployee) return;

    await deleteEmployee(selectedEmployee.id);
    setIsDeleteDialogOpen(false);
    setSelectedEmployee(null);
    refetch();
  }, [selectedEmployee, deleteEmployee, refetch]);

  /**
   * Handle delete cancel
   * Requirement 5.5: Close dialog without changes
   */
  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedEmployee(null);
  }, []);

  /**
   * Close import result notification
   */
  const handleCloseImportResult = useCallback(() => {
    setImportResult(null);
    setImportError(null);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân viên</h1>
        <p className="text-sm text-slate-500 mt-1">
          Xem, tìm kiếm và quản lý thông tin nhân viên
        </p>
      </div>

      {/* Import Result/Error Notification */}
      {(importResult || importError) && (
        <div className={`mb-4 p-4 rounded-lg border ${
          importError 
            ? 'bg-red-50 border-red-200 text-red-700' 
            : importResult?.errors.length 
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              {importError ? (
                <p>{importError}</p>
              ) : importResult && (
                <>
                  <p className="font-medium">
                    Kết quả nhập dữ liệu: {importResult.validRows.length} thành công
                    {importResult.errors.length > 0 && `, ${importResult.errors.length} lỗi`}
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 text-sm space-y-1">
                      {importResult.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>
                          Dòng {err.row}: {err.message} ({err.field}: {err.value})
                        </li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>... và {importResult.errors.length - 5} lỗi khác</li>
                      )}
                    </ul>
                  )}
                </>
              )}
            </div>
            <button
              onClick={handleCloseImportResult}
              className="text-current opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}


      {/* Filter Toolbar */}
      <FilterToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        onImport={handleImport}
        onAddNew={handleAddNew}
        departments={departmentNames}
      />

      {/* Employee Data Table */}
      <EmployeeDataTable
        employees={employees}
        loading={loading}
        error={error}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRetry={refetch}
      />

      {/* Pagination Control */}
      <PaginationControl
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={total}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Create Employee Modal */}
      <EmployeeModal
        isOpen={isCreateModalOpen}
        mode="create"
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        currentUserId={user?.id}
        departments={departmentNames}
      />

      {/* Edit Employee Modal */}
      <EmployeeModal
        isOpen={isEditModalOpen}
        mode="edit"
        employee={selectedEmployee || undefined}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleEditSubmit}
        currentUserId={user?.id}
        departments={departmentNames}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Xác nhận xóa nhân viên"
        message={`Bạn có chắc chắn muốn xóa nhân viên "${selectedEmployee?.fullName}"? Hành động này sẽ đánh dấu nhân viên là đã nghỉ việc.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={mutationLoading}
      />
    </div>
  );
};

export default EmployeeListPage;
