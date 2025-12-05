# Implementation Plan

- [x] 1. Tạo API Client Service




  - [ ] 1.1 Tạo file client/src/services/api.ts
    - Định nghĩa API_BASE_URL
    - Implement fetchAPI function với error handling


    - Export các helper functions
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Tạo Custom Hooks

  - [x] 2.1 Tạo useUsers hook

    - Tạo file client/src/hooks/useUsers.ts
    - Implement fetch từ /api/users
    - Return {data, loading, error, refetch}
    - _Requirements: 2.1, 2.6, 2.7_
  
  - [x] 2.2 Tạo useDepartments hook


    - Tạo file client/src/hooks/useDepartments.ts
    - Implement fetch từ /api/departments
    - _Requirements: 2.2, 2.6, 2.7_
  
  - [x] 2.3 Tạo useProjects hook


    - Tạo file client/src/hooks/useProjects.ts
    - Implement fetch từ /api/projects
    - _Requirements: 2.3, 2.6, 2.7_
  
  - [x] 2.4 Tạo useMeetingRooms hook


    - Tạo file client/src/hooks/useMeetingRooms.ts
    - Implement fetch từ /api/meeting-rooms
    - _Requirements: 2.4, 2.6, 2.7_
  
  - [x] 2.5 Tạo useBookings hook


    - Tạo file client/src/hooks/useBookings.ts
    - Implement fetch từ /api/bookings
    - _Requirements: 2.5, 2.6, 2.7_
  
  - [x] 2.6 Tạo hooks index file


    - Tạo file client/src/hooks/index.ts
    - Export tất cả hooks
    - _Requirements: 2.1-2.5_

- [-] 3. Tạo Loading và Error Components

  - [x] 3.1 Tạo LoadingSpinner component

    - Tạo file client/src/components/ui/LoadingSpinner.tsx
    - _Requirements: 4.1_
  

  - [ ] 3.2 Tạo ErrorMessage component
    - Tạo file client/src/components/ui/ErrorMessage.tsx
    - Bao gồm retry button
    - _Requirements: 4.2_
  
  - [x] 3.3 Tạo EmptyState component

    - Tạo file client/src/components/ui/EmptyState.tsx
    - _Requirements: 4.3_

- [x] 4. Migrate Organization Components





  - [x] 4.1 Migrate UserManager component

    - Thay MOCK_USERS bằng useUsers hook
    - Thêm loading và error states
    - _Requirements: 3.1, 4.1, 4.2_
  
  - [x] 4.2 Migrate DepartmentManager component




    - Thay MOCK_DEPARTMENTS, MOCK_USERS, MOCK_PROJECTS bằng hooks
    - Thêm loading và error states
    - _Requirements: 3.2, 4.1, 4.2_
  
  - [x] 4.3 Migrate OrgChart component


    - Thay MOCK_DEPARTMENTS bằng useDepartments hook
    - Thêm loading và error states
    - _Requirements: 3.3, 4.1, 4.2_

- [x] 5. Migrate Projects Components





  - [x] 5.1 Migrate ProjectModule component


    - Thay MOCK_PROJECTS bằng useProjects hook
    - Thêm loading và error states
    - _Requirements: 3.4, 4.1, 4.2_
  
  - [x] 5.2 Tạo useProjectTasks hook


    - Fetch tasks và columns cho một project
    - _Requirements: 2.3_
  
  - [x] 5.3 Migrate ProjectDetailView component


    - Thay MOCK_TASKS, MOCK_TASK_COLUMNS, MOCK_USERS bằng hooks
    - _Requirements: 3.4_
  

  - [x] 5.4 Migrate CreateTaskModal component

    - Thay MOCK_USERS bằng useUsers hook
    - _Requirements: 3.6_

- [x] 6. Migrate Workspace Components






  - [x] 6.1 Migrate MeetingAdmin component

    - Thay MOCK_MEETING_ROOMS, MOCK_BOOKINGS, MOCK_USERS bằng hooks
    - Thêm loading và error states
    - _Requirements: 3.5, 4.1, 4.2_

- [ ] 7. Cleanup
  - [ ] 7.1 Xóa mock data file
    - Xóa client/src/data/mockData.ts
    - Xóa thư mục client/src/data nếu trống
    - _Requirements: 5.1_
  
  - [ ] 7.2 Verify no mock imports
    - Kiểm tra không còn import từ mockData
    - _Requirements: 5.2_

- [ ] 8. Final Checkpoint
  - Ensure all components work with real API data
  - Test loading và error states
