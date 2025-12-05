import nodemailer from 'nodemailer';
import { env } from '../config/env';

// Check if SMTP is configured
const isSmtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

// Configure transporter - sử dụng Gmail hoặc SMTP server của bạn
const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

interface WelcomeEmailData {
  to: string;
  fullName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}

/**
 * Send welcome email with temporary password to new employee
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const { to, fullName, email, tempPassword, loginUrl } = data;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .credentials p { margin: 8px 0; }
        .credentials strong { color: #1e40af; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Chào mừng đến với NEXUS CORP</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Tài khoản của bạn đã được tạo thành công trên hệ thống quản lý nội bộ NEXUS CORP.</p>
          
          <div class="credentials">
            <h3>📧 Thông tin đăng nhập:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mật khẩu tạm thời:</strong> ${tempPassword}</p>
          </div>
          
          <div class="warning">
            ⚠️ <strong>Lưu ý quan trọng:</strong> Vì lý do bảo mật, bạn sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu tiên.
          </div>
          
          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Đăng nhập ngay</a>
          </p>
          
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ bộ phận IT.</p>
          <p>Trân trọng,<br><strong>NEXUS CORP Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 NEXUS CORP. All rights reserved.</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // SECURITY: Only log sensitive info in LOCAL development mode
  // This prevents accidental credential logging in shared/staging environments
  const isLocalDevelopment = env.nodeEnv === 'development';
  const logTempPasswordsEnabled = process.env.LOG_TEMP_PASSWORDS === 'true';
  
  // Extra safety check: refuse to log passwords if NODE_ENV is anything other than 'development'
  const shouldLogCredentials = isLocalDevelopment && logTempPasswordsEnabled;
  
  // Warn if LOG_TEMP_PASSWORDS is set in non-development environment
  if (logTempPasswordsEnabled && !isLocalDevelopment) {
    console.warn('⚠️  SECURITY WARNING: LOG_TEMP_PASSWORDS is enabled but NODE_ENV is not "development". Credential logging is disabled for security.');
  }

  // If SMTP not configured, log info (credentials only in local development with explicit flag)
  if (!transporter) {
    console.log('⚠️  SMTP not configured. Email would be sent to:', to);
    if (shouldLogCredentials) {
      // WARNING: This should NEVER be enabled in shared/staging/production environments
      console.log('📧 ========== WELCOME EMAIL (LOCAL DEV ONLY) ==========');
      console.log(`   To: ${to}`);
      console.log(`   Name: ${fullName}`);
      console.log(`   Email: ${email}`);
      console.log(`   Temp Password: ${tempPassword}`);
      console.log(`   Login URL: ${loginUrl}`);
      console.log('=======================================================');
    } else if (isLocalDevelopment) {
      console.log('📧 Welcome email prepared for:', to, '(set LOG_TEMP_PASSWORDS=true to see credentials in local dev)');
    } else {
      console.log('📧 Welcome email would be sent to:', to);
    }
    return true; // Return true so employee creation doesn't fail
  }

  try {
    await transporter.sendMail({
      from: `"NEXUS CORP" <${process.env.SMTP_USER || 'noreply@nexus.com'}>`,
      to,
      subject: '🎉 Chào mừng bạn đến với NEXUS CORP - Thông tin tài khoản',
      html: htmlContent,
    });
    console.log(`✅ Welcome email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    // Still return true so employee creation doesn't fail
    if (shouldLogCredentials) {
      console.log('📧 ========== WELCOME EMAIL FALLBACK (LOCAL DEV ONLY) ==========');
      console.log(`   To: ${to}`);
      console.log(`   Temp Password: ${tempPassword}`);
      console.log('================================================================');
    } else {
      console.log('📧 Email sending failed for:', to);
    }
    return true;
  }
}

/**
 * Generate random password
 */
export function generateTempPassword(length: number = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default { sendWelcomeEmail, generateTempPassword };
