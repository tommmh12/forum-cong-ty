export interface Department {
  id: string;
  code: string;
  name: string;
  managerName: string;
  managerAvatar: string;
  memberCount: number;
  description: string;
  budget: string;
  kpiStatus: string;
  parentDeptId?: string;
}

export interface LinkedAccount {
  provider: string;
  email: string;
  connected: boolean;
  lastSynced?: string;
}

export interface EmployeeProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  position: string;
  department: string;
  role: 'Admin' | 'Manager' | 'Employee';
  status: 'Active' | 'Blocked' | 'Pending';
  phone: string;
  joinDate: string;
  employeeId: string;
  linkedAccounts: LinkedAccount[];
  karmaPoints?: number; // Forum karma points
}
