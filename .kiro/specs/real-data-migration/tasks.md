# Implementation Plan

- [ ] 1. Audit và Chuẩn bị

- [ ] 1.1 Audit mock data usage
  - Tìm tất cả các file import mock data trong client và server
  - Liệt kê các components/hooks đang sử dụng mock data
  - Xác định các hooks cần tạo mới hoặc cập nhật
  - _Requirements: 1.1, 1.2_

- [ ] 1.2 Verify database schema
  - Kiểm tra tất cả các bảng cần thiết đã tồn tại
  - Verify foreign key relationships
  - Đảm bảo seed data script hoạt động
  - _Requirements: 9.1, 9.3_

- [ ] 2. Projects Module Migration

- [ ] 2.1 Create/Update useProjects hook
  - Tạo file `client/src/hooks/useProjects.ts` nếu chưa có
  - Implement fetchProjects từ GET /api/projects
  - Implement createProject, updateProject, deleteProject
  - Xóa tất cả imports từ mockData
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 2.2 Write property test cho Project CRUD Round Trip
  - **Property 1: Project CRUD Round Trip**
  - **Validates: Requirements 2.2, 2.3**

- [ ] 2.3 Update ProjectModule component
  - Cập nhật `client/src/features/projects/shared/ProjectModule.tsx`
  - Sử dụng useProjects hook thay vì mock data
  - Implement loading và error states
  - _Requirements: 2.1, 2.5_

- [ ] 3. Tasks Module Migration

- [ ] 3.1 Create/Update useProjectTasks hook
  - Tạo file `client/src/hooks/useProjectTasks.ts` nếu chưa có
  - Implement fetchTasks từ GET /api/projects/:id/tasks
  - Implement createTask, updateTask, deleteTask, moveTask
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3.2 Write property test cho Task CRUD Round Trip
  - **Property 2: Task CRUD Round Trip**
  - **Validates: Requirements 3.2, 3.4_

- [ ] 3.3 Write property test cho Task Move Persistence
  - **Property 3: Task Move Persistence**
  - **Validates: Requirements 3.3_

- [ ] 3.4 Update KanbanBoard component
  - Cập nhật `client/src/features/projects/shared/KanbanBoard.tsx`
  - Sử dụng useProjectTasks hook
  - Verify task data includes assignee, tags, checklist, comments
  - _Requirements: 3.1, 3.5_

- [ ] 4. Task Columns Module Migration

- [ ] 4.1 Create/Update useTaskColumns hook
  - Tạo file `client/src/hooks/useTaskColumns.ts` nếu chưa có
  - Implement fetchColumns từ GET /api/projects/:id/columns
  - Implement createColumn, updateColumn, deleteColumn
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4.2 Write property test cho Default Columns Initialization
  - **Property 4: Default Columns Initialization**
  - **Validates: Requirements 4.5_

- [ ] 4.3 Write property test cho Column CRUD Round Trip
  - **Property 5: Column CRUD Round Trip**
  - **Validates: Requirements 4.2, 4.3, 4.4_

## 5. Checkpoint - Đảm bảo Projects/Tasks hoạt động

- [ ] 5. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Employees Module Migration

- [ ] 6.1 Update useEmployees hook
  - Cập nhật `client/src/features/employees/hooks/useEmployees.ts`
  - Verify fetchEmployees từ GET /api/employees
  - Verify employee data includes department name và linked accounts
  - Xóa tất cả imports từ mockData
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 6.2 Write property test cho Employee Data Completeness
  - **Property 6: Employee Data Completeness**
  - **Validates: Requirements 5.2, 5.5_

- [ ] 6.3 Update Employee components
  - Verify `client/src/features/employees/` components sử dụng hook
  - Implement loading và error states
  - _Requirements: 5.1, 5.3, 5.4_

- [ ] 7. Departments Module Migration

