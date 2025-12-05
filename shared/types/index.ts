// User types
export { UserRole, AuthStatus } from './user.types';
export type { User, AuthState } from './user.types';

// Project types
export type {
  Project,
  ProjectMember,
  TaskColumn,
  ChecklistItem,
  Comment,
  Task,
  TaskType,
} from './project.types';

// Organization types
export type {
  Department,
  LinkedAccount,
  EmployeeProfile,
} from './organization.types';

// Workspace types
export type { MeetingRoom, Booking } from './workspace.types';

// Employee types
export type { EmployeeStatus, EmployeeRole } from './employee.types';
export type {
  Employee,
  PaginatedResponse,
  EmployeeFormData,
  EmployeeFilters,
} from './employee.types';

// Web Project types
export type {
  ResourceType,
  ResourceStatus,
  PhaseType,
  PhaseStatus,
  EnvironmentType,
  DeploymentStatus,
  TechStackCategory,
  BugSeverity,
  BugStatus,
  DesignReviewStatus,
  UATFeedbackStatus,
  SignoffType,
  TaskCategory,
  ProjectResource,
  ProjectPhase,
  TechStackItem,
  ProjectEnvironment,
  DeploymentRecord,
  DesignReview,
  BugReport,
  UATFeedback,
  ProjectSignoff,
  WebTask,
  ProjectExport,
  CreateResourceInput,
  CreateBugReportInput,
  CreateUATFeedbackInput,
  CreateSignoffInput,
  DeploymentInput,
} from './web-project.types';

export {
  PHASE_ORDER,
  PHASE_REQUIREMENTS,
  VALID_FILE_FORMATS,
  TECH_COMPATIBILITY,
} from './web-project.types';

// Forum types
export type {
  SpaceType,
  SpaceMemberRole,
  VoteTargetType,
  VoteType,
  ForumSpace,
  ForumSpaceMember,
  ForumPost,
  ForumVote,
  ForumComment,
  ForumAuthor,
  ForumSpaceInfo,
  FeedPost,
} from './forum.types';