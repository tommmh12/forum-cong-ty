import { Router } from 'express';
import * as linkedAccountRepo from '../repositories/linked-account.repository';
import * as employeeRepo from '../repositories/employee.repository';
import { getPool } from '../config/database';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.middleware';
import { env } from '../config/env';

const router = Router();

interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

/**
 * Map database role to frontend UserRole enum
 */
function mapRole(dbRole: string): string {
  const roleMap: Record<string, string> = {
    'Admin': 'ADMIN',
    'Manager': 'MANAGER',
    'Employee': 'EMPLOYEE',
  };
  return roleMap[dbRole] || 'EMPLOYEE';
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'MISSING_CREDENTIALS',
        message: 'Vui lòng nhập email và mật khẩu.' 
      });
    }

    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, password_hash, avatar_url, position, department, role, employee_status, account_status, is_first_login
       FROM users WHERE email = ?`,
      [email]
    ) as any;

    if (rows.length === 0) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không đúng.',
      });
    }

    const user = rows[0];

    // Check if user is active
    if (user.employee_status === 'Terminated') {
      return res.status(403).json({
        error: 'USER_TERMINATED',
        message: 'Tài khoản của bạn đã bị vô hiệu hóa.',
      });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({
        error: 'NO_PASSWORD',
        message: 'Tài khoản chưa được thiết lập mật khẩu. Vui lòng liên hệ quản trị viên.',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không đúng.',
      });
    }

    // Check if first login - require password change
    if (user.is_first_login) {
      return res.json({
        requirePasswordChange: true,
        userId: user.id,
        message: 'Vui lòng đổi mật khẩu để kích hoạt tài khoản.',
      });
    }

    // Generate JWT token
    const userData = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      avatarUrl: user.avatar_url,
      department: user.department,
      role: mapRole(user.role) as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
    };
    const token = generateToken(userData);

    res.json({
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.' });
  }
});

/**
 * Response from Google's tokeninfo endpoint
 */
interface GoogleTokenInfoResponse {
  aud: string;
  exp: string;
  email: string;
  name: string;
  picture: string;
  sub: string;
  email_verified?: string;
  iss?: string;
}

/**
 * Verify Google ID token using Google's tokeninfo endpoint
 * This validates signature, issuer, audience, and expiry
 */
async function verifyGoogleToken(credential: string): Promise<GoogleUserInfo | null> {
  try {
    // Fail fast if Google Client ID is not configured
    if (!env.googleClientId) {
      console.error('GOOGLE_CLIENT_ID is not configured. Google OAuth will not work.');
      throw new Error('Google OAuth is not configured on the server.');
    }

    // Use Google's tokeninfo endpoint to verify the token
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    
    if (!response.ok) {
      console.error('Google token verification failed:', response.status);
      return null;
    }
    
    const payload = await response.json() as GoogleTokenInfoResponse;
    
    // Verify the token is for our app (check audience) using centralized config
    if (payload.aud !== env.googleClientId) {
      console.error('Google token audience mismatch. Expected:', env.googleClientId, 'Got:', payload.aud);
      return null;
    }
    
    // Check token expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && parseInt(payload.exp) < now) {
      console.error('Google token expired');
      return null;
    }
    
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub,
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return null;
  }
}

/**
 * POST /api/auth/google
 * Login with Google - only allows users who have linked their Google account
 */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'MISSING_CREDENTIAL', message: 'Thiếu thông tin xác thực Google.' });
    }

    // Verify Google token using Google's API
    const googleUser = await verifyGoogleToken(credential);
    
    if (!googleUser) {
      return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token Google không hợp lệ hoặc đã hết hạn.' });
    }

    // Check if this Google email is linked to any user
    const linkedAccount = await linkedAccountRepo.findByProviderEmail('google', googleUser.email);

    if (!linkedAccount) {
      return res.status(403).json({
        error: 'GOOGLE_NOT_LINKED',
        message: 'Tài khoản Google này chưa được liên kết với nhân viên nào trong hệ thống. Vui lòng liên hệ quản trị viên.',
      });
    }

    // Get the user info
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, avatar_url, position, department, role, employee_status
       FROM users WHERE id = ?`,
      [linkedAccount.userId]
    ) as any;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    const user = rows[0];

    // Check if user is active
    if (user.employee_status === 'Terminated') {
      return res.status(403).json({
        error: 'USER_TERMINATED',
        message: 'Tài khoản của bạn đã bị vô hiệu hóa.',
      });
    }

    // Generate JWT token
    const userData = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      avatarUrl: user.avatar_url || googleUser.picture,
      department: user.department,
      role: mapRole(user.role) as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
    };
    const token = generateToken(userData);

    res.json({
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.' });
  }
});

