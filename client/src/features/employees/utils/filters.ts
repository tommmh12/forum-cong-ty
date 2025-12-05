/**
 * Employee Filter Utilities
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import type { Employee, EmployeeFilters, EmployeeStatus } from '@shared/types';

/**
 * Filters employees by search term (name or email contains)
 * @param employees - Array of employees to filter
 * @param searchTerm - Search string to match against name or email
 * @returns Filtered array of employees where name OR email contains the search term
 * 
 * Requirement 2.1: Filter employees by matching name or email containing the search term
 */
export function filterBySearch(employees: Employee[], searchTerm: string): Employee[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return employees;
  }
  
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return employees.filter(employee => 
    employee.fullName.toLowerCase().includes(normalizedSearch) ||
    employee.email.toLowerCase().includes(normalizedSearch)
  );
}

/**
 * Filters employees by department
 * @param employees - Array of employees to filter
 * @param department - Department to filter by (null means no filter)
 * @returns Filtered array of employees belonging to the specified department
 * 
 * Requirement 2.2: Display only employees belonging to that department
 */
export function filterByDepartment(employees: Employee[], department: string | null): Employee[] {
  if (department === null || department === '') {
    return employees;
  }
  
  return employees.filter(employee => employee.department === department);
}

/**
 * Filters employees by status
 * @param employees - Array of employees to filter
 * @param status - Status to filter by (null means no filter)
 * @returns Filtered array of employees with the specified status
 * 
 * Requirement 2.3: Display only employees with that status
 */
export function filterByStatus(employees: Employee[], status: EmployeeStatus | null): Employee[] {
  if (status === null) {
    return employees;
  }
  
  return employees.filter(employee => employee.status === status);
}


/**
 * Combines all filter conditions using AND logic
 * @param employees - Array of employees to filter
 * @param filters - Filter parameters (search, department, status)
 * @returns Filtered array of employees satisfying ALL active filter conditions
 * 
 * Property 1: Filter Combination Correctness
 * For any employee list and any combination of filters, all returned employees
 * SHALL satisfy ALL active filter conditions simultaneously (AND logic).
 * 
 * Requirement 2.4: Combine all filter conditions using AND logic
 */
export function combineFilters(employees: Employee[], filters: EmployeeFilters): Employee[] {
  let result = employees;
  
  // Apply search filter
  if (filters.search && filters.search.trim() !== '') {
    result = filterBySearch(result, filters.search);
  }
  
  // Apply department filter
  if (filters.department !== null && filters.department !== '') {
    result = filterByDepartment(result, filters.department);
  }
  
  // Apply status filter
  if (filters.status !== null) {
    result = filterByStatus(result, filters.status);
  }
  
  return result;
}
