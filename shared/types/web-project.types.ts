import { Project, Task, TaskColumn } from './project.types';

// ============ Enums / Type Aliases ============

export type ResourceType = 'SITEMAP' | 'SRS' | 'WIREFRAME' | 'MOCKUP' | 'FIGMA_LINK' | 'ASSET' | 'CREDENTIAL';
export type ResourceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PhaseType = 'KICKOFF' | 'TECHNICAL_PLANNING' | 'DEVELOPMENT' | 'INTERNAL_TESTING' | 'UAT' | 'GO_LIVE';
export type PhaseStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export type EnvironmentType = 'LOCAL' | 'STAGING' | 'PRODUCTION';
export type DeploymentStatus = 'SUCCESS' | 'FAILED' | 'ROLLBACK';

export type TechStackCategory = 'LANGUAGE' | 'FRAMEWORK' | 'DATABASE' | 'HOSTING' | 'OTHER';

export type BugSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BugStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'WONT_FIX';

export type DesignReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGE_REQUESTED';

export type UATFeedbackStatus = 'PENDING' | 'ADDRESSED' | 'REJECTED';

export type SignoffType = 'DESIGN' | 'UAT' | 'GO_LIVE';

export type TaskCategory = 'FRONTEND' | 'BACKEND' | 'DESIGN' | 'DEVOPS' | 'QA';

// ============ Interfaces ============

export interface ProjectResource {
  id: string;
  projectId: string;
  type: ResourceType;
  name: string;
  filePath?: string;
  url?: string;
  version: number;
  status: ResourceStatus;
  approvedBy?: string;
  approvedAt?: string;
  encryptedData?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  phaseType: PhaseType;
  position: number;
  status: PhaseStatus;
  startedAt?: string;
  completedAt?: string;
  blockedReason?: string;
  createdAt: string;
}


export interface TechStackItem {
  id: string;
  projectId: string;
  category: TechStackCategory;
  name: string;
  version?: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  createdAt: string;
}

export interface ProjectEnvironment {
  id: string;
  projectId: string;
  envType: EnvironmentType;
  url?: string;
  currentVersion?: string;
  lastDeployedAt?: string;
  lastDeployedBy?: string;
  sslEnabled: boolean;
  createdAt: string;
  deploymentHistory?: DeploymentRecord[];
}

export interface DeploymentRecord {
  id: string;
  environmentId: string;
  version: string;
  deployedBy: string;
  deployedAt: string;
  commitHash?: string;
  notes?: string;
  status: DeploymentStatus;
}

export interface DesignReview {
  id: string;
  projectId: string;
  resourceId: string;
  status: DesignReviewStatus;
  reviewerId?: string;
  reviewedAt?: string;
  comments?: string;
  versionLocked?: number;
  createdAt: string;
}

export interface BugReport {
  id: string;
  projectId: string;
  taskId?: string;
  title: string;
  description?: string;
  severity: BugSeverity;
  status: BugStatus;
  environment: EnvironmentType;
  reproductionSteps: string;
  reportedBy: string;
  assignedTo?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface UATFeedback {
  id: string;
  projectId: string;
  featureName?: string;
  pageUrl?: string;
  feedbackText: string;
  status: UATFeedbackStatus;
  providedBy: string;
  addressedAt?: string;
  createdAt: string;
}

export interface ProjectSignoff {
  id: string;
  projectId: string;
  signoffType: SignoffType;
  approverName: string;
  approverEmail?: string;
  signatureData?: string;
  signedAt: string;
  notes?: string;
}


// Extended Task with category for web projects
export interface WebTask extends Task {
  category: TaskCategory;
  commitReference?: string;
  dependencies?: string[];
}

// Project Export/Import format for serialization
export interface ProjectExport {
  version: string;
  exportedAt: string;
  project: Project;
  phases: ProjectPhase[];
  resources: ProjectResource[];
  techStack: TechStackItem[];
  environments: ProjectEnvironment[];
  tasks: WebTask[];
  columns: TaskColumn[];
  bugReports: BugReport[];
  uatFeedback: UATFeedback[];
  signoffs: ProjectSignoff[];
}

// ============ Constants ============

export const PHASE_ORDER: PhaseType[] = [
  'KICKOFF',
  'TECHNICAL_PLANNING',
  'DEVELOPMENT',
  'INTERNAL_TESTING',
  'UAT',
  'GO_LIVE'
];

export const PHASE_REQUIREMENTS: Record<PhaseType, string[]> = {
  KICKOFF: [],
  TECHNICAL_PLANNING: ['SITEMAP', 'SRS', 'TECH_STACK_SELECTED'],
  DEVELOPMENT: ['DB_SCHEMA_APPROVED', 'API_DOC_APPROVED', 'DESIGN_APPROVED'],
  INTERNAL_TESTING: ['STAGING_DEPLOYED', 'ALL_DEV_TASKS_COMPLETE'],
  UAT: ['NO_CRITICAL_BUGS', 'TEST_CHECKLIST_COMPLETE'],
  GO_LIVE: ['UAT_SIGNOFF', 'ALL_FEEDBACK_ADDRESSED']
};

export const VALID_FILE_FORMATS: Record<ResourceType, string[]> = {
  SITEMAP: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'],
  SRS: ['pdf', 'doc', 'docx', 'md'],
  WIREFRAME: ['pdf', 'png', 'jpg', 'jpeg', 'fig', 'xd'],
  MOCKUP: ['pdf', 'png', 'jpg', 'jpeg', 'fig', 'xd', 'psd'],
  FIGMA_LINK: [], // URL validation only
  ASSET: ['zip', 'png', 'jpg', 'jpeg', 'svg', 'ttf', 'otf', 'woff', 'woff2'],
  CREDENTIAL: [] // Encrypted storage, no file validation
};

export const TECH_COMPATIBILITY: Record<string, string[]> = {
  'React': ['Node.js', 'Express', 'Next.js', 'MySQL', 'PostgreSQL', 'MongoDB'],
  'Vue.js': ['Node.js', 'Express', 'Nuxt.js', 'MySQL', 'PostgreSQL', 'MongoDB'],
  'Angular': ['Node.js', 'Express', 'MySQL', 'PostgreSQL'],
  'Laravel': ['PHP', 'MySQL', 'PostgreSQL'],
  'Django': ['Python', 'PostgreSQL', 'MySQL'],
  'WordPress': ['PHP', 'MySQL']
};

// ============ Helper Types ============

export interface CreateResourceInput {
  projectId: string;
  type: ResourceType;
  name: string;
  filePath?: string;
  url?: string;
  encryptedData?: string;
}

export interface CreateBugReportInput {
  projectId: string;
  taskId?: string;
  title: string;
  description?: string;
  severity: BugSeverity;
  environment: EnvironmentType;
  reproductionSteps: string;
  reportedBy: string;
}

export interface CreateUATFeedbackInput {
  projectId: string;
  featureName?: string;
  pageUrl?: string;
  feedbackText: string;
  providedBy: string;
}

export interface CreateSignoffInput {
  projectId: string;
  signoffType: SignoffType;
  approverName: string;
  approverEmail?: string;
  signatureData?: string;
  notes?: string;
}

export interface DeploymentInput {
  environmentId: string;
  version: string;
  deployedBy: string;
  commitHash?: string;
  notes?: string;
}
