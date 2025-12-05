# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cho việc chuyển đổi toàn bộ hệ thống từ mock data sang dữ liệu thật từ database. Mục tiêu là loại bỏ hoàn toàn các file mock data và đảm bảo tất cả các module (Projects, Tasks, Employees, Departments, Meeting Rooms, Bookings) đều lấy dữ liệu từ MySQL database thông qua API.

## Glossary

- **Real_Data_System**: Hệ thống sử dụng dữ liệu thật từ database
- **Mock_Data**: Dữ liệu giả lập được hardcode trong file TypeScript
- **Repository**: Layer truy cập database, thực hiện các SQL queries
- **API_Route**: Endpoint HTTP xử lý request từ Frontend
- **Hook**: React custom hook để fetch và quản lý state dữ liệu
- **Database**: MySQL database chứa dữ liệu thật
- **Seed_Data**: Dữ liệu khởi tạo ban đầu cho database

## Requirements

### Requirement 1: Loại bỏ Mock Data Files

**User Story:** As a Developer, I want to remove all mock data files, so that the system only uses real data from the database.

#### Acceptance Criteria

1. WHEN the system starts THEN the Real_Data_System SHALL load all data from MySQL database instead of mock files
2. WHEN a Developer searches for mock data imports THEN the Real_Data_System SHALL return zero results in production code
3. WHEN the mock data files are removed THEN the Real_Data_System SHALL continue functioning normally with database data
4. IF any component still references mock data THEN the Real_Data_System SHALL display a clear error indicating the missing data source

### Requirement 2: Projects Module - Real Data Integration

**User Story:** As a Manager, I want to view and manage projects from the database, so that I can work with real project data.

#### Acceptance Criteria

1. WHEN a User accesses the Projects page THEN the Real_Data_System SHALL fetch projects from GET /api/projects endpoint
2. WHEN a User creates a new project THEN the Real_Data_System SHALL persist it to the database via POST /api/projects
3. WHEN a User updates a project THEN the Real_Data_System SHALL update the database record via PUT /api/projects/:id
4. WHEN a User deletes a project THEN the Real_Data_System SHALL remove it from the database via DELETE /api/projects/:id
5. WHEN displaying project list THEN the Real_Data_System SHALL show data from the projects table with manager information joined from users table

### Requirement 3: Tasks Module - Real Data Integration

**User Story:** As a Developer, I want to manage tasks from the database, so that task changes are persisted and shared across users.

#### Acceptance Criteria

1. WHEN a User views a project's Kanban board THEN the Real_Data_System SHALL fetch tasks from GET /api/projects/:id/tasks
2. WHEN a User creates a new task THEN the Real_Data_System SHALL persist it via POST /api/projects/:id/tasks with auto-generated task code
3. WHEN a User moves a task between columns THEN the Real_Data_System SHALL update via PUT /api/projects/:id/tasks/:taskId/move
4. WHEN a User updates task details THEN the Real_Data_System SHALL persist changes via PUT /api/projects/:id/tasks/:taskId
5. WHEN displaying tasks THEN the Real_Data_System SHALL include assignee information, tags, checklist items, and comments from related tables

### Requirement 4: Task Columns Module - Real Data Integration

**User Story:** As a Manager, I want to customize task columns from the database, so that column configurations are persisted.

#### Acceptance Criteria

1. WHEN a User views a project THEN the Real_Data_System SHALL fetch columns from GET /api/projects/:id/columns
2. WHEN a User creates a new column THEN the Real_Data_System SHALL persist it via POST /api/projects/:id/columns
3. WHEN a User renames a column THEN the Real_Data_System SHALL update via PUT /api/projects/:id/columns/:columnId
4. WHEN a User deletes a column THEN the Real_Data_System SHALL remove it via DELETE /api/projects/:id/columns/:columnId
5. WHEN a new project is created THEN the Real_Data_System SHALL initialize default columns (Backlog, To Do, In Progress, Review, Done)

### Requirement 5: Employees Module - Real Data Integration

**User Story:** As an HR Manager, I want to manage employees from the database, so that employee records are centralized and accurate.

