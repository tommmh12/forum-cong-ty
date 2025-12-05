# Implementation Plan

## 1. Database Schema và Types

- [x] 1.1 Tạo migration cho các bảng mới
  - Tạo file `server/src/database/web-project-schema.ts`
  - Implement các bảng: project_resources, project_phases, project_tech_stack, project_environments, deployment_history, design_reviews, bug_reports, uat_feedback, project_signoffs
  - _Requirements: 1.1, 2.1, 4.1_

- [x] 1.2 Tạo TypeScript interfaces
  - Tạo file `shared/types/web-project.types.ts`
  - Định nghĩa tất cả interfaces: ProjectResource, ProjectPhase, TechStackItem, ProjectEnvironment, DeploymentRecord, DesignReview, BugReport, UATFeedback, ProjectSignoff, WebTask, ProjectExport
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1_

- [ ]* 1.3 Write property test cho Project Initialization
  - **Property 1: Project Initialization Completeness**
  - **Validates: Requirements 2.1, 4.1**

## 2. Resource Management Module

- [x] 2.1 Implement Resource Repository
  - Tạo file `server/src/repositories/resource.repository.ts`
  - Implement CRUD operations cho project_resources
  - Implement version tracking logic
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 2.2 Implement Resource Validation Service
  - Tạo file `server/src/services/resource-validation.service.ts`
  - Implement file format validation theo VALID_FILE_FORMATS
  - Implement URL validation cho Figma links
  - _Requirements: 1.2, 1.3_

- [ ]* 2.3 Write property test cho Resource File Format Validation
  - **Property 2: Resource File Format Validation**
  - **Validates: Requirements 1.2, 1.3**

- [x] 2.4 Implement Resource API Routes
  - Tạo file `server/src/routes/resource.routes.ts`
  - Implement endpoints: POST/GET/PUT/DELETE /projects/:id/resources
  - Implement approval endpoint: POST /projects/:id/resources/:rid/approve
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 2.5 Implement ResourceManager Component
  - Tạo file `client/src/features/projects/shared/ResourceManager.tsx`
  - Hiển thị checklist tài nguyên với trạng thái
  - Implement upload và preview functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

## 3. Phase Management Module

- [x] 3.1 Implement Phase Repository
  - Tạo file `server/src/repositories/phase.repository.ts`
  - Implement CRUD operations cho project_phases
  - Implement phase initialization khi tạo project
  - _Requirements: 2.1_

- [x] 3.2 Implement Phase Transition Service
  - Tạo file `server/src/services/phase-transition.service.ts`
  - Implement PHASE_REQUIREMENTS validation
  - Implement PHASE_ORDER enforcement
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ]* 3.3 Write property test cho Phase Transition Validation
  - **Property 3: Phase Transition Validation**
  - **Validates: Requirements 2.2, 2.6**

- [x] 3.4 Implement Phase API Routes
  - Tạo file `server/src/routes/phase.routes.ts`
  - Implement endpoints: GET/PUT /projects/:id/phases
  - Implement transition endpoint: POST /projects/:id/phases/:pid/transition
  - _Requirements: 2.2, 2.6_

- [x] 3.5 Implement PhaseTracker Component
  - Tạo file `client/src/features/projects/shared/PhaseTracker.tsx`
  - Hiển thị timeline 6 phases với trạng thái
  - Implement transition controls với validation feedback
  - _Requirements: 2.1, 2.2, 2.6_

## 4. Checkpoint - Đảm bảo tests pass

- [x] 4. Checkpoint





  - Ensure all tests pass, ask the user if questions arise.

## 5. Tech Stack Module

- [x] 5.1 Implement TechStack Repository
  - Tạo file `server/src/repositories/tech-stack.repository.ts`
  - Implement CRUD operations cho project_tech_stack
  - Implement locking mechanism
  - _Requirements: 3.1, 3.3_

- [x] 5.2 Implement TechStack Compatibility Service
  - Tạo file `server/src/services/tech-stack.service.ts`
  - Implement TECH_COMPATIBILITY validation
  - Implement lock/unlock logic với Manager approval
  - _Requirements: 3.2, 3.3_

- [ ]* 5.3 Write property test cho Tech Stack Immutability
  - **Property 4: Tech Stack Immutability After Lock**
  - **Validates: Requirements 3.3**

- [x] 5.4 Implement TechStack API Routes
  - Tạo file `server/src/routes/tech-stack.routes.ts`
  - Implement endpoints: GET/POST/PUT /projects/:id/tech-stack
  - Implement lock endpoint: POST /projects/:id/tech-stack/lock
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5.5 Implement TechStackSelector Component
  - Tạo file `client/src/features/projects/shared/TechStackSelector.tsx`
  - Hiển thị form chọn tech stack với compatibility hints
  - Implement lock indicator và version display
  - _Requirements: 3.1, 3.2, 3.4_

## 6. Environment Management Module

