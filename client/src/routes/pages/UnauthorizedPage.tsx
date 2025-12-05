import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../features/auth/context/AuthContext';
import { FALLBACK_PATHS } from '../index';

/**
 * Unauthorized page displayed when user tries to access a route
 * they don't have permission for.
 */
export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToDashboard = () => {
    navigate(FALLBACK_PATHS.dashboard);
  };

  const handleGoToLogin = () => {
    navigate(FALLBACK_PATHS.login);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Không có quyền truy cập
        </h1>
        <p className="text-gray-600 mb-6">
          {isAuthenticated && user
            ? `Xin lỗi ${user.name}, bạn không có quyền truy cập trang này.`
            : 'Bạn cần đăng nhập để truy cập trang này.'}
        </p>
        <div className="space-y-3">
          {isAuthenticated ? (
            <>
              <button
                onClick={handleGoToDashboard}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Về trang Dashboard
              </button>
              <button
                onClick={handleGoBack}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Quay lại
              </button>
            </>
          ) : (
            <button
              onClick={handleGoToLogin}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
