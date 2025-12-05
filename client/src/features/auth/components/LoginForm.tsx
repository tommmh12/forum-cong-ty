import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Layers } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Input, Button } from '../../../components/ui';
import { AuthStatus } from '../../../../../shared/types';

interface LoginFormProps {
  onLogin: (email: string, password?: string) => Promise<void>;
  onGoogleLogin?: (credential: string) => Promise<void>;
  status: AuthStatus;
  errorMessage: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onGoogleLogin, status, errorMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await onLogin(email, password);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (response.credential && onGoogleLogin) {
      await onGoogleLogin(response.credential);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 bg-brand-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-700/20">
                <Layers size={24} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">NEXUS<span className="text-brand-600">CORP</span></span>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Đăng nhập hệ thống</h1>
        <p className="text-slate-500 text-sm">
          Vui lòng nhập thông tin tài khoản doanh nghiệp của bạn để tiếp tục.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email doanh nghiệp"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={18} />}
          required
          autoFocus
        />

        <div>
          <Input
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={18} />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            required
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center">
                <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-brand-700 focus:ring-brand-600 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                Ghi nhớ tôi
                </label>
            </div>

            <a href="#" className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline">
                Quên mật khẩu?
            </a>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md text-sm flex items-start shadow-sm">
            <span className="font-semibold mr-1">Lỗi:</span> {errorMessage}
          </div>
        )}

        <Button 
          type="submit" 
          fullWidth 
          isLoading={status === AuthStatus.LOADING}
          className="shadow-brand-700/20 shadow-lg"
        >
          Đăng nhập <ArrowRight size={16} className="ml-2 opacity-80" />
        </Button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
            <span className="px-3 bg-white text-slate-400">Hoặc tiếp tục với</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="100%"
              text="continue_with"
              shape="rectangular"
            />
          </div>
          <Button type="button" variant="outline" className="w-full font-normal text-slate-600">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
               <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
            </svg>
            Microsoft
          </Button>
        </div>
      </form>
      
      <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
        <span>&copy; 2024 Nexus Corp.</span>
        <div className="flex gap-4">
            <a href="#" className="hover:text-brand-700 transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-brand-700 transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-brand-700 transition-colors">Trợ giúp</a>
        </div>
      </div>
    </div>
  );
};