- [ ] 7.1 Update useDepartments hook
  - Cập nhật `client/src/hooks/useDepartments.ts`
  - Verify fetchDepartments từ GET /api/departments
  - Implement createDepartment, updateDepartment, deleteDepartment
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 7.2 Write property test cho Department Hierarchy Integrity
  - **Property 7: Department Hierarchy Integrity**
  - **Validates: Requirements 6.5_

- [ ] 7.3 Update OrgChart component
  - Cập nhật `client/src/features/organization/shared/OrgChart.tsx`
  - Sử dụng useDepartments hook
  - Build hierarchy từ parent_dept_id
  - _Requirements: 6.5_

- [ ] 8. Meeting Rooms và Bookings Module Migration

- [x] 8.1 Create useMeetingRooms hook




  - Tạo file `client/src/hooks/useMeetingRooms.ts`
  - Implement fetchRooms từ GET /api/meeting-rooms
  - Implement fetchRoomById từ GET /api/meeting-rooms/:id
  - _Requirements: 7.1, 7.2_

- [x] 8.2 Add CRUD operations to useBookings hook




  - Cập nhật `client/src/hooks/useBookings.ts`
  - Implement createBooking từ POST /api/bookings
  - Implement updateBooking từ PUT /api/bookings/:id
  - Implement fetchRoomBookings từ GET /api/meeting-rooms/:id/bookings
  - _Requirements: 7.3, 7.5_
- [x] 8.3 Write property test cho Booking Conflict Prevention



- [ ] 8.3 Write property test cho Booking Conflict Prevention

  - **Property 8: Booking Conflict Prevention**
  - **Validates: Requirements 7.4_

- [x] 8.4 Update Meeting Room components





  - Cập nhật các components trong workspace/meeting rooms
  - Sử dụng useMeetingRooms và useBookings hooks với CRUD
  - _Requirements: 7.1, 7.4_

## 9. Checkpoint - Đảm bảo tất cả modules hoạt động

- [ ] 9. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
- [x] 9.5 Checkpoint




- [ ] 9.5 Checkpoint

  - Ensure all tests pass, ask the user if questions arise.
- [-] 10. Database Seed Data

- [x] 10.1.1 Database Seed Data





- [x] 10.1 Update seed script






  - Cập nhật `server/src/database/seed.ts`
  - Đảm bảo seed data cho: departments, users, projects, tasks, columns, meeting_rooms, bookings
  - Implement idempotent seeding (check before insert)
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 10.2 Write property test cho Seed Data Idempotence




  - **Property 9: Seed Data Idempotence**
  - **Validates: Requirements 9.4_
-

- [x] 10.3 Write property test cho Referential Integrity




  - **Property 10: Referential Integrity**
  - **Validates: Requirements 9.3_

- [ ] 11. Error Handling và Cleanup

- [x] 11.1 Implement consistent error handling in hooks





  - Đảm bảo tất cả hooks có error state
  - Implement retry logic nếu cần
  - Display user-friendly error messages
  - _Requirements: 10.5_

- [x] 11.2 Write property test cho Hook Error Handling





  - **Property 11: Hook Error Handling**
  - **Validates: Requirements 10.5_

- [x] 11.3 Write property test cho Delete Cascade





  - **Property 12: Delete Cascade**
  - **Validates: Requirements 2.4_

- [ ] 12. Remove Mock Data Files

- [-] 12.1 Remove client mock data



  - Xóa file `client/src/data/mockData.ts`
  - Verify không còn imports từ file này
  - _Requirements: 1.2, 1.3_

- [ ] 12.2 Remove server mock data

  - Xóa file `server/src/data/mockData.ts`
  - Verify không còn imports từ file này
  - _Requirements: 1.2, 1.3_

- [ ] 12.3 Final verification

  - Grep toàn bộ codebase cho "mockData" imports
  - Verify tất cả components hoạt động với real data
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 13. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
- [ ] 13.1 Final Checkpoint

  - Ensure all tests pass, ask the user if questions arise.