import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAPI } from '../../../services/api';
import { Employee, EmployeeFilters, PaginatedResponse, LinkedAccount } from '../../../../../shared/types';

/**
 * Employee with linked accounts for detail view
 * Requirement 5.2: Employee details include linked accounts
 */
export interface EmployeeWithLinkedAccounts extends Employee {
  linkedAccounts: LinkedAccount[];
}

/**
 * Parameters for the useEmployees hook
 * Requirements: 2.1, 2.2, 2.3, 3.2, 3.3
 */
export interface UseEmployeesParams {
  filters: EmployeeFilters;
  page: number;
  pageSize: number;
}

/**
 * Result interface for the useEmployees hook
 * Requirements: 1.2, 1.3, 5.2
 */
export interface UseEmployeesResult {
  employees: Employee[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  /** Fetch employee by ID with linked accounts (Requirement 5.2) */
  getEmployeeById: (id: string) => Promise<EmployeeWithLinkedAccounts>;
}

/**
 * Build query string from filters and pagination params
 */
function buildQueryString(params: UseEmployeesParams): string {
  const queryParams = new URLSearchParams();
  
  queryParams.set('page', params.page.toString());
  queryParams.set('size', params.pageSize.toString());
  
  if (params.filters.search) {
    queryParams.set('search', params.filters.search);
  }
  
  if (params.filters.department) {
    queryParams.set('department', params.filters.department);
  }
  
  if (params.filters.status) {
    queryParams.set('status', params.filters.status);
  }
  
  return queryParams.toString();
}


/**
 * Custom hook for fetching employees with filters and pagination
 * 
 * Requirements:
 * - 1.2: Display skeleton loading state until data retrieval completes
 * - 1.3: Display error message and retry button on fetch failure
 * - 2.1, 2.2, 2.3: Filter by search, department, status
 * - 3.2, 3.3: Pagination with page size and navigation
 * 
 * Uses AbortController to cancel in-flight requests when parameters change
 * or component unmounts, preventing race conditions and stale state updates.
 * 
 * @param params - Filters and pagination parameters
 * @returns UseEmployeesResult with employees data, loading state, error, and refetch function
 */
export function useEmployees(params: UseEmployeesParams): UseEmployeesResult {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Debounce timer ref for search
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // AbortController ref to cancel in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Serialize params to avoid infinite loop from object reference changes
  const paramsKey = JSON.stringify({
    page: params.page,
    pageSize: params.pageSize,
    search: params.filters.search || '',
    department: params.filters.department || '',
    status: params.filters.status || '',
  });

  const fetchEmployees = useCallback(async () => {
    // Abort any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Set loading to true at the start of fetch
    setLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI<PaginatedResponse<Employee>>(`/employees?${queryString}`, {
        method: 'GET',
        signal: abortController.signal,
      });
      
      // Only update state if component is still mounted and request wasn't aborted
      if (isMountedRef.current && !abortController.signal.aborted) {
        setEmployees(response.data);
        setTotal(response.total);
        setTotalPages(response.totalPages);
      }
    } catch (err) {
      // Ignore abort errors - they're expected when cancelling requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch employees'));
      }
    } finally {
      // Set loading to false after fetch completes (success or failure)
      // But only if this request wasn't aborted
      if (isMountedRef.current && !abortController.signal.aborted) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce the fetch for search input (300ms as per design)
    debounceTimerRef.current = setTimeout(() => {
      fetchEmployees();
    }, 300);
    
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Abort any in-flight request when unmounting or params change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchEmployees]);

  /**
   * Fetch employee by ID with linked accounts
   * Requirement 5.2: Fetch from GET /api/employees/:id with linked accounts
   */
  const getEmployeeById = useCallback(async (id: string): Promise<EmployeeWithLinkedAccounts> => {
    const response = await fetchAPI<EmployeeWithLinkedAccounts>(`/employees/${id}`, {
      method: 'GET',
    });
    return response;
  }, []);

  return {
    employees,
    total,
    totalPages,
    loading,
    error,
    refetch: fetchEmployees,
    getEmployeeById,
  };
}

export default useEmployees;
