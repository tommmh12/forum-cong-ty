# Requirements Document

## Introduction

Tài liệu này mô tả yêu cầu tái cấu trúc dự án "Nexus - Cổng thông tin nội bộ" từ cấu trúc đơn giản sang kiến trúc chuyên nghiệp với phân chia rõ ràng giữa client/server và phân quyền theo vai trò (Admin, Manager, Employee).

## Glossary

- **Client**: Phần frontend của ứng dụng, chứa giao diện người dùng React
- **Server**: Phần backend của ứng dụng, xử lý logic nghiệp vụ và API
- **Admin**: Vai trò quản trị viên hệ thống với quyền cao nhất
- **Manager**: Vai trò quản lý với quyền quản lý nhân viên và dự án
- **Employee**: Vai trò nhân viên với quyền cơ bản
- **Module**: Đơn vị chức năng độc lập trong ứng dụng
- **Feature-based Structure**: Cấu trúc thư mục theo tính năng thay vì theo loại file

## Requirements

### Requirement 1: Phân chia Client/Server

**User Story:** As a developer, I want to have a clear separation between client and server code, so that I can maintain and scale each part independently.

#### Acceptance Criteria

1. WHEN the project is initialized THEN the System SHALL organize code into two main directories: `client` for frontend and `server` for backend
2. WHEN a developer works on frontend code THEN the System SHALL contain all React components, hooks, and UI utilities within the `client` directory
3. WHEN a developer works on backend code THEN the System SHALL contain all API routes, services, and database logic within the `server` directory
4. WHEN shared types are needed THEN the System SHALL provide a `shared` directory accessible by both client and server

### Requirement 2: Cấu trúc Client theo Feature-based

**User Story:** As a frontend developer, I want the client code organized by features, so that I can easily locate and modify related components.

#### Acceptance Criteria

1. WHEN organizing client code THEN the System SHALL group components by feature modules (auth, dashboard, projects, organization, workspace)
2. WHEN a feature module is created THEN the System SHALL contain its own components, hooks, types, and utilities within that module directory
3. WHEN shared UI components are needed THEN the System SHALL provide a `components/ui` directory for reusable components
4. WHEN global state management is needed THEN the System SHALL provide a `store` or `context` directory at the client root level

### Requirement 3: Phân quyền theo Role trong Client

**User Story:** As a frontend developer, I want role-based component organization, so that I can easily manage different views for Admin, Manager, and Employee.

#### Acceptance Criteria

1. WHEN a feature has role-specific views THEN the System SHALL organize components into `admin`, `manager`, and `employee` subdirectories within that feature
2. WHEN a component is shared across roles THEN the System SHALL place the component in a `shared` subdirectory within the feature
3. WHEN role-based routing is needed THEN the System SHALL provide route guards that check user role before rendering components
4. WHEN a user accesses a restricted route THEN the System SHALL redirect the user to an appropriate fallback page

### Requirement 4: Cấu trúc Server theo Layer Architecture

**User Story:** As a backend developer, I want the server code organized by layers, so that I can maintain separation of concerns.

#### Acceptance Criteria

1. WHEN organizing server code THEN the System SHALL separate code into layers: routes, controllers, services, repositories, and models
2. WHEN an API endpoint is created THEN the System SHALL define the route in `routes`, handle request in `controllers`, process logic in `services`, and access data in `repositories`
3. WHEN middleware is needed THEN the System SHALL provide a `middleware` directory for authentication, authorization, and validation logic
4. WHEN configuration is needed THEN the System SHALL provide a `config` directory for environment and application settings

### Requirement 5: Shared Types và Utilities

**User Story:** As a developer, I want shared types and utilities accessible by both client and server, so that I can maintain consistency across the application.

#### Acceptance Criteria

1. WHEN defining data models THEN the System SHALL place TypeScript interfaces in the `shared/types` directory
2. WHEN utility functions are needed by both client and server THEN the System SHALL place them in the `shared/utils` directory
3. WHEN constants are shared THEN the System SHALL place them in the `shared/constants` directory
4. WHEN importing shared code THEN the System SHALL support path aliases for clean imports (e.g., `@shared/types`)