#### Acceptance Criteria

1. WHEN a User accesses the Employees page THEN the Real_Data_System SHALL fetch employees from GET /api/employees endpoint
2. WHEN a User views employee details THEN the Real_Data_System SHALL fetch from GET /api/employees/:id with linked accounts
3. WHEN a User creates a new employee THEN the Real_Data_System SHALL persist via POST /api/employees
4. WHEN a User updates employee information THEN the Real_Data_System SHALL update via PUT /api/employees/:id
5. WHEN displaying employees THEN the Real_Data_System SHALL include department name from the departments table

### Requirement 6: Departments Module - Real Data Integration

**User Story:** As an Admin, I want to manage departments from the database, so that organizational structure is accurately maintained.

#### Acceptance Criteria

1. WHEN a User accesses the Organization page THEN the Real_Data_System SHALL fetch departments from GET /api/departments
2. WHEN a User creates a new department THEN the Real_Data_System SHALL persist via POST /api/departments
3. WHEN a User updates a department THEN the Real_Data_System SHALL update via PUT /api/departments/:id
4. WHEN a User deletes a department THEN the Real_Data_System SHALL remove via DELETE /api/departments/:id
5. WHEN displaying org chart THEN the Real_Data_System SHALL build hierarchy using parent_dept_id relationships

### Requirement 7: Meeting Rooms Module - Real Data Integration

**User Story:** As an Employee, I want to view and book meeting rooms from the database, so that room availability is accurate and bookings are persisted.

#### Acceptance Criteria

1. WHEN a User accesses the Meeting Rooms page THEN the Real_Data_System SHALL fetch rooms from GET /api/meeting-rooms
2. WHEN a User views room details THEN the Real_Data_System SHALL fetch from GET /api/meeting-rooms/:id
3. WHEN a User creates a booking THEN the Real_Data_System SHALL persist via POST /api/bookings
4. WHEN displaying room availability THEN the Real_Data_System SHALL check against existing bookings in the database
5. WHEN a User cancels a booking THEN the Real_Data_System SHALL update booking status via PUT /api/bookings/:id

### Requirement 8: Users/Auth Module - Real Data Integration

**User Story:** As a User, I want to authenticate and view my profile from the database, so that my account information is secure and persistent.

#### Acceptance Criteria

1. WHEN a User logs in THEN the Real_Data_System SHALL validate credentials against the users table
2. WHEN a User views their profile THEN the Real_Data_System SHALL fetch from GET /api/users/:id
3. WHEN a User updates their profile THEN the Real_Data_System SHALL persist via PUT /api/users/:id
4. WHEN displaying user information in tasks/projects THEN the Real_Data_System SHALL fetch from users table with proper joins

### Requirement 9: Database Seed Data

**User Story:** As a Developer, I want initial seed data in the database, so that the system has sample data for testing and demonstration.

#### Acceptance Criteria

1. WHEN the database is initialized THEN the Real_Data_System SHALL run seed scripts to populate initial data
2. WHEN seeding data THEN the Real_Data_System SHALL create sample departments, users, projects, tasks, and meeting rooms
3. WHEN seed data is created THEN the Real_Data_System SHALL maintain referential integrity between related tables
4. IF seed data already exists THEN the Real_Data_System SHALL skip seeding to prevent duplicates

### Requirement 10: Client Hooks Migration

**User Story:** As a Developer, I want all React hooks to fetch from API, so that the frontend consistently uses real data.

#### Acceptance Criteria

1. WHEN useProjects hook is called THEN the Real_Data_System SHALL fetch from /api/projects endpoint
2. WHEN useEmployees hook is called THEN the Real_Data_System SHALL fetch from /api/employees endpoint
3. WHEN useDepartments hook is called THEN the Real_Data_System SHALL fetch from /api/departments endpoint
4. WHEN useMeetingRooms hook is called THEN the Real_Data_System SHALL fetch from /api/meeting-rooms endpoint
5. WHEN any hook encounters an error THEN the Real_Data_System SHALL display appropriate error message to user

