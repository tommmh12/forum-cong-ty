/**
 * Employee Pagination Utilities
 * Requirements: 3.2, 3.3
 */

/**
 * Paginates data by slicing based on page number and page size
 * @param data - Array of items to paginate
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Sliced array containing items for the specified page
 * 
 * Property 3: Pagination Navigation Correctness
 * For any employee list, page number, and page size, navigating to page X
 * SHALL display records from index ((X-1) * pageSize) to (X * pageSize - 1)
 * 
 * Requirement 3.3: Display the corresponding subset of filtered employees
 */
export function paginateData<T>(data: T[], page: number, pageSize: number): T[] {
  // Ensure page is at least 1
  const normalizedPage = Math.max(1, page);
  
  // Ensure pageSize is positive
  const normalizedPageSize = Math.max(1, pageSize);
  
  const startIndex = (normalizedPage - 1) * normalizedPageSize;
  const endIndex = startIndex + normalizedPageSize;
  
  return data.slice(startIndex, endIndex);
}

/**
 * Calculates the total number of pages based on total records and page size
 * @param totalRecords - Total number of records
 * @param pageSize - Number of items per page
 * @returns Total number of pages (minimum 1)
 * 
 * Property 2: Pagination Page Size Correctness
 * For any employee list with N records and any selected page size P,
 * the total pages SHALL equal ceil(N / P)
 * 
 * Requirement 3.2: Display that number of records per page
 */
export function calculateTotalPages(totalRecords: number, pageSize: number): number {
  if (totalRecords <= 0) {
    return 1;
  }
  
  // Ensure pageSize is positive
  const normalizedPageSize = Math.max(1, pageSize);
  
  return Math.ceil(totalRecords / normalizedPageSize);
}
