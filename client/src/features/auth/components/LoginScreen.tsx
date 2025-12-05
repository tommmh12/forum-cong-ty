import React from 'react';
import { LoginForm } from './LoginForm';
import { AuthStatus } from '../../../../../shared/types';

interface LoginScreenProps {
  onLogin: (email: string, password?: string) => Promise<void>;
  onGoogleLogin?: (credential: string) => Promise<void>;
  status: AuthStatus;
  errorMessage: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGoogleLogin, status, errorMessage }) => {
  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* Left Column: Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white z-10 relative shadow-2xl lg:shadow-none w-full lg:w-[45%] max-w-[600px]">
        <LoginForm onLogin={onLogin} onGoogleLogin={onGoogleLogin} status={status} errorMessage={errorMessage} />
      </div>

      {/* Right Column: Corporate Visuals */}
      <div className="hidden lg:block relative w-0 flex-1 overflow-hidden">
        {/* Background Image */}
        <img
          className="absolute inset-0 h-full w-full object-cover scale-105"
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop"
          alt="Corporate Office"
        />
        
        {/* Modern Corporate Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />

        {/* Content Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-16 text-white z-20">
          <div className="flex justify-end">
             {/* Top decorative element */}
             <div className="w-16 h-16 border-t-2 border-r-2 border-white/20 rounded-tr-3xl"></div>
          </div>
          
          <div className="max-w-2xl">
             <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-100 text-xs font-medium backdrop-blur-sm uppercase tracking-wider">
                  Internal System
                </span>
             </div>
             
             <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-6 text-white">
               Kỷ nguyên mới của <br/> <span className="text-blue-300">quản trị doanh nghiệp</span>
             </h2>
             
             <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-lg">
               Nexus cung cấp nền tảng tập trung giúp tối ưu hóa quy trình làm việc, kết nối nhân sự và thúc đẩy văn hóa chia sẻ tri thức.
             </p>

             {/* Testimonial / CEO Quote */}
             <div className="relative pl-6 border-l-4 border-brand-500 bg-white/5 p-6 rounded-r-xl backdrop-blur-sm">
               <p className="italic text-slate-200 text-base mb-4">
                 "Chuyển đổi số không chỉ là công nghệ, đó là cách chúng ta định hình lại tư duy để kiến tạo tương lai."
               </p>
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-brand-500/50">
                    <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100" alt="CEO" className="h-full w-full object-cover" />
                 </div>
                 <div>
                   <p className="font-semibold text-white text-sm">Nguyễn Văn An</p>
                   <p className="text-slate-400 text-xs uppercase tracking-wide">CEO & Founder, Nexus Corp</p>
                 </div>
               </div>
             </div>
          </div>
          
          <div className="flex justify-between items-end">
              <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  <div className="w-2 h-2 rounded-full bg-white/30"></div>
                  <div className="w-2 h-2 rounded-full bg-white/30"></div>
              </div>
              <p className="text-xs text-slate-400 font-mono">v2.4.0-stable</p>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-1/4 right-0 transform translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 transform -translate-x-1/3 translate-y-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
};
