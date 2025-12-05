import { query } from '../config/database';
import { EmployeeProfile, LinkedAccount } from '../../../shared/types';

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  position: string;
  department: string;
  role: 'Admin' | 'Manager' | 'Employee';
  status: 'Active' | 'Blocked';
  phone: string;
  join_date: string;
  employee_id: string;
  karma_points?: number;
}

export interface LinkedAccountRow {
  id: string;
  user_id: string;
  provider: string;
  provider_email: string;
  connected: boolean;
  last_synced: string | null;
}

function mapRowToUser(row: UserRow, linkedAccounts: LinkedAccount[] = []): EmployeeProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    position: row.position,
    department: row.department,
    role: row.role,
    status: row.status,
    phone: row.phone,
    joinDate: row.join_date,
    employeeId: row.employee_id,
    linkedAccounts,
    karmaPoints: row.karma_points ?? 0,
  };
}

export async function findAllUsers(): Promise<EmployeeProfile[]> {
  const users = await query<UserRow[]>('SELECT * FROM users');
  const linkedAccounts = await query<LinkedAccountRow[]>('SELECT * FROM linked_accounts');
  
  return users.map(user => {
    const userAccounts = linkedAccounts
      .filter(acc => acc.user_id === user.id)
      .map(acc => ({
        provider: acc.provider,
        email: acc.provider_email,
        connected: acc.connected,
        lastSynced: acc.last_synced || undefined,
      }));
    return mapRowToUser(user, userAccounts);
  });
}

export async function findUserById(id: string): Promise<EmployeeProfile | null> {
  const users = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]);
  if (users.length === 0) return null;
  
  const linkedAccounts = await query<LinkedAccountRow[]>(
    'SELECT * FROM linked_accounts WHERE user_id = ?',
    [id]
  );
  
  const userAccounts = linkedAccounts.map(acc => ({
    provider: acc.provider,
    email: acc.provider_email,
    connected: acc.connected,
    lastSynced: acc.last_synced || undefined,
  }));
  
  return mapRowToUser(users[0], userAccounts);
}

export async function findUserByEmail(email: string): Promise<EmployeeProfile | null> {
  const users = await query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
  if (users.length === 0) return null;
  return mapRowToUser(users[0]);
}

/**
 * Update user karma points by delta
 * @param userId User ID
 * @param delta Change in karma (positive or negative)
 */
export async function updateUserKarma(userId: string, delta: number): Promise<void> {
  await query(
    'UPDATE users SET karma_points = karma_points + ? WHERE id = ?',
    [delta, userId]
  );
}

export default { findAllUsers, findUserById, findUserByEmail, updateUserKarma };
