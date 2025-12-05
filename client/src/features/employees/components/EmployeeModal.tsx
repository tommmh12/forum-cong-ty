/**
 * EmployeeModal Component
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.6, 7.2
 * 
 * Modal form for creating and editing employee records.
 * Supports avatar upload with preview and displays validation errors.
 * 
 * Keyboard Navigation (Requirement 7.2):
 * - Tab navigation through form fields
 * - Escape key to close modal
 * - Focus trap within modal
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { Employee, EmployeeFormData, EmployeeStatus, EmployeeRole } from '@shared/types';
import { validateEmployee, getFieldError, ValidationResult } from '../services/validationService';

interface EmployeeModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  employee?: Employee;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  currentUserId?: string; // For self-deletion prevention check
  departments: string[];
}

const STATUS_OPTIONS: Array<{ value: EmployeeStatus; label: string }> = [
  { value: 'Active', label: 'Đang làm việc' },
  { value: 'On Leave', label: 'Nghỉ phép' },
  { value: 'Terminated', label: 'Đã nghỉ việc' },
];

const ROLE_OPTIONS: Array<{ value: EmployeeRole; label: string }> = [
  { value: 'Employee', label: 'Employee' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Admin', label: 'Admin' },
];

const INITIAL_FORM_DATA: EmployeeFormData = {
  fullName: '',
  email: '',
  phoneNumber: '',
  department: '',
  position: '',
  status: 'Active',
  role: 'Employee',
  joinDate: new Date().toISOString().split('T')[0],
};


/**
 * EmployeeModal component for creating and editing employees
 * 
 * Requirements:
 * - 4.1: Open modal in create mode
 * - 4.2: Create new employee and refresh data table
 * - 4.3: Display validation errors and prevent submission
 * - 4.4: Require fullName, email, department, position, status
 * - 4.5: Display error for invalid email format
 * - 4.6: Upload avatar file and return avatarUrl
 * - 4.7: Display error on avatar upload failure
 * - 5.2: Pre-populate form with employee data in edit mode
 * - 5.6: Prevent self-deletion (warning message)
 * - 7.2: Keyboard navigation with focus trap
 */
export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  mode,
  employee,
  onClose,
  onSubmit,
  currentUserId,
  departments,
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>(INITIAL_FORM_DATA);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && employee) {
        // Requirement 5.2: Pre-populate form with employee data
        setFormData({
          fullName: employee.fullName,
          email: employee.email,
          phoneNumber: employee.phoneNumber,
          department: employee.department,
          position: employee.position,
          status: employee.status,
          role: employee.role || 'Employee',
          joinDate: employee.joinDate,
        });
        setAvatarPreview(employee.avatarUrl || null);
      } else {
        setFormData(INITIAL_FORM_DATA);
        setAvatarPreview(null);
      }
      setValidation({ isValid: true, errors: [] });
      setSubmitError(null);
    }
  }, [isOpen, mode, employee]);

  // Handle escape key to close and focus trap - Requirement 7.2
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
        return;
      }

      // Focus trap - Requirement 7.2
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: if on first element, go to last
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, go to first
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      // Focus first focusable element when modal opens - Requirement 7.2
      setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, isSubmitting]);

  const handleChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (validation.errors.some(e => e.field === field)) {
      setValidation(prev => ({
        ...prev,
        errors: prev.errors.filter(e => e.field !== field),
      }));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSubmitError('Vui lòng chọn file hình ảnh');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Kích thước file không được vượt quá 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, avatarFile: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate form data
    const validationResult = validateEmployee(formData);
    setValidation(validationResult);

    if (!validationResult.isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'Đã xảy ra lỗi. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const title = mode === 'create' ? 'Thêm nhân viên mới' : 'Chỉnh sửa thông tin';
  const submitLabel = mode === 'create' ? 'Thêm nhân viên' : 'Lưu thay đổi';

  // Check if editing self (for warning display)
  const isEditingSelf = mode === 'edit' && employee?.id === currentUserId;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 id="modal-title" className="text-xl font-bold text-slate-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Self-edit warning */}
            {isEditingSelf && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Bạn đang chỉnh sửa thông tin tài khoản của chính mình.
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
                {submitError}
              </div>
            )}

            {/* Avatar upload */}
            <div className="flex justify-center">
              <div className="relative">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 
                    flex items-center justify-center overflow-hidden hover:border-brand-400 
                    hover:bg-slate-50 transition-colors group"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-400 group-hover:text-brand-500" />
                  )}
                </button>
                <div className="absolute -bottom-1 -right-1 bg-brand-600 text-white p-1.5 rounded-full shadow-md">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>
            <p className="text-center text-xs text-slate-500">
              Click để tải ảnh đại diện (tối đa 5MB)
            </p>


            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="col-span-2 md:col-span-1">
                <Input
                  label="Họ và tên"
                  name="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  error={getFieldError(validation, 'fullName')}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              {/* Email */}
              <div className="col-span-2 md:col-span-1">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={getFieldError(validation, 'email')}
                  placeholder="example@company.com"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="col-span-2 md:col-span-1">
                <Input
                  label="Số điện thoại"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  placeholder="0123 456 789"
                />
              </div>

              {/* Join Date */}
              <div className="col-span-2 md:col-span-1">
                <Input
                  label="Ngày gia nhập"
                  name="joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => handleChange('joinDate', e.target.value)}
                />
              </div>

              {/* Department */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phòng ban <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm
                    focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600
                    transition-all duration-200
                    ${getFieldError(validation, 'department') 
                      ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
                      : 'border-slate-200'
                    }`}
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {getFieldError(validation, 'department') && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {getFieldError(validation, 'department')}
                  </p>
                )}
              </div>

              {/* Position */}
              <div className="col-span-2 md:col-span-1">
                <Input
                  label="Chức danh"
                  name="position"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  error={getFieldError(validation, 'position')}
                  placeholder="Nhập chức danh"
                  required
                />
              </div>

              {/* Role */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm
                    focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600
                    transition-all duration-200
                    ${getFieldError(validation, 'role') 
                      ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
                      : 'border-slate-200'
                    }`}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {getFieldError(validation, 'role') && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {getFieldError(validation, 'role')}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {STATUS_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer
                        transition-colors
                        ${formData.status === option.value
                          ? 'bg-brand-50 border-brand-300 text-brand-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={formData.status === option.value}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
                {getFieldError(validation, 'status') && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {getFieldError(validation, 'status')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
