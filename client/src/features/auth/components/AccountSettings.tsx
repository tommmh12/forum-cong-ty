import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { User, Link2, Unlink, Mail, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui';

const API_BASE_URL = 'http://localhost:3001/api';

interface LinkedAccount {
  id: string;
  provider: string;
  providerEmail: string | null;
  connected: boolean;
}

interface AccountSettingsProps {
  userId: string;
  userEmail: string;
  userName: string;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ userId, userEmail, userName }) => {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch linked accounts on mount
  useEffect(() => {
    fetchLinkedAccounts();
  }, [userId]);

  const fetchLinkedAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/linked-accounts/${userId}`);
      const data = await response.json();
      setLinkedAccounts(data);
    } catch (error) {
      console.error('Failed to fetch linked accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLinking(true);
      setMessage(null);
      try {
        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoResponse.json();

        // Link the account
        const response = await fetch(`${API_BASE_URL}/auth/link-google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            googleEmail: googleUser.email,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage({ type: 'error', text: data.message || 'Liên kết thất bại' });
          return;
        }

        setMessage({ type: 'success', text: `Đã liên kết thành công với ${googleUser.email}` });
        fetchLinkedAccounts();
      } catch (error) {
        setMessage({ type: 'error', text: 'Có lỗi xảy ra. Vui lòng thử lại.' });
      } finally {
        setLinking(false);
      }
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Đăng nhập Google thất bại' });
    },
  });

  const handleUnlinkGoogle = async () => {
    if (!confirm('Bạn có chắc muốn hủy liên kết tài khoản Google?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/unlink-google/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Đã hủy liên kết tài khoản Google' });
        fetchLinkedAccounts();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra. Vui lòng thử lại.' });
    }
  };

  const googleAccount = linkedAccounts.find(acc => acc.provider === 'google' && acc.connected);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt tài khoản</h1>
        <p className="text-slate-500 mt-1">Quản lý thông tin và bảo mật tài khoản của bạn</p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <User size={20} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Thông tin tài khoản</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm text-slate-500">Họ tên</p>
              <p className="font-medium text-slate-900">{userName}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-slate-500">Email công ty</p>
              <p className="font-medium text-slate-900">{userEmail}</p>
            </div>
            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
              <CheckCircle size={12} /> Đã xác thực
            </span>
          </div>
        </div>
      </div>

      {/* Linked Accounts */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Link2 size={20} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tài khoản liên kết</h2>
            <p className="text-sm text-slate-500">Liên kết tài khoản bên ngoài để đăng nhập nhanh hơn</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-slate-500">Đang tải...</div>
        ) : (
          <div className="space-y-4">
            {/* Google Account */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Google</p>
                  {googleAccount ? (
                    <p className="text-sm text-slate-500">{googleAccount.providerEmail}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Chưa liên kết</p>
                  )}
                </div>
              </div>
              
              {googleAccount ? (
                <Button
                  variant="outline"
                  onClick={handleUnlinkGoogle}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Unlink size={16} className="mr-2" />
                  Hủy liên kết
                </Button>
              ) : (
                <button
                  onClick={() => googleLogin()}
                  disabled={linking}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {linking ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Link2 size={16} className="mr-2" />
                      Liên kết ngay
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Microsoft Account (placeholder) */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Microsoft</p>
                  <p className="text-sm text-slate-500">Sắp ra mắt</p>
                </div>
              </div>
              <Button disabled variant="outline">
                Sắp có
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Bảo mật tài khoản</p>
              <p className="text-sm text-blue-700 mt-1">
                Sau khi liên kết, bạn có thể sử dụng tài khoản Google để đăng nhập nhanh vào hệ thống 
                mà không cần nhập mật khẩu. Chỉ email Google đã liên kết mới được phép đăng nhập.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
