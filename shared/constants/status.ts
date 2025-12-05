// Auth Status
export const AUTH_STATUS = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
} as const;

// Project Status
export const PROJECT_STATUS = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

// Task Priority
export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

// Task Type
export const TASK_TYPE = {
  FEATURE: 'FEATURE',
  BUG: 'BUG',
  IMPROVEMENT: 'IMPROVEMENT',
  RESEARCH: 'RESEARCH',
} as const;

// Employee Status
export const EMPLOYEE_STATUS = {
  ACTIVE: 'Active',
  BLOCKED: 'Blocked',
  PENDING: 'Pending',
} as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

// Department KPI Status
export const KPI_STATUS = {
  ON_TRACK: 'On Track',
  AT_RISK: 'At Risk',
  BEHIND: 'Behind',
} as const;
export type KpiStatus = (typeof KPI_STATUS)[keyof typeof KPI_STATUS];

// Meeting Room Status
export const ROOM_STATUS = {
  AVAILABLE: 'AVAILABLE',
  MAINTENANCE: 'MAINTENANCE',
} as const;
export type RoomStatus = (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS];

// Room Type
export const ROOM_TYPE = {
  PHYSICAL: 'PHYSICAL',
  VIRTUAL: 'VIRTUAL',
} as const;
export type RoomType = (typeof ROOM_TYPE)[keyof typeof ROOM_TYPE];

// Booking Status
export const BOOKING_STATUS = {
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

// Meeting Platform
export const MEETING_PLATFORM = {
  ZOOM: 'Zoom',
  GOOGLE_MEET: 'Google Meet',
  MICROSOFT_TEAMS: 'Microsoft Teams',
  JITSI: 'Jitsi',
} as const;
export type MeetingPlatform = (typeof MEETING_PLATFORM)[keyof typeof MEETING_PLATFORM];

// Linked Account Provider
export const LINKED_ACCOUNT_PROVIDER = {
  GOOGLE: 'google',
  MICROSOFT: 'microsoft',
  SLACK: 'slack',
  GITHUB: 'github',
} as const;
export type LinkedAccountProvider = (typeof LINKED_ACCOUNT_PROVIDER)[keyof typeof LINKED_ACCOUNT_PROVIDER];