- [ ] 6.1 Implement Environment Repository
  - Tạo file `server/src/repositories/environment.repository.ts`
  - Implement CRUD operations cho project_environments và deployment_history
  - Implement environment initialization khi tạo project
  - _Requirements: 4.1, 4.2_

- [ ] 6.2 Implement Deployment Service
  - Tạo file `server/src/services/deployment.service.ts`
  - Implement deployment recording với required fields
  - Implement Production deployment gate (UAT sign-off check)
  - _Requirements: 4.2, 4.3, 4.4_

- [ ]* 6.3 Write property test cho Deployment Recording
  - **Property 5: Deployment Recording Completeness**
  - **Validates: Requirements 4.2, 4.5**

- [ ]* 6.4 Write property test cho Production Deployment Gate
  - **Property 6: Production Deployment Gate**
  - **Validates: Requirements 4.3**

- [ ] 6.5 Implement Environment API Routes
  - Tạo file `server/src/routes/environment.routes.ts`
  - Implement endpoints: GET/PUT /projects/:id/environments
  - Implement deploy endpoint: POST /projects/:id/environments/:eid/deploy
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 6.6 Implement EnvironmentManager Component
  - Tạo file `client/src/features/projects/shared/EnvironmentManager.tsx`
  - Hiển thị 3 environments với status và deployment history
  - Implement deployment controls với approval workflow
  - _Requirements: 4.1, 4.2, 4.5_

- [ ]* 6.7 Write property test cho Environment Status Display
  - **Property 15: Environment Status Display Completeness**
  - **Validates: Requirements 4.5**

## 7. Task Category Module

- [ ] 7.1 Extend Task Repository
  - Cập nhật `server/src/repositories/project.repository.ts`
  - Thêm category field và commit_reference cho tasks
  - Implement task-role validation
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 7.2 Write property test cho Task Category-Role Validation
  - **Property 7: Task Category-Role Validation**
  - **Validates: Requirements 5.2**

- [ ]* 7.3 Write property test cho Task Grouping
  - **Property 14: Task Grouping by Category**
  - **Validates: Requirements 5.5**

- [ ] 7.4 Update CreateTaskModal Component
  - Cập nhật `client/src/features/projects/shared/CreateTaskModal.tsx`
  - Thêm category selector (Frontend, Backend, Design, DevOps, QA)
  - Thêm commit reference field cho completion
  - _Requirements: 5.1, 5.3_

- [ ] 7.5 Update KanbanBoard Component
  - Cập nhật `client/src/features/projects/shared/KanbanBoard.tsx`
  - Thêm grouping by category option
  - Hiển thị dependency relationships
  - _Requirements: 5.5_

## 8. Checkpoint - Đảm bảo tests pass

- [ ] 8. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## 9. Design Review Module

- [ ] 9.1 Implement DesignReview Repository
  - Tạo file `server/src/repositories/design-review.repository.ts`
  - Implement CRUD operations cho design_reviews
  - Implement version locking khi approve
  - _Requirements: 6.1, 6.2_

- [ ] 9.2 Implement DesignReview Service
  - Tạo file `server/src/services/design-review.service.ts`
  - Implement approval workflow
  - Implement change request creation
  - Implement Frontend task blocking logic
  - _Requirements: 6.2, 6.3, 6.5_

- [ ]* 9.3 Write property test cho Design Approval Blocks Frontend Tasks
  - **Property 8: Design Approval Blocks Frontend Tasks**
  - **Validates: Requirements 6.5**

- [ ] 9.4 Implement DesignReview API Routes
  - Tạo file `server/src/routes/design-review.routes.ts`
  - Implement endpoints: GET/POST/PUT /projects/:id/design-reviews
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 9.5 Implement DesignReview Component
  - Tạo file `client/src/features/projects/shared/DesignReview.tsx`
  - Hiển thị design assets với approval status
  - Implement approval workflow UI
  - _Requirements: 6.1, 6.2, 6.4_

## 10. Testing và Bug Tracking Module

- [ ] 10.1 Implement BugReport Repository
  - Tạo file `server/src/repositories/bug-report.repository.ts`
  - Implement CRUD operations cho bug_reports
  - Implement severity-based queries
  - _Requirements: 7.1, 7.2_

- [ ] 10.2 Implement Testing Service
  - Tạo file `server/src/services/testing.service.ts`
  - Implement bug report validation (required fields)
  - Implement critical bug check cho phase transition
  - Implement test statistics calculation
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ]* 10.3 Write property test cho Bug Report Required Fields
  - **Property 9: Bug Report Required Fields**
  - **Validates: Requirements 7.2**

- [ ]* 10.4 Write property test cho Critical Bug Blocks Phase Transition
  - **Property 10: Critical Bug Blocks Phase Transition**
  - **Validates: Requirements 7.3**

- [ ] 10.5 Implement Bug API Routes
  - Tạo file `server/src/routes/bug.routes.ts`
  - Implement endpoints: GET/POST/PUT /projects/:id/bugs
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 10.6 Implement TestingModule Component
  - Tạo file `client/src/features/projects/shared/TestingModule.tsx`
  - Hiển thị test checklist và bug list
  - Implement bug report form với required fields
  - Hiển thị statistics và trend charts
  - _Requirements: 7.1, 7.2, 7.5_

