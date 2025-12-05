import { UserRole } from '../types/user.types';

export const ROLES = {
  ADMIN: UserRole.ADMIN,
  MANAGER: UserRole.MANAGER,
  EMPLOYEE: UserRole.EMPLOYEE,
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.EMPLOYEE]: 'Employee',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 3,
  [UserRole.MANAGER]: 2,
  [UserRole.EMPLOYEE]: 1,
};

export const PROJECT_MEMBER_ROLES = ['MANAGER', 'LEADER', 'MEMBER', 'VIEWER'] as const;
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number];

export const EMPLOYEE_PROFILE_ROLES = ['Admin', 'Manager', 'Employee'] as const;
export type EmployeeProfileRole = (typeof EMPLOYEE_PROFILE_ROLES)[number];
