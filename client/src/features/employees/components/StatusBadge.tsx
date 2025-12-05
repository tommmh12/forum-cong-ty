/**
 * StatusBadge Component
 * Requirement 1.6: Display status values as colored badges
 * 
 * Property 18: Status Badge Color Mapping
 * For any employee status value, the badge renderer SHALL return the correct
 * color class: "Active" → green, "On Leave" → yellow, "Terminated" → red.
 */

import React from 'react';
import type { EmployeeStatus } from '@shared/types';

interface StatusBadgeProps {
  status: EmployeeStatus;
  size?: 'sm' | 'md';
}

/**
 * Color mapping for employee status
 * Requirement 1.6: Active→green, On Leave→yellow, Terminated→red
 */
const STATUS_COLORS: Record<EmployeeStatus, { bg: string; text: string }> = {
  'Active': { bg: 'bg-green-100', text: 'text-green-700' },
  'On Leave': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'Terminated': { bg: 'bg-red-100', text: 'text-red-700' },
};

/**
 * Vietnamese labels for status values
 */
const STATUS_LABELS: Record<EmployeeStatus, string> = {
  'Active': 'Đang làm việc',
  'On Leave': 'Nghỉ phép',
  'Terminated': 'Đã nghỉ việc',
};

/**
 * Returns the color classes for a given status
 * Used for Property 18 testing
 */
export function getStatusColorClasses(status: EmployeeStatus): { bg: string; text: string } {
  return STATUS_COLORS[status] || { bg: 'bg-slate-100', text: 'text-slate-700' };
}

/**
 * StatusBadge component displays employee status as a colored badge
 * 
 * Requirement 1.6: Render status values as colored badges
 * - Active: green
 * - On Leave: yellow
 * - Terminated: red
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const colors = getStatusColorClasses(status);
  const label = STATUS_LABELS[status] || status;
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${colors.bg} ${colors.text} ${sizeClasses}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