/**
 * POST /api/auth/link-google
 * Link Google account to current user
 */
router.post('/link-google', async (req, res) => {
  try {
    const { userId, googleEmail } = req.body;

    if (!userId || !googleEmail) {
      return res.status(400).json({ error: 'MISSING_DATA', message: 'Thiếu thông tin userId hoặc googleEmail.' });
    }

    // Check if user exists
    const employee = await employeeRepo.findById(userId);
    if (!employee) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    // Check if this Google email is already linked to another user
    const existingLink = await linkedAccountRepo.findByProviderEmail('google', googleEmail);
    if (existingLink && existingLink.userId !== userId) {
      return res.status(400).json({
        error: 'EMAIL_ALREADY_LINKED',
        message: 'Email Google này đã được liên kết với tài khoản khác.',
      });
    }

    // Link the account
    const linkedAccount = await linkedAccountRepo.linkGoogleAccount(userId, googleEmail);

    res.json({
      success: true,
      linkedAccount,
    });
  } catch (error) {
    console.error('Link Google error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.' });
  }
});

/**
 * DELETE /api/auth/unlink-google/:userId
 * Unlink Google account from user
 */
router.delete('/unlink-google/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const success = await linkedAccountRepo.unlinkGoogleAccount(userId);

    res.json({ success, message: success ? 'Đã hủy liên kết thành công.' : 'Không thể hủy liên kết.' });
  } catch (error) {
    console.error('Unlink Google error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.' });
  }
});

/**
 * GET /api/auth/linked-accounts/:userId
 * Get all linked accounts for a user
 */
router.get('/linked-accounts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const accounts = await linkedAccountRepo.findByUserId(userId);

    res.json(accounts);
  } catch (error) {
    console.error('Get linked accounts error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.' });
  }
});

/**
 * POST /api/auth/change-password
 * Change password (for first login or regular password change)
 * Security: Uses database is_first_login flag, not client-provided value
 */
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({
        error: 'MISSING_DATA',
        message: 'Thiếu thông tin cần thiết.',
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'WEAK_PASSWORD',
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      });
    }

    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, password_hash, avatar_url, department, role, is_first_login
       FROM users WHERE id = ?`,
      [userId]
    ) as any;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    const user = rows[0];

    // Use database is_first_login flag (not client-provided) to determine if current password is required
    // This prevents bypass of current password verification
    if (!user.is_first_login) {
      // Regular password change - require current password verification
      if (!currentPassword) {
        return res.status(400).json({
          error: 'MISSING_CURRENT_PASSWORD',
          message: 'Vui lòng nhập mật khẩu hiện tại.',
        });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'INVALID_PASSWORD',
          message: 'Mật khẩu hiện tại không đúng.',
        });
      }
    }
    // First login - no current password required (user is setting initial password)

    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    await pool.execute(
      `UPDATE users SET password_hash = ?, is_first_login = FALSE, account_status = 'Active' WHERE id = ?`,
      [newPasswordHash, userId]
    );

    // Generate JWT token for auto-login after password change
    const userData = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      avatarUrl: user.avatar_url,
      department: user.department,
      role: mapRole(user.role) as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
    };
    const token = generateToken(userData);

    // Return user data and token for auto-login after password change
    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công!',
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.' });
  }
});

export default router;
