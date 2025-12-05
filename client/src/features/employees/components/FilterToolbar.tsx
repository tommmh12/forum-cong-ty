/**
 * FilterToolbar Component
 * Requirements: 2.1, 2.2, 2.3, 6.1, 6.3, 7.1
 * 
 * Provides search input with debounce, department and status dropdown filters,
 * Export CSV and Import Data buttons, and Add New Employee button.
 * 
 * Responsive Design (Requirement 7.1):
 * - Stacked layout on mobile with full-width elements
 * - Touch-friendly buttons and inputs
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Upload, Plus, ChevronDown } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { EmployeeFilters, EmployeeStatus } from '@shared/types';

interface FilterToolbarProps {
  filters: EmployeeFilters;
  onFiltersChange: (filters: EmployeeFilters) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onAddNew: () => void;
  departments: string[];
}

const STATUS_OPTIONS: Array<{ value: EmployeeStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Active', label: 'Đang làm việc' },
  { value: 'On Leave', label: 'Nghỉ phép' },
  { value: 'Terminated', label: 'Đã nghỉ việc' },
];

/**
 * FilterToolbar component for employee list filtering
 * 
 * Requirements:
 * - 2.1: Search input filters by name or email
 * - 2.2: Department dropdown filter
 * - 2.3: Status dropdown filter
 * - 6.1: Export to CSV button
 * - 6.3: Import Data button with file picker
 * - 7.1: Responsive layout for mobile devices
 */
export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onFiltersChange,
  onExport,
  onImport,
  onAddNew,
  departments,
}) => {
  const [searchValue, setSearchValue] = useState(filters.search);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Debounce search input (300ms as per design)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue });
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue, filters, onFiltersChange]);

  // Sync local search value with external filter changes
  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      department: value || null,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as EmployeeStatus | '';
    onFiltersChange({
      ...filters,
      status: value || null,
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
      {/* Responsive layout: stacked on mobile, row on larger screens - Requirement 7.1 */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Search and Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search Input - Full width on mobile */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchValue}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm
                  focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600
                  placeholder:text-slate-400 transition-all duration-200 touch-manipulation"
              />
            </div>
          </div>

          {/* Filters Row - Side by side on mobile, inline on larger screens */}
          <div className="flex flex-row gap-2 sm:gap-4">
            {/* Department Filter */}
            <div className="relative flex-1 sm:flex-none sm:min-w-[180px]">
              <select
                value={filters.department || ''}
                onChange={handleDepartmentChange}
                className="w-full appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm
                  focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600
                  cursor-pointer transition-all duration-200 touch-manipulation"
              >
                <option value="">Tất cả phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative flex-1 sm:flex-none sm:min-w-[180px]">
              <select
                value={filters.status || ''}
                onChange={handleStatusChange}
                className="w-full appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm
                  focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600
                  cursor-pointer transition-all duration-200 touch-manipulation"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Action Buttons Row - Full width on mobile, inline on larger screens */}
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          {/* Export/Import buttons - Side by side on mobile */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onExport} 
              size="md" 
              className="flex-1 sm:flex-none min-h-[44px] touch-manipulation"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Xuất CSV</span>
              <span className="xs:hidden">Xuất</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleImportClick} 
              size="md"
              className="flex-1 sm:flex-none min-h-[44px] touch-manipulation"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Nhập dữ liệu</span>
              <span className="xs:hidden">Nhập</span>
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {/* Add Employee button - Full width on mobile */}
          <Button 
            onClick={onAddNew} 
            size="md"
            className="w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm nhân viên
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;
