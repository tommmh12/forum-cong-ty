/**
 * ConfirmDialog Component
 * Requirements: 5.3, 5.4, 5.5, 7.2
 * 
 * Modal dialog with title, message, confirm/cancel buttons.
 * Supports danger/warning/info variants.
 * 
 * Keyboard Navigation (Requirement 7.2):
 * - Tab navigation between buttons
 * - Escape key to close/cancel
 * - Focus trap within dialog
 */

import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

type DialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Variant configuration for icon and colors
 */
const VARIANT_CONFIG: Record<DialogVariant, {
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  buttonVariant: 'primary' | 'secondary' | 'outline';
  buttonClass: string;
}> = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonVariant: 'primary',
    buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: AlertCircle,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    buttonVariant: 'primary',
    buttonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonVariant: 'primary',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
};


/**
 * ConfirmDialog component for confirmation before destructive actions
 * 
 * Requirements:
 * - 5.3: Display confirmation dialog before deletion
 * - 5.4: Confirm deletion triggers soft delete
 * - 5.5: Cancel closes dialog without changes
 * - 7.2: Keyboard navigation with focus trap
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const config = VARIANT_CONFIG[variant];
  const IconComponent = config.icon;

  // Handle escape key and focus trap - Requirement 7.2
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onCancel();
        return;
      }

      // Focus trap - Requirement 7.2
      if (event.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
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
      
      // Focus cancel button when dialog opens - Requirement 7.2
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel, isLoading]);

  // Handle click outside to close
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !isLoading) {
      onCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scaleIn"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 id="dialog-title" className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="flex gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center`}>
              <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <p id="dialog-description" className="text-sm text-slate-600 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Keyboard navigable buttons - Requirement 7.2 */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md text-sm font-semibold 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 
              disabled:opacity-60 disabled:pointer-events-none tracking-wide
              hover:bg-slate-100 text-slate-600 hover:text-slate-900 h-11 px-6 py-2"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center rounded-md text-sm font-semibold 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 
              disabled:opacity-60 disabled:pointer-events-none tracking-wide
              text-white shadow-sm hover:shadow-md h-11 px-6 py-2
              ${config.buttonClass}`}
          >
            {isLoading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
