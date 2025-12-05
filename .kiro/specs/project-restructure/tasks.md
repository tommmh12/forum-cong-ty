# Implementation Plan

- [x] 1. Thiết lập cấu trúc monorepo cơ bản





  - [x] 1.1 Tạo cấu trúc thư mục client/server/shared

    - Tạo các thư mục gốc: `client/`, `server/`, `shared/`
    - Tạo các subdirectories cần thiết
    - _Requirements: 1.1, 1.4_


  - [ ] 1.2 Cấu hình root package.json với workspaces
    - Thiết lập npm/yarn workspaces


    - Định nghĩa scripts chung (dev, build, test)
    - _Requirements: 1.1_
  - [ ] 1.3 Tạo tsconfig.base.json với path aliases
    - Cấu hình `@shared/*`, `@client/*`, `@server/*` aliases
    - Thiết lập shared compiler options
    - _Requirements: 5.4_

- [x] 2. Di chuyển và tổ chức Shared Types




  - [x] 2.1 Tách types.ts thành các file theo domain


    - Tạo `shared/types/user.types.ts` (User, UserRole, AuthState)
    - Tạo `shared/types/project.types.ts` (Project, Task, TaskColumn)
    - Tạo `shared/types/organization.types.ts` (Department, EmployeeProfile)
    - Tạo `shared/types/workspace.types.ts` (MeetingRoom, Booking)
    - Tạo `shared/types/index.ts` để re-export
    - _Requirements: 5.1_
  - [x] 2.2 Tạo shared constants


    - Tạo `shared/constants/roles.ts`
    - Tạo `shared/constants/status.ts`
    - _Requirements: 5.3_
  - [ ]* 2.3 Write property test cho shared code placement
    - **Property 6: Shared Code Placement**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 3. Thiết lập Client Structure





  - [x] 3.1 Tạo cấu trúc client với Vite


    - Di chuyển `vite.config.ts`, `index.html` vào `client/`
    - Cập nhật paths trong vite config
    - Tạo `client/src/` structure
    - _Requirements: 1.2_
  - [x] 3.2 Di chuyển shared UI components


    - Di chuyển `components/ui/Button.tsx` → `client/src/components/ui/`
    - Di chuyển `components/ui/Input.tsx` → `client/src/components/ui/`
    - Tạo `client/src/components/ui/index.ts`
    - _Requirements: 2.3_
  - [x] 3.3 Tạo cấu trúc features modules


    - Tạo `client/src/features/auth/`
    - Tạo `client/src/features/dashboard/`
    - Tạo `client/src/features/projects/`
    - Tạo `client/src/features/organization/`
    - Tạo `client/src/features/workspace/`
    - _Requirements: 2.1_

- [x] 4. Di chuyển Auth Feature




  - [x] 4.1 Tổ chức auth components


    - Di chuyển `LoginForm.tsx` → `client/src/features/auth/components/`
    - Di chuyển `LoginScreen.tsx` → `client/src/features/auth/components/`
    - Tạo `client/src/features/auth/index.ts`
    - _Requirements: 2.2_

  - [x] 4.2 Tạo auth hooks và context

    - Tạo `client/src/features/auth/hooks/useAuth.ts`
    - Tạo `client/src/features/auth/context/AuthContext.tsx`
    - _Requirements: 2.4_

- [x] 5. Di chuyển Dashboard Feature với Role-based Structure





  - [x] 5.1 Tạo dashboard admin components


    - Di chuyển `dashboard/Overview.tsx` → `client/src/features/dashboard/admin/`
    - Di chuyển `dashboard/ResourceManagement.tsx` → `client/src/features/dashboard/admin/`
    - _Requirements: 3.1_
  - [x] 5.2 Tạo dashboard shared components


    - Di chuyển `Dashboard.tsx` → `client/src/features/dashboard/shared/`
    - Tạo `client/src/features/dashboard/index.ts`
    - _Requirements: 3.2_
  - [ ]* 5.3 Write property test cho role-based organization
    - **Property 3: Role-Based Component Organization**
    - **Validates: Requirements 3.1, 3.2**

- [x] 6. Di chuyển Projects Feature với Role-based Structure






  - [x] 6.1 Tạo projects shared components


    - Di chuyển `KanbanBoard.tsx` → `client/src/features/projects/shared/`
    - Di chuyển `ProjectDetailView.tsx` → `client/src/features/projects/shared/`
    - Di chuyển `ProjectModule.tsx` → `client/src/features/projects/shared/`
    - Di chuyển `CreateTaskModal.tsx` → `client/src/features/projects/shared/`
    - _Requirements: 3.2_
  - [x] 6.2 Tạo projects admin components


    - Di chuyển `TaskSettings.tsx` → `client/src/features/projects/admin/`
    - Di chuyển `WorkflowDesigner.tsx` → `client/src/features/projects/admin/`
    - _Requirements: 3.1_

  - [x] 6.3 Tạo projects index và exports

    - Tạo `client/src/features/projects/index.ts`
    - _Requirements: 2.2_

