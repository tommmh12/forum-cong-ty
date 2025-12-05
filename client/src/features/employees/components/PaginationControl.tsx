/**
 * PaginationControl Component
 * Requirements: 3.1, 3.2, 3.3, 3.4, 7.1
 * 
 * Provides page navigation (prev, next, page numbers), rows-per-page selector,
 * and displays current range and total count.
 * 
 * Responsive Design (Requirement 7.1):
 * - Stacked layout on mobile
 * - Touch-friendly navigation buttons
 */

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

/**
 * Generates array of page numbers to display
 * Shows first, last, current, and adjacent pages with ellipsis
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  
  // Always show first page
  pages.push(1);
  
  if (currentPage > 3) {
    pages.push('ellipsis');
  }
  
  // Show pages around current page
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  
  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }
  
  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }
  
  // Always show last page
  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }
  
  return pages;
}


/**
 * PaginationControl component for navigating through paginated data
 * 
 * Requirements:
 * - 3.1: Display page navigation controls when records exceed page size
 * - 3.2: Rows-per-page selector (10, 20, 50)
 * - 3.3: Navigate to different pages
 * - 3.4: Show current page range and total record count
 * - 7.1: Responsive layout with touch-friendly controls
 */
export const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
}) => {
  // Calculate current range
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    onPageSizeChange(newSize);
  };

  // Don't render if no records
  if (totalRecords === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-3 sm:px-4 py-3 mt-4">
      {/* Responsive layout: stacked on mobile - Requirement 7.1 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Records info - Requirement 3.4 */}
        <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
          Hiển thị <span className="font-medium text-slate-900">{startRecord}</span> đến{' '}
          <span className="font-medium text-slate-900">{endRecord}</span> trong tổng số{' '}
          <span className="font-medium text-slate-900">{totalRecords}</span> nhân viên
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* Page size selector - Requirement 3.2 */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-slate-600">Hiển thị:</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="appearance-none pl-3 pr-8 py-2 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm
                  focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600
                  cursor-pointer transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Page navigation - Requirements 3.1, 3.3, 7.1 (touch-friendly) */}
          <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Pagination">
            {/* Previous button - Touch-friendly size */}
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2.5 sm:p-2 rounded-lg text-slate-600 
                hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50 
                disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors touch-manipulation"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers - Hidden on very small screens, show simplified on mobile */}
            <div className="hidden xs:flex items-center gap-0.5 sm:gap-1">
              {pageNumbers.map((page, index) => {
                if (page === 'ellipsis') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-1 sm:px-2 py-1 text-sm text-slate-400"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`min-w-[40px] sm:min-w-[36px] h-10 sm:h-9 px-2 sm:px-3 rounded-lg text-sm font-medium 
                      transition-colors touch-manipulation
                      ${currentPage === page
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
                      }`}
                    aria-label={`Trang ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Simplified page indicator for very small screens */}
            <span className="xs:hidden px-2 text-sm text-slate-600">
              {currentPage} / {totalPages}
            </span>

            {/* Next button - Touch-friendly size */}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2.5 sm:p-2 rounded-lg text-slate-600 
                hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50 
                disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors touch-manipulation"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default PaginationControl;