## 11. UAT và Sign-off Module

- [ ] 11.1 Implement UAT Repository
  - Tạo file `server/src/repositories/uat.repository.ts`
  - Implement CRUD operations cho uat_feedback và project_signoffs
  - _Requirements: 8.1, 8.2, 8.4_

- [ ] 11.2 Implement UAT Service
  - Tạo file `server/src/services/uat.service.ts`
  - Implement feedback status tracking
  - Implement sign-off gate logic
  - Implement sign-off recording
  - _Requirements: 8.3, 8.4, 8.5_

- [ ]* 11.3 Write property test cho UAT Feedback Completeness Gate
  - **Property 11: UAT Feedback Completeness Gate**
  - **Validates: Requirements 8.3**

- [ ]* 11.4 Write property test cho Sign-off Recording Completeness
  - **Property 12: Sign-off Recording Completeness**
  - **Validates: Requirements 8.4**

- [ ] 11.5 Implement UAT API Routes
  - Tạo file `server/src/routes/uat.routes.ts`
  - Implement endpoints: GET/POST/PUT /projects/:id/uat-feedback
  - Implement signoff endpoints: GET/POST /projects/:id/signoffs
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 11.6 Implement UATModule Component
  - Tạo file `client/src/features/projects/shared/UATModule.tsx`
  - Hiển thị Staging URL và feedback list
  - Implement feedback form và status tracking
  - Implement sign-off request với signature capture
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

## 12. Checkpoint - Đảm bảo tests pass

- [ ] 12. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## 13. Go Live và Handover Module

- [ ] 13.1 Implement GoLive Service
  - Tạo file `server/src/services/go-live.service.ts`
  - Implement deployment checklist generation
  - Implement handover documentation compilation
  - Implement warranty period tracking
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 13.2 Implement GoLive API Routes
  - Tạo file `server/src/routes/go-live.routes.ts`
  - Implement checklist endpoint: GET /projects/:id/go-live/checklist
  - Implement handover endpoint: GET /projects/:id/handover
  - _Requirements: 9.1, 9.3, 9.5_

- [ ] 13.3 Implement GoLiveChecklist Component
  - Tạo file `client/src/features/projects/shared/GoLiveChecklist.tsx`
  - Hiển thị deployment checklist (SSL, domain, backup)
  - Implement completion tracking
  - _Requirements: 9.1, 9.2_

- [ ] 13.4 Implement HandoverModule Component
  - Tạo file `client/src/features/projects/shared/HandoverModule.tsx`
  - Hiển thị handover documentation package
  - Implement download functionality
  - Hiển thị warranty period và support info
  - _Requirements: 9.3, 9.4, 9.5_

## 14. Export/Import Module

- [ ] 14.1 Implement Export Service
  - Tạo file `server/src/services/export.service.ts`
  - Implement JSON export với full project data
  - Implement JSON import với validation
  - Implement PDF report generation
  - Implement CSV export
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 14.2 Write property test cho JSON Export-Import Round Trip
  - **Property 13: JSON Export-Import Round Trip**
  - **Validates: Requirements 10.3**

- [ ] 14.3 Implement Export API Routes
  - Tạo file `server/src/routes/export.routes.ts`
  - Implement endpoints: GET /projects/:id/export (JSON)
  - Implement endpoints: GET /projects/:id/export/pdf
  - Implement endpoints: GET /projects/:id/export/csv
  - Implement import endpoint: POST /projects/import
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14.4 Implement ExportModule Component
  - Tạo file `client/src/features/projects/shared/ExportModule.tsx`
  - Hiển thị export options (JSON, PDF, CSV)
  - Implement content selection UI
  - Implement import functionality
  - _Requirements: 10.1, 10.5_

## 15. Integration và UI Updates

- [ ] 15.1 Update ProjectDetailView
  - Cập nhật `client/src/features/projects/shared/ProjectDetailView.tsx`
  - Thêm tabs mới: Resources, Phases, Tech Stack, Environments, Design Review, Testing, UAT, Go Live, Export
  - Integrate tất cả components mới
  - _Requirements: All_

- [ ] 15.2 Update ProjectModule
  - Cập nhật `client/src/features/projects/shared/ProjectModule.tsx`
  - Cập nhật CreateProjectForm với resource checklist và tech stack selection
  - Hiển thị phase status trên project cards
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 15.3 Update API Routes Index
  - Cập nhật `server/src/routes/api.routes.ts`
  - Register tất cả routes mới
  - _Requirements: All_

- [ ] 15.4 Update Hooks
  - Tạo hooks mới trong `client/src/hooks/`
  - useProjectResources, useProjectPhases, useTechStack, useEnvironments, useDesignReviews, useBugReports, useUATFeedback, useSignoffs
  - _Requirements: All_

## 16. Final Checkpoint

- [ ] 16. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
