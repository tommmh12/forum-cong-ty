/**
 * ActionMenu Component
 * Requirements: 5.1, 5.2, 5.3, 7.1
 * 
 * Three-dot menu with View, Edit, Delete options for employee rows.
 * 
 * Responsive Design (Requirement 7.1):
 * - Touch-friendly button with minimum 44x44px tap target
 * - Larger menu items for easier touch interaction
 */

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Eye, Edit2, Trash2 } from 'lucide-react';

interface ActionMenuProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * ActionMenu component provides contextual actions for employee rows
 * 
 * Requirements:
 * - 5.1: View Details action
 * - 5.2: Edit action
 * - 5.3: Delete action (triggers confirmation dialog)
 * - 7.1: Touch-friendly action buttons
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({
  onView,
  onEdit,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Menu items for keyboard navigation
  const menuItems = [
    { action: onView, label: 'view' },
    { action: onEdit, label: 'edit' },
    { action: onDelete, label: 'delete' },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation - Requirement 7.2
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => {
            const next = prev < menuItems.length - 1 ? prev + 1 : 0;
            menuItemsRef.current[next]?.focus();
            return next;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => {
            const next = prev > 0 ? prev - 1 : menuItems.length - 1;
            menuItemsRef.current[next]?.focus();
            return next;
          });
          break;
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          menuItemsRef.current[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          setFocusedIndex(menuItems.length - 1);
          menuItemsRef.current[menuItems.length - 1]?.focus();
          break;
        case 'Tab':
          // Close menu on tab to allow natural tab flow
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, menuItems.length]);

  // Focus first menu item when menu opens
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      // Small delay to ensure menu is rendered
      setTimeout(() => {
        menuItemsRef.current[0]?.focus();
      }, 0);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Handle keyboard activation of toggle button - Requirement 7.2
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    setFocusedIndex(-1);
    action();
  };

  return (
    <div className="relative">
      {/* Touch-friendly button with minimum 44x44px tap target - Requirement 7.1 */}
      {/* Keyboard accessible with Enter, Space, ArrowDown - Requirement 7.2 */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="min-w-[44px] min-h-[44px] p-2.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-600 
          hover:bg-slate-100 active:bg-slate-200 transition-colors 
          focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-1
          touch-manipulation"
        aria-label="Mở menu hành động"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 
            py-1 z-50 animate-fadeIn"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Touch-friendly menu items with larger tap targets - Requirement 7.1 */}
          {/* Keyboard navigable with Arrow keys - Requirement 7.2 */}
          <button
            ref={el => { menuItemsRef.current[0] = el; }}
            onClick={() => handleAction(onView)}
            className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-slate-700 
              hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation
              focus:outline-none focus:bg-slate-100"
            role="menuitem"
            tabIndex={focusedIndex === 0 ? 0 : -1}
          >
            <Eye className="w-4 h-4 text-slate-400" />
            Xem chi tiết
          </button>
          
          <button
            ref={el => { menuItemsRef.current[1] = el; }}
            onClick={() => handleAction(onEdit)}
            className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-slate-700 
              hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation
              focus:outline-none focus:bg-slate-100"
            role="menuitem"
            tabIndex={focusedIndex === 1 ? 0 : -1}
          >
            <Edit2 className="w-4 h-4 text-slate-400" />
            Chỉnh sửa
          </button>
          
          <div className="border-t border-slate-100 my-1" role="separator" />
          
          <button
            ref={el => { menuItemsRef.current[2] = el; }}
            onClick={() => handleAction(onDelete)}
            className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-red-600 
              hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation
              focus:outline-none focus:bg-red-50"
            role="menuitem"
            tabIndex={focusedIndex === 2 ? 0 : -1}
          >
            <Trash2 className="w-4 h-4" />
            Xóa nhân viên
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
