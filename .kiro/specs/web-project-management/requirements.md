# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cho module Quản lý Dự án Web (Web Project Management) - một hệ thống toàn diện để quản lý quy trình phát triển website từ giai đoạn khởi tạo (Kick-off) đến khi triển khai (Go Live). Hệ thống hỗ trợ Manager quản lý tài nguyên đầu vào, theo dõi tiến độ qua các giai đoạn, và đảm bảo chất lượng sản phẩm cuối cùng.

## Glossary

- **Web_Project_System**: Hệ thống quản lý dự án web
- **Manager**: Người quản lý dự án, có quyền tạo/sửa/xóa dự án và giao việc
- **Developer**: Nhân viên phát triển (Frontend/Backend)
- **Designer**: Nhân viên thiết kế UI/UX
- **Project**: Dự án web với đầy đủ thông tin về tài nguyên, timeline, và trạng thái
- **Phase**: Giai đoạn trong quy trình phát triển (Kick-off, Planning, Development, Testing, UAT, Go Live)
- **Resource**: Tài nguyên đầu vào (Sitemap, SRS, Design Assets, Access Credentials)
- **Environment**: Môi trường triển khai (Local, Staging, Production)
- **Task**: Công việc cụ thể được giao cho nhân viên
- **Milestone**: Mốc quan trọng trong dự án
- **Tech_Stack**: Bộ công nghệ sử dụng cho dự án (ngôn ngữ, framework, database)

## Requirements

### Requirement 1: Quản lý Tài nguyên Đầu vào (Input Resources)

**User Story:** As a Manager, I want to manage all input resources for a web project, so that I can ensure developers have everything they need before starting work.

#### Acceptance Criteria

1. WHEN a Manager creates a new project THEN the Web_Project_System SHALL display a checklist of required input resources including Sitemap, SRS/Feature List, Design Assets, and Access Credentials
2. WHEN a Manager uploads a Sitemap document THEN the Web_Project_System SHALL validate the file format (PDF, DOC, XLS, or image) and store it with version tracking
3. WHEN a Manager uploads Design Assets (Figma link, wireframes, mockups) THEN the Web_Project_System SHALL categorize them by type and associate them with the project
4. WHEN a Manager adds Access Credentials (Hosting, Domain, Git repository) THEN the Web_Project_System SHALL encrypt and store them securely with role-based access
5. IF a required resource is missing THEN the Web_Project_System SHALL display a warning indicator on the project dashboard and prevent transition to Development phase

### Requirement 2: Quản lý Giai đoạn Dự án (Project Phases)

**User Story:** As a Manager, I want to track project progress through defined phases, so that I can ensure the project follows the correct workflow.

#### Acceptance Criteria

1. WHEN a project is created THEN the Web_Project_System SHALL initialize it with six phases: Kick-off, Technical Planning, Development, Internal Testing, UAT, and Go Live
2. WHEN a Manager attempts to move a project to the next phase THEN the Web_Project_System SHALL validate that all required deliverables for the current phase are completed
3. WHILE a project is in Technical Planning phase THEN the Web_Project_System SHALL require Database Schema and API documentation approval before proceeding
4. WHILE a project is in Development phase THEN the Web_Project_System SHALL track daily code commits and display progress metrics
5. WHILE a project is in Internal Testing phase THEN the Web_Project_System SHALL require deployment to Staging environment and bug tracking
6. IF a Manager attempts to skip a phase THEN the Web_Project_System SHALL reject the action and display the required sequence

### Requirement 3: Quản lý Tech Stack

**User Story:** As a Manager, I want to define and track the technology stack for each project, so that I can ensure consistency and proper resource allocation.

#### Acceptance Criteria

1. WHEN a project enters Kick-off phase THEN the Web_Project_System SHALL prompt for Tech Stack selection including programming language, framework, and database
2. WHEN a Manager selects a Tech Stack THEN the Web_Project_System SHALL validate compatibility between selected components
3. WHEN Tech Stack is finalized THEN the Web_Project_System SHALL lock the selection and require Manager approval for any changes
4. WHEN displaying project details THEN the Web_Project_System SHALL show the complete Tech Stack configuration with version numbers

### Requirement 4: Quản lý Môi trường (Environment Management)

**User Story:** As a Manager, I want to manage deployment environments, so that I can ensure proper separation between development, testing, and production.

#### Acceptance Criteria

1. WHEN a project is created THEN the Web_Project_System SHALL create three environment configurations: Local, Staging, and Production
2. WHEN a Developer requests deployment to Staging THEN the Web_Project_System SHALL record the deployment with timestamp, version, and deployer information
3. WHEN a deployment to Production is requested THEN the Web_Project_System SHALL require Manager approval and UAT sign-off completion
4. IF a deployment to Production is attempted without UAT approval THEN the Web_Project_System SHALL reject the request and display the missing requirements
5. WHEN displaying environment status THEN the Web_Project_System SHALL show current version, last deployment time, and deployment history

