/**
 * EmployeeDataTable Component
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1
 * 
 * Data table displaying employee records with columns for Avatar+Name, Email,
 * Department, Position, Status, and Actions.
 * 
 * Responsive Design (Requirement 7.1):
 * - Horizontal scroll for table on mobile (viewport < 768px)
 * - Touch-friendly action buttons with larger tap targets
 */

import React from 'react';
import { Users } from 'lucide-react';
import { Employee } from '@shared/types';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../../../components/ui';
import { StatusBadge } from './StatusBadge';
import { ActionMenu } from './ActionMenu';

interface EmployeeDataTableProps {
  employees: Employee[];
  loading: boolean;
  error: Error | null;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onRetry: () => void;
}

/**
 * Skeleton loading row component
 * Requirement 1.2: Display skeleton loading state
 * Requirement 7.1: Responsive padding for mobile
 */
const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-3 sm:px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-4 w-24 sm:w-32 bg-slate-200 rounded" />
          <div className="h-3 w-16 sm:w-24 bg-slate-200 rounded" />
        </div>
      </div>
    </td>
    <td className="px-3 sm:px-6 py-4">
      <div className="h-4 w-32 sm:w-40 bg-slate-200 rounded" />
    </td>
    <td className="px-3 sm:px-6 py-4">
      <div className="h-4 w-20 sm:w-24 bg-slate-200 rounded" />
    </td>
    <td className="px-3 sm:px-6 py-4">
      <div className="h-4 w-24 sm:w-28 bg-slate-200 rounded" />
    </td>
    <td className="px-3 sm:px-6 py-4">
      <div className="h-6 w-20 bg-slate-200 rounded-full" />
    </td>
    <td className="px-3 sm:px-6 py-4">
      <div className="h-10 w-10 sm:h-8 sm:w-8 bg-slate-200 rounded" />
    </td>
  </tr>
);


/**
 * EmployeeDataTable component displays employee records in a table format
 * 
 * Requirements:
 * - 1.1: Display Data_Table with columns for Avatar+Name, Email, Department, Position, Status, Actions
 * - 1.2: Display skeleton loading state until data retrieval completes
 * - 1.3: Display error message and retry button on fetch failure
 * - 1.4: Display empty state when no employees exist
 * - 1.5: Apply visual highlight effect on row hover
 * - 7.1: Responsive design with horizontal scroll on mobile
 * - 7.2: Keyboard navigation support through interactive elements
 */
export const EmployeeDataTable: React.FC<EmployeeDataTableProps> = ({
  employees,
  loading,
  error,
  onView,
  onEdit,
  onDelete,
  onRetry,
}) => {
  // Requirement 1.3: Display error state with retry button
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <ErrorMessage 
          message={error.message || 'Không thể tải danh sách nhân viên. Vui lòng thử lại.'} 
          onRetry={onRetry} 
        />
      </div>
    );
  }

  // Requirement 1.2: Display skeleton loading state
  // Requirement 7.1: Horizontal scroll container for mobile
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Horizontal scroll wrapper for mobile - Requirement 7.1 */}
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="min-w-full divide-y divide-slate-200" style={{ minWidth: '800px' }}>
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Nhân viên
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Email
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Phòng ban
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Chức danh
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Trạng thái
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {[...Array(5)].map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Requirement 1.4: Display empty state
  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <EmptyState
          title="Chưa có nhân viên"
          message="Bắt đầu bằng cách thêm nhân viên mới vào hệ thống."
          icon={<Users className="w-6 h-6 text-slate-400" />}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Horizontal scroll wrapper for mobile - Requirement 7.1 */}
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="min-w-full divide-y divide-slate-200" style={{ minWidth: '800px' }}>
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Nhân viên
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Email
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Phòng ban
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Chức danh
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Trạng thái
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {employees.map((employee) => (
              <tr
                key={employee.id}
                className="hover:bg-slate-50 transition-colors active:bg-slate-100"
              >
                {/* Avatar + Name Column */}
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=random`}
                        alt={employee.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      />
                      {/* Account status indicator */}
                      <span 
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          employee.accountStatus === 'Active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        title={employee.accountStatus === 'Active' ? 'Đã kích hoạt' : 'Chưa đăng nhập'}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{employee.fullName}</div>
                      <div className="text-xs text-slate-500">{employee.employeeId}</div>
                    </div>
                  </div>
                </td>

                {/* Email Column */}
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">{employee.email}</span>
                </td>

                {/* Department Column */}
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">{employee.department}</span>
                </td>

                {/* Position Column */}
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">{employee.position}</span>
                </td>

                {/* Status Column */}
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={employee.status} />
                </td>

                {/* Actions Column - Touch-friendly on mobile (Requirement 7.1) */}
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                  <ActionMenu
                    onView={() => onView(employee)}
                    onEdit={() => onEdit(employee)}
                    onDelete={() => onDelete(employee)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeDataTable;