- [x] 7. Di chuyển Organization Feature





  - [x] 7.1 Tạo organization admin components


    - Di chuyển `DepartmentManager.tsx` → `client/src/features/organization/admin/`
    - Di chuyển `UserManager.tsx` → `client/src/features/organization/admin/`
    - _Requirements: 3.1_
  - [x] 7.2 Tạo organization shared components


    - Di chuyển `OrgChart.tsx` → `client/src/features/organization/shared/`
    - Tạo `client/src/features/organization/index.ts`
    - _Requirements: 3.2_

- [x] 8. Di chuyển Workspace Feature





  - [x] 8.1 Tạo workspace admin components

    - Di chuyển `MeetingAdmin.tsx` → `client/src/features/workspace/admin/`
    - _Requirements: 3.1_

  - [x] 8.2 Tạo workspace shared components

    - Di chuyển `RoomModal.tsx` → `client/src/features/workspace/shared/`
    - Tạo `client/src/features/workspace/index.ts`
    - _Requirements: 3.2_

- [x] 9. Thiết lập Route Guards





  - [x] 9.1 Tạo RoleGuard component

    - Tạo `client/src/routes/guards/RoleGuard.tsx`
    - Implement logic kiểm tra role
    - _Requirements: 3.3, 3.4_
  - [x] 9.2 Tạo route configuration


    - Tạo `client/src/routes/index.ts`
    - Định nghĩa protected routes với role requirements
    - _Requirements: 3.3_
  - [ ]* 9.3 Write property test cho route guard
    - **Property 4: Route Guard Access Control**
    - **Validates: Requirements 3.3, 3.4**

- [x] 10. Cập nhật App.tsx và Entry Point





  - [x] 10.1 Di chuyển và cập nhật App.tsx

    - Di chuyển `App.tsx` → `client/src/App.tsx`
    - Cập nhật imports để sử dụng path aliases
    - Integrate với AuthContext
    - _Requirements: 1.2_

  - [x] 10.2 Cập nhật entry point

    - Di chuyển `index.tsx` → `client/src/main.tsx`
    - Cập nhật `index.html` reference
    - _Requirements: 1.2_

- [x] 11. Checkpoint - Đảm bảo Client hoạt động




  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Thiết lập Server Structure





  - [x] 12.1 Khởi tạo server package

    - Tạo `server/package.json` với Express dependencies
    - Tạo `server/tsconfig.json`
    - _Requirements: 1.3_

  - [x] 12.2 Tạo cấu trúc layers
    - Tạo `server/src/routes/`
    - Tạo `server/src/controllers/`
    - Tạo `server/src/services/`
    - Tạo `server/src/repositories/`
    - Tạo `server/src/models/`
    - Tạo `server/src/middleware/`
    - Tạo `server/src/config/`
    - _Requirements: 4.1_

  - [x] 12.3 Tạo Express app setup

    - Tạo `server/src/app.ts`
    - Cấu hình middleware cơ bản
    - _Requirements: 4.1_

- [x] 13. Implement Server Middleware





  - [x] 13.1 Tạo auth middleware

    - Tạo `server/src/middleware/auth.middleware.ts`
    - _Requirements: 4.3_


  - [x] 13.2 Tạo role middleware




    - Tạo `server/src/middleware/role.middleware.ts`
    - _Requirements: 4.3_
  - [ ]* 13.3 Write property test cho server layer architecture
    - **Property 5: Server Layer Architecture**
    - **Validates: Requirements 4.2**

- [x] 14. Di chuyển Mock Data và tạo Server Config

  - [x] 14.1 Di chuyển mock data
    - Di chuyển `data/mockData.ts` → `server/src/data/mockData.ts`
    - _Requirements: 1.3_

  - [x] 14.2 Tạo server config


    - Tạo `server/src/config/env.ts`
    - Tạo `server/src/config/database.ts`
    - _Requirements: 4.4_

- [x] 15. Dọn dẹp và Finalize





  - [x] 15.1 Xóa các file cũ ở root

    - Xóa `components/` directory cũ
    - Xóa `data/` directory cũ
    - Xóa `types.ts` cũ
    - Cập nhật `.gitignore`
    - _Requirements: 1.1_
  - [x] 15.2 Cập nhật root package.json


    - Thêm workspace scripts
    - Cập nhật dependencies
    - _Requirements: 1.1_
  - [ ]* 15.3 Write property test cho client/server separation
    - **Property 1: Client/Server Code Separation**
    - **Validates: Requirements 1.2, 1.3**

- [x] 16. Final Checkpoint - Đảm bảo toàn bộ hệ thống hoạt động




  - Ensure all tests pass, ask the user if questions arise.
