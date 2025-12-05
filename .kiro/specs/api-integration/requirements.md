# Requirements Document

## Introduction

Tài liệu này mô tả yêu cầu chuyển đổi hệ thống Nexus từ việc sử dụng mock data sang sử dụng dữ liệu thật từ API backend. Mục tiêu là loại bỏ hoàn toàn việc import trực tiếp mock data trong client và thay thế bằng việc gọi API để lấy dữ liệu từ database.

## Glossary

- **API Client**: Module xử lý việc gọi HTTP requests đến backend server
- **React Hook**: Custom hook để fetch và quản lý state của dữ liệu từ API
- **Loading State**: Trạng thái hiển thị khi đang chờ dữ liệu từ API
- **Error State**: Trạng thái hiển thị khi có lỗi xảy ra khi gọi API
- **Mock Data**: Dữ liệu giả lập được hardcode trong client

## Requirements

### Requirement 1: API Client Service

**User Story:** As a developer, I want a centralized API client service, so that I can make consistent HTTP requests to the backend.

#### Acceptance Criteria

1. WHEN the application needs to call an API THEN the System SHALL provide a centralized API client with base URL configuration
2. WHEN making API requests THEN the System SHALL handle JSON serialization and deserialization automatically
3. WHEN an API request fails THEN the System SHALL throw an error with meaningful error message
4. WHEN the API returns an error status THEN the System SHALL parse and return the error response

### Requirement 2: Data Fetching Hooks

**User Story:** As a developer, I want React hooks for fetching data, so that I can easily integrate API data into components.

#### Acceptance Criteria

1. WHEN a component needs user data THEN the System SHALL provide a useUsers hook that fetches from /api/users
2. WHEN a component needs department data THEN the System SHALL provide a useDepartments hook that fetches from /api/departments
3. WHEN a component needs project data THEN the System SHALL provide a useProjects hook that fetches from /api/projects
4. WHEN a component needs meeting room data THEN the System SHALL provide a useMeetingRooms hook that fetches from /api/meeting-rooms
5. WHEN a component needs booking data THEN the System SHALL provide a useBookings hook that fetches from /api/bookings
6. WHEN data is being fetched THEN the System SHALL provide loading state to the component
7. WHEN data fetching fails THEN the System SHALL provide error state to the component

### Requirement 3: Component Migration

**User Story:** As a user, I want to see real data from the database, so that I can work with actual information.

#### Acceptance Criteria

1. WHEN UserManager component renders THEN the System SHALL fetch users from API instead of mock data
2. WHEN DepartmentManager component renders THEN the System SHALL fetch departments from API instead of mock data
3. WHEN OrgChart component renders THEN the System SHALL fetch departments from API instead of mock data
4. WHEN ProjectModule component renders THEN the System SHALL fetch projects from API instead of mock data
5. WHEN MeetingAdmin component renders THEN the System SHALL fetch meeting rooms and bookings from API instead of mock data
6. WHEN CreateTaskModal component renders THEN the System SHALL fetch users from API for assignee selection

### Requirement 4: Loading and Error States

**User Story:** As a user, I want to see loading indicators and error messages, so that I know the status of data fetching.

#### Acceptance Criteria

1. WHEN data is being loaded THEN the System SHALL display a loading spinner or skeleton
2. WHEN data loading fails THEN the System SHALL display an error message with retry option
3. WHEN data is empty THEN the System SHALL display an appropriate empty state message

### Requirement 5: Remove Mock Data Dependencies

**User Story:** As a developer, I want to remove mock data imports from client, so that the codebase is clean and uses only real data.

#### Acceptance Criteria

1. WHEN all components are migrated THEN the System SHALL remove client/src/data/mockData.ts file
2. WHEN all components are migrated THEN the System SHALL have no imports from mockData in any client component