### Requirement 5: Quản lý Task theo Quy trình Web

**User Story:** As a Manager, I want to create and assign tasks following web development workflow, so that I can track Frontend and Backend work separately.

#### Acceptance Criteria

1. WHEN a Manager creates a task THEN the Web_Project_System SHALL require categorization as Frontend, Backend, Design, DevOps, or QA
2. WHEN a task is assigned THEN the Web_Project_System SHALL validate that the assignee has the appropriate role for the task category
3. WHEN a Developer completes a task THEN the Web_Project_System SHALL require code commit reference before marking as complete
4. WHILE a task is in Review status THEN the Web_Project_System SHALL notify the Manager and display review checklist
5. WHEN displaying task board THEN the Web_Project_System SHALL group tasks by category and show dependency relationships

### Requirement 6: Quản lý Design Review

**User Story:** As a Manager, I want to enforce design approval before development starts, so that I can prevent costly rework due to design changes.

#### Acceptance Criteria

1. WHEN Design Assets are uploaded THEN the Web_Project_System SHALL create a Design Review task with approval workflow
2. WHEN a Manager approves a design THEN the Web_Project_System SHALL lock the design version and timestamp the approval
3. IF a design change is requested after approval THEN the Web_Project_System SHALL create a Change Request with impact assessment
4. WHEN displaying project timeline THEN the Web_Project_System SHALL highlight design approval as a mandatory milestone before Development phase
5. WHILE design is pending approval THEN the Web_Project_System SHALL prevent creation of Frontend development tasks

### Requirement 7: Quản lý Testing và QA

**User Story:** As a Manager, I want to track testing activities and bug reports, so that I can ensure quality before deployment.

#### Acceptance Criteria

1. WHEN a project enters Internal Testing phase THEN the Web_Project_System SHALL create a test checklist including UI verification, function testing, and performance testing
2. WHEN a Tester reports a bug THEN the Web_Project_System SHALL require severity level, reproduction steps, and affected environment
3. WHEN all critical bugs are resolved THEN the Web_Project_System SHALL allow transition to UAT phase
4. IF critical bugs exist THEN the Web_Project_System SHALL block Production deployment and display bug summary
5. WHEN displaying test results THEN the Web_Project_System SHALL show pass/fail statistics and bug trend charts

### Requirement 8: Quản lý UAT và Sign-off

**User Story:** As a Manager, I want to manage User Acceptance Testing and client sign-off, so that I can document formal approval before go-live.

#### Acceptance Criteria

1. WHEN a project enters UAT phase THEN the Web_Project_System SHALL generate a Staging URL for client review
2. WHEN a client provides feedback THEN the Web_Project_System SHALL create feedback items linked to specific features or pages
3. WHEN all feedback items are addressed THEN the Web_Project_System SHALL enable the Sign-off request function
4. WHEN a client signs off THEN the Web_Project_System SHALL record the approval with timestamp, approver name, and digital signature
5. WHEN Sign-off is complete THEN the Web_Project_System SHALL unlock the Go Live phase and notify the deployment team

### Requirement 9: Quản lý Go Live và Bàn giao

**User Story:** As a Manager, I want to manage the go-live process and handover documentation, so that I can ensure smooth transition to production.

#### Acceptance Criteria

1. WHEN a project enters Go Live phase THEN the Web_Project_System SHALL display a deployment checklist including SSL setup, domain configuration, and backup verification
2. WHEN Production deployment is completed THEN the Web_Project_System SHALL record the go-live timestamp and generate a deployment report
3. WHEN generating handover documentation THEN the Web_Project_System SHALL compile source code location, admin credentials, and user guide into a single package
4. WHEN project is marked as Completed THEN the Web_Project_System SHALL start the warranty period timer and display support contact information
5. WHEN displaying completed project THEN the Web_Project_System SHALL show full project timeline, resource usage, and final deliverables

### Requirement 10: Serialization và Data Export

**User Story:** As a Manager, I want to export project data in various formats, so that I can share reports with stakeholders and maintain records.

#### Acceptance Criteria

1. WHEN a Manager requests project export THEN the Web_Project_System SHALL generate a JSON representation of all project data
2. WHEN exporting to JSON THEN the Web_Project_System SHALL include all phases, tasks, resources, and timeline data
3. WHEN importing from JSON THEN the Web_Project_System SHALL validate the data structure and restore the project state
4. WHEN a Manager requests a report THEN the Web_Project_System SHALL generate PDF format with project summary, timeline, and metrics
5. WHEN displaying export options THEN the Web_Project_System SHALL offer JSON, PDF, and CSV formats with customizable content selection
