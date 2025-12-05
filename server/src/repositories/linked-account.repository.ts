import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface LinkedAccount {
  id: string;
  userId: string;
  provider: string;
  providerEmail: string | null;
  connected: boolean;
  lastSynced: string | null;
  createdAt: string;
}

interface LinkedAccountRow {
  id: string;
  user_id: string;
  provider: string;
  provider_email: string | null;
  connected: boolean;
  last_synced: string | null;
  created_at: string;
}

function mapRowToLinkedAccount(row: LinkedAccountRow): LinkedAccount {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerEmail: row.provider_email,
    connected: row.connected,
    lastSynced: row.last_synced,
    createdAt: row.created_at,
  };
}

/**
 * Find linked account by provider and provider email
 */
export async function findByProviderEmail(
  provider: string,
  providerEmail: string
): Promise<LinkedAccount | null> {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT * FROM linked_accounts WHERE provider = ? AND provider_email = ? AND connected = TRUE`,
    [provider, providerEmail]
  ) as any;

  if (rows.length === 0) return null;
  return mapRowToLinkedAccount(rows[0]);
}

/**
 * Find all linked accounts for a user
 */
export async function findByUserId(userId: string): Promise<LinkedAccount[]> {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT * FROM linked_accounts WHERE user_id = ?`,
    [userId]
  ) as any;

  return (rows as LinkedAccountRow[]).map(mapRowToLinkedAccount);
}

/**
 * Link a Google account to a user
 */
export async function linkGoogleAccount(
  userId: string,
  googleEmail: string
): Promise<LinkedAccount> {
  const pool = getPool();
  
  // Check if already linked
  const [existing] = await pool.execute(
    `SELECT * FROM linked_accounts WHERE user_id = ? AND provider = 'google'`,
    [userId]
  ) as any;

  if (existing.length > 0) {
    // Update existing
    await pool.execute(
      `UPDATE linked_accounts SET provider_email = ?, connected = TRUE, last_synced = NOW() WHERE id = ?`,
      [googleEmail, existing[0].id]
    );
    return {
      ...mapRowToLinkedAccount(existing[0]),
      providerEmail: googleEmail,
      connected: true,
    };
  }

  // Create new
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO linked_accounts (id, user_id, provider, provider_email, connected, last_synced)
     VALUES (?, ?, 'google', ?, TRUE, NOW())`,
    [id, userId, googleEmail]
  );

  const [rows] = await pool.execute(
    `SELECT * FROM linked_accounts WHERE id = ?`,
    [id]
  ) as any;

  return mapRowToLinkedAccount(rows[0]);
}

/**
 * Unlink a Google account from a user
 */
export async function unlinkGoogleAccount(userId: string): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.execute(
    `UPDATE linked_accounts SET connected = FALSE, provider_email = NULL WHERE user_id = ? AND provider = 'google'`,
    [userId]
  ) as any;

  return result.affectedRows > 0;
}

export default {
  findByProviderEmail,
  findByUserId,
  linkGoogleAccount,
  unlinkGoogleAccount,
};
