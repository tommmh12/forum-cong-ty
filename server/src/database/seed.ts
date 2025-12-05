import { getPool } from '../config/database';
import bcrypt from 'bcryptjs';
import { createWebProjectTables, initializeProjectPhases, initializeProjectEnvironments } from './web-project-schema';

// Default password for all seeded users: "123456"
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('123456', 10);

/**
 * Helper function to check if a record exists
 */
async function recordExists(table: string, id: string): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM ${table} WHERE id = ?`,
    [id]
  ) as any;
  return rows[0].count > 0;
}

/**
 * Helper function to check if a record exists by email
 */
async function userExistsByEmail(email: string): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT COUNT(*) as count FROM users WHERE email = ?',
    [email]
  ) as any;
  return rows[0].count > 0;
}

/**
 * Seed users data
 */
async function seedUsers(): Promise<void> {
  const pool = getPool();
  
  const users = [
    {
      id: 'admin',
      full_name: 'System Administrator',
      email: 'admin@nexus.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100',
      position: 'System Administrator',
      department: 'Ban Giám Đốc (Board of Directors)',
      role: 'Admin',
      status: 'Active',
      employee_status: 'Active',
      phone: '0900000000',
      join_date: '2020-01-01',
      employee_id: 'NEX-ADMIN',
    },
    {
      id: 'u001',
      full_name: 'Nguyễn Thị Hoa',
      email: 'hoa.nt@nexus.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100&h=100',
      position: 'Trưởng phòng Marketing',
      department: 'Khối Marketing & Truyền thông',
      role: 'Manager',
      status: 'Active',
      employee_status: 'Active',
      phone: '0987654321',
      join_date: '2021-05-15',
      employee_id: 'NEX-001',
    },
    {
      id: 'u002',
      full_name: 'Trần Văn Nam',
      email: 'nam.tv@nexus.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100',
      position: 'Senior Developer',
      department: 'Software Development',
      role: 'Employee',
      status: 'Active',
      employee_status: 'Active',
      phone: '0912345678',
      join_date: '2023-01-10',
      employee_id: 'NEX-002',
    },
    {
      id: 'u003',
      full_name: 'Lê Hoàng',
      email: 'hoang.le@nexus.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100',
      position: 'Sales Executive',
      department: 'Khối Kinh Doanh (Sales)',
      role: 'Employee',
      status: 'Blocked',
      employee_status: 'On Leave',
      phone: '0909090909',
      join_date: '2023-11-20',
      employee_id: 'NEX-003',
    },
    {
      id: 'u004',
      full_name: 'Lê Văn B',
      email: 'le.b@nexus.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100&h=100',
      position: 'UI Designer',
      department: 'Khối Marketing & Truyền thông',
      role: 'Employee',
      status: 'Active',
      employee_status: 'Active',
      phone: '0911223344',
      join_date: '2023-06-01',
      employee_id: 'NEX-004',
    },
  ];


  let seededCount = 0;
  let skippedCount = 0;
  
  for (const user of users) {
    // Check if user already exists by ID or email
    const exists = await recordExists('users', user.id) || await userExistsByEmail(user.email);
    
    if (!exists) {
      await pool.execute(
        `INSERT INTO users (id, full_name, email, password_hash, avatar_url, position, department, role, status, employee_status, account_status, is_first_login, phone, join_date, employee_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', FALSE, ?, ?, ?)`,
        [user.id, user.full_name, user.email, user.password_hash, user.avatar_url, user.position, user.department, user.role, user.status, user.employee_status, user.phone, user.join_date, user.employee_id]
      );
      seededCount++;
    } else {
      skippedCount++;
    }
  }
  
  // Seed linked accounts
  const linkedAccounts = [
    { id: 'la001', user_id: 'u001', provider: 'google', provider_email: 'hoa.nt@gmail.com', connected: true, last_synced: '2 giờ trước' },
    { id: 'la002', user_id: 'u001', provider: 'slack', provider_email: 'hoa.nt@nexus.slack.com', connected: true },
    { id: 'la003', user_id: 'u002', provider: 'github', provider_email: 'trannamdev', connected: true },
    { id: 'la004', user_id: 'u002', provider: 'microsoft', provider_email: 'nam.tv@nexus.com', connected: false },
  ];
  
  for (const account of linkedAccounts) {
    const exists = await recordExists('linked_accounts', account.id);
    if (!exists) {
      await pool.execute(
        `INSERT INTO linked_accounts (id, user_id, provider, provider_email, connected, last_synced)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [account.id, account.user_id, account.provider, account.provider_email, account.connected, account.last_synced || null]
      );
    }
  }
  
  console.log(`✅ Users seeded (${seededCount} new, ${skippedCount} skipped)`);
}

/**
 * Seed departments data
 */
async function seedDepartments(): Promise<void> {
  const pool = getPool();
  
  const departments = [
    { id: 'bod', code: 'BOD', name: 'Ban Giám Đốc (Board of Directors)', manager_name: 'Nguyễn Văn An', manager_avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100', member_count: 5, description: 'Lãnh đạo và định hướng chiến lược toàn công ty.', budget: '---', kpi_status: 'On Track', parent_dept_id: null },
    { id: 'tech', code: 'TECH', name: 'Khối Công Nghệ (Technology)', manager_name: 'Trần Minh Đức', manager_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100', member_count: 45, description: 'Phát triển sản phẩm, vận hành hạ tầng và bảo mật hệ thống.', budget: '5 tỷ VNĐ', kpi_status: 'On Track', parent_dept_id: 'bod' },
    { id: 'mkt', code: 'MKT', name: 'Khối Marketing & Truyền thông', manager_name: 'Nguyễn Thị Hoa', manager_avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100&h=100', member_count: 20, description: 'Xây dựng thương hiệu và thúc đẩy tăng trưởng người dùng.', budget: '3.2 tỷ VNĐ', kpi_status: 'At Risk', parent_dept_id: 'bod' },
    { id: 'sales', code: 'SALES', name: 'Khối Kinh Doanh (Sales)', manager_name: 'Lê Hoàng', manager_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100', member_count: 35, description: 'Tìm kiếm khách hàng và tối ưu doanh thu.', budget: '2 tỷ VNĐ', kpi_status: 'Behind', parent_dept_id: 'bod' },
    { id: 'hr', code: 'HR', name: 'Khối Hành chính Nhân sự', manager_name: 'Phạm Thu Trang', manager_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100&h=100', member_count: 12, description: 'Tuyển dụng, đào tạo và quản lý văn phòng.', budget: '1.5 tỷ VNĐ', kpi_status: 'On Track', parent_dept_id: 'bod' },
    { id: 'dev', code: 'DEV', name: 'Software Development', manager_name: 'Trần Văn Nam', manager_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100', member_count: 30, description: 'Đội ngũ lập trình viên Backend, Frontend và Mobile.', budget: '---', kpi_status: 'On Track', parent_dept_id: 'tech' },
    { id: 'infra', code: 'INFRA', name: 'Infrastructure & Security', manager_name: 'Đỗ Văn Hùng', manager_avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100&h=100', member_count: 15, description: 'Quản lý Server, Network và An toàn thông tin.', budget: '---', kpi_status: 'On Track', parent_dept_id: 'tech' },
  ];
  
  let seededCount = 0;
  let skippedCount = 0;
  
  // Insert parent departments first (those without parent_dept_id)
  for (const dept of departments.filter(d => !d.parent_dept_id)) {
    const exists = await recordExists('departments', dept.id);
    if (!exists) {
      await pool.execute(
        `INSERT INTO departments (id, code, name, manager_name, manager_avatar, member_count, description, budget, kpi_status, parent_dept_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [dept.id, dept.code, dept.name, dept.manager_name, dept.manager_avatar, dept.member_count, dept.description, dept.budget, dept.kpi_status, null]
      );
      seededCount++;
    } else {
      skippedCount++;
    }
  }
  
  // Then insert child departments
  for (const dept of departments.filter(d => d.parent_dept_id)) {
    const exists = await recordExists('departments', dept.id);
    if (!exists) {
      await pool.execute(
        `INSERT INTO departments (id, code, name, manager_name, manager_avatar, member_count, description, budget, kpi_status, parent_dept_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [dept.id, dept.code, dept.name, dept.manager_name, dept.manager_avatar, dept.member_count, dept.description, dept.budget, dept.kpi_status, dept.parent_dept_id]
      );
      seededCount++;
    } else {
      skippedCount++;
    }
  }
  
  console.log(`✅ Departments seeded (${seededCount} new, ${skippedCount} skipped)`);
}


/**
 * Seed projects data
 */
async function seedProjects(): Promise<void> {
  const pool = getPool();
  
  const projects = [
    { id: '1', project_key: 'WEB', name: 'Tái thiết kế Website Nexus', manager_id: 'u001', progress: 75, status: 'ACTIVE', start_date: '01/10/2024', end_date: '15/12/2024', budget: '200,000,000 VNĐ', description: 'Nâng cấp toàn bộ giao diện website công ty, tích hợp cổng thanh toán mới và tối ưu hóa SEO.' },
    { id: '2', project_key: 'ERP', name: 'Hệ thống ERP Giai đoạn 2', manager_id: 'u002', progress: 30, status: 'ACTIVE', start_date: '01/09/2024', end_date: '01/03/2025', budget: '1,500,000,000 VNĐ', description: 'Triển khai module Kho vận và Tài chính kế toán cho hệ thống ERP nội bộ.' },
    { id: '3', project_key: 'SALES', name: 'Chiến dịch Tết 2025', manager_id: 'u003', progress: 10, status: 'PLANNING', start_date: '15/11/2024', end_date: '20/01/2025', budget: '500,000,000 VNĐ', description: 'Lên kế hoạch khuyến mãi, quà tặng và sự kiện tri ân khách hàng dịp Tết Nguyên Đán.' },
  ];
  
  let seededCount = 0;
  let skippedCount = 0;
  
  for (const project of projects) {
    const exists = await recordExists('projects', project.id);
    if (!exists) {
      await pool.execute(
        `INSERT INTO projects (id, project_key, name, manager_id, progress, status, start_date, end_date, budget, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [project.id, project.project_key, project.name, project.manager_id, project.progress, project.status, project.start_date, project.end_date, project.budget, project.description]
      );
      seededCount++;
    } else {
      skippedCount++;
    }
  }
  
  console.log(`✅ Projects seeded (${seededCount} new, ${skippedCount} skipped)`);
}

/**
 * Seed task columns data
 */
async function seedTaskColumns(): Promise<void> {
  const pool = getPool();
  
  // Default columns for all projects
  const defaultColumns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
  const projectIds = ['1', '2', '3'];
  
  let seededCount = 0;
  let skippedCount = 0;
  
  for (const projectId of projectIds) {
    // Check if columns already exist for this project
    const [existingCols] = await pool.execute(
      'SELECT COUNT(*) as count FROM task_columns WHERE project_id = ?',
      [projectId]
    ) as any;
    
    if (existingCols[0].count === 0) {
      // Create default columns for this project
      for (let i = 0; i < defaultColumns.length; i++) {
        const colId = `col${projectId}_${i + 1}`;
        await pool.execute(
          `INSERT INTO task_columns (id, project_id, name, position) VALUES (?, ?, ?, ?)`,
          [colId, projectId, defaultColumns[i], i + 1]
        );
        seededCount++;
      }
    } else {
      skippedCount += defaultColumns.length;
    }
  }
  
  console.log(`✅ Task columns seeded (${seededCount} new, ${skippedCount} skipped)`);
}

/**
 * Seed tasks data
 */
async function seedTasks(): Promise<void> {
  const pool = getPool();
  
  // First, get the actual column IDs for project 1
  const [columns] = await pool.execute(
    'SELECT id, name FROM task_columns WHERE project_id = ? ORDER BY position',
    ['1']
  ) as any;
  
  const columnMap: Record<string, string> = {};
  for (const col of columns) {
    columnMap[col.name] = col.id;
  }
  
  const tasks = [
    { id: 't1', code: 'WEB-101', project_id: '1', column_name: 'In Progress', title: 'Thiết kế Mockup trang chủ v2.0', type: 'FEATURE', priority: 'HIGH', assignee_id: 'u004', reporter_id: 'u001', due_date: '2024-11-20', description: 'Cần thiết kế lại layout trang chủ theo style guide mới. Chú ý phần Hero banner và section Testimonials.', position: 1, attachments: 2, tags: ['Design', 'UI/UX'] },
    { id: 't2', code: 'WEB-102', project_id: '1', column_name: 'Done', title: 'Viết API xác thực người dùng (Auth Service)', type: 'FEATURE', priority: 'URGENT', assignee_id: 'u002', reporter_id: 'u001', due_date: '2024-11-15', description: 'Triển khai JWT authentication và refresh token mechanism.', position: 1, attachments: 0, tags: ['Backend', 'Security'] },
    { id: 't3', code: 'WEB-103', project_id: '1', column_name: 'To Do', title: 'Họp kick-off team Marketing', type: 'IMPROVEMENT', priority: 'MEDIUM', assignee_id: 'u001', reporter_id: 'u001', due_date: '2024-11-22', description: 'Họp thống nhất kế hoạch chạy ads tháng 12.', position: 1, attachments: 1, tags: ['Meeting'] },
    { id: 't4', code: 'ERP-201', project_id: '2', column_name: 'Backlog', title: 'Phân tích yêu cầu module Kho vận', type: 'RESEARCH', priority: 'HIGH', assignee_id: 'u002', reporter_id: 'u002', due_date: '2024-12-01', description: 'Thu thập và phân tích yêu cầu chi tiết cho module quản lý kho.', position: 1, attachments: 0, tags: ['Analysis', 'ERP'] },
    { id: 't5', code: 'SALES-301', project_id: '3', column_name: 'Backlog', title: 'Lên kế hoạch khuyến mãi Tết', type: 'FEATURE', priority: 'MEDIUM', assignee_id: 'u003', reporter_id: 'u003', due_date: '2024-12-15', description: 'Xây dựng chương trình khuyến mãi và quà tặng cho dịp Tết.', position: 1, attachments: 0, tags: ['Marketing', 'Sales'] },
  ];
  
  let seededCount = 0;
  let skippedCount = 0;
  
  for (const task of tasks) {
    const exists = await recordExists('tasks', task.id);
    if (!exists) {
      // Get column ID for this task's project
      let columnId: string;
      if (task.project_id === '1') {
        columnId = columnMap[task.column_name] || columnMap['Backlog'];
      } else {
        // For other projects, get their column IDs
        const [projCols] = await pool.execute(
          'SELECT id FROM task_columns WHERE project_id = ? AND name = ?',
          [task.project_id, task.column_name]
        ) as any;
        columnId = projCols[0]?.id;
        
        // If column doesn't exist, get the first column
        if (!columnId) {
          const [firstCol] = await pool.execute(
            'SELECT id FROM task_columns WHERE project_id = ? ORDER BY position LIMIT 1',
            [task.project_id]
          ) as any;
          columnId = firstCol[0]?.id;
        }
      }
      
      if (columnId) {
        await pool.execute(
          `INSERT INTO tasks (id, code, project_id, column_id, title, type, priority, assignee_id, reporter_id, due_date, description, position, attachments)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [task.id, task.code, task.project_id, columnId, task.title, task.type, task.priority, task.assignee_id, task.reporter_id, task.due_date, task.description, task.position, task.attachments]
        );
        seededCount++;
        
        // Insert tags
        for (let i = 0; i < task.tags.length; i++) {
          const tagId = `tag_${task.id}_${i}`;
          const tagExists = await recordExists('task_tags', tagId);
          if (!tagExists) {
            await pool.execute(
              `INSERT INTO task_tags (id, task_id, tag) VALUES (?, ?, ?)`,
              [tagId, task.id, task.tags[i]]
            );
          }
        }
      }
    } else {
      skippedCount++;
    }
  }
  
  // Seed checklist items
  const checklists = [
    { id: 'cl1', task_id: 't1', title: 'Phác thảo Wireframe', is_completed: true, position: 1 },
    { id: 'cl2', task_id: 't1', title: 'Thiết kế High-fidelity', is_completed: false, position: 2 },
    { id: 'cl3', task_id: 't1', title: 'Review với Team Lead', is_completed: false, position: 3 },
    { id: 'cl4', task_id: 't2', title: 'Database Schema User', is_completed: true, position: 1 },
    { id: 'cl5', task_id: 't2', title: 'API Login/Register', is_completed: true, position: 2 },
    { id: 'cl6', task_id: 't2', title: 'Unit Test', is_completed: true, position: 3 },
  ];
  
  for (const item of checklists) {
    const exists = await recordExists('checklist_items', item.id);
    if (!exists) {
      await pool.execute(
        `INSERT INTO checklist_items (id, task_id, title, is_completed, position) VALUES (?, ?, ?, ?, ?)`,
        [item.id, item.task_id, item.title, item.is_completed, item.position]
      );
    }
  }
  
  // Seed comments
  const commentId = 'comment1';
  const commentExists = await recordExists('comments', commentId);
  if (!commentExists) {
    await pool.execute(
      `INSERT INTO comments (id, task_id, user_id, text, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [commentId, 't1', 'u001', 'Nhớ check lại màu brand nhé em, bản cũ hơi nhạt.']
    );
  }
  
  console.log(`✅ Tasks seeded (${seededCount} new, ${skippedCount} skipped)`);
}


/**
 * Seed meeting rooms data
 */
async function seedMeetingRooms(): Promise<void> {
  const pool = getPool();
  
  const rooms = [
    { id: 'r1', name: 'Phòng họp A (Galaxy)', capacity: 20, type: 'PHYSICAL', location: 'Tầng 12 - Khu A', status: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400', amenities: ['TV', 'Whiteboard', 'Video Conf'] },
    { id: 'r2', name: 'Zoom Meeting Pro 01', capacity: 100, type: 'VIRTUAL', location: 'Online', status: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=400', meeting_url: 'https://zoom.us/j/123456789', platform: 'Zoom', amenities: ['Recording', 'Transcript'] },
    { id: 'r3', name: 'Google Meet Team', capacity: 50, type: 'VIRTUAL', location: 'Online', status: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&q=80&w=400', meeting_url: 'https://meet.google.com/abc-defg-hij', platform: 'Google Meet', amenities: ['Auto-caption'] },
    { id: 'r4', name: 'Phòng họp B (Nebula)', capacity: 10, type: 'PHYSICAL', location: 'Tầng 10 - Khu B', status: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=400', amenities: ['TV', 'Whiteboard'] },
    { id: 'r5', name: 'Microsoft Teams Room', capacity: 75, type: 'VIRTUAL', location: 'Online', status: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=400', meeting_url: 'https://teams.microsoft.com/l/meetup-join/xyz', platform: 'Microsoft Teams', amenities: ['Recording', 'Whiteboard', 'Breakout Rooms'] },
  ];
  
  let seededCount = 0;
  let skippedCount = 0;
  
  for (const room of rooms) {
    const exists = await recordExists('meeting_rooms', room.id);
    if (!exists) {
      await pool.execute(
        `INSERT INTO meeting_rooms (id, name, capacity, type, location, status, image, meeting_url, platform)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [room.id, room.name, room.capacity, room.type, room.location, room.status, room.image, room.meeting_url || null, room.platform || null]
      );
      seededCount++;
      
      // Insert amenities
      for (let i = 0; i < room.amenities.length; i++) {
        const amenityId = `amenity_${room.id}_${i}`;
        const amenityExists = await recordExists('room_amenities', amenityId);
        if (!amenityExists) {
          await pool.execute(
            `INSERT INTO room_amenities (id, room_id, amenity) VALUES (?, ?, ?)`,
            [amenityId, room.id, room.amenities[i]]
          );
        }
      }
    } else {
      skippedCount++;
    }
  }
  
  console.log(`✅ Meeting rooms seeded (${seededCount} new, ${skippedCount} skipped)`);
}

/**
 * Seed bookings data
 */
async function seedBookings(): Promise<void> {
  const pool = getPool();
  
  // Use future dates for bookings to make them more realistic
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const formatDate = (date: Date, hours: number, minutes: number) => {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  };
  
  const bookings = [
    { id: 'b1', room_id: 'r1', title: 'Họp giao ban tuần', organizer_id: 'u001', start_time: formatDate(tomorrow, 9, 0), end_time: formatDate(tomorrow, 10, 30), status: 'CONFIRMED', participants: ['u001', 'u002', 'u003'] },
    { id: 'b2', room_id: 'r2', title: 'Phỏng vấn ứng viên Senior Dev', organizer_id: 'u002', start_time: formatDate(tomorrow, 14, 0), end_time: formatDate(tomorrow, 15, 0), status: 'CONFIRMED', participants: ['u002'] },
    { id: 'b3', room_id: 'r3', title: 'Demo sản phẩm với khách hàng', organizer_id: 'u003', start_time: formatDate(tomorrow, 15, 30), end_time: formatDate(tomorrow, 16, 30), status: 'CONFIRMED', participants: ['u003', 'u001'] },
    { id: 'b4', room_id: 'r1', title: 'Sprint Planning', organizer_id: 'u002', start_time: formatDate(nextWeek, 10, 0), end_time: formatDate(nextWeek, 12, 0), status: 'CONFIRMED', participants: ['u001', 'u002', 'u004'] },
    { id: 'b5', room_id: 'r4', title: 'One-on-One Meeting', organizer_id: 'u001', start_time: formatDate(nextWeek, 14, 0), end_time: formatDate(nextWeek, 14, 30), status: 'PENDING', participants: ['u001', 'u003'] },
  ];
  
  let seededCount = 0;
  let skippedCount = 0;
  
  for (const booking of bookings) {
    const exists = await recordExists('bookings', booking.id);
    if (!exists) {
      await pool.execute(
        `INSERT INTO bookings (id, room_id, title, organizer_id, start_time, end_time, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [booking.id, booking.room_id, booking.title, booking.organizer_id, booking.start_time, booking.end_time, booking.status]
      );
      seededCount++;
      
      // Insert participants
      for (let i = 0; i < booking.participants.length; i++) {
        const participantId = `bp_${booking.id}_${i}`;
        const participantExists = await recordExists('booking_participants', participantId);
        if (!participantExists) {
          await pool.execute(
            `INSERT INTO booking_participants (id, booking_id, user_id) VALUES (?, ?, ?)`,
            [participantId, booking.id, booking.participants[i]]
          );
        }
      }
    } else {
      skippedCount++;
    }
  }
  
  console.log(`✅ Bookings seeded (${seededCount} new, ${skippedCount} skipped)`);
}

/**
 * Seed project files data
 */
async function seedProjectFiles(): Promise<void> {
  const pool = getPool();
  
  const files = [
    { id: 'f1', project_id: '1', name: 'Project_Requirements_v2.pdf', size: '2.4 MB', type: 'pdf', uploader: 'Nguyễn Thị Hoa', upload_date: '2024-10-05' },
    { id: 'f2', project_id: '1', name: 'Design_System_Assets.zip', size: '156 MB', type: 'zip', uploader: 'Lê Văn B', upload_date: '2024-10-12' },
    { id: 'f3', project_id: '1', name: 'Meeting_Minutes_Kickoff.docx', size: '450 KB', type: 'doc', uploader: 'Trần Văn Nam', upload_date: '2024-10-02' },
    { id: 'f4', project_id: '1', name: 'Budget_Estimation_2024.xlsx', size: '1.2 MB', type: 'xls', uploader: 'Phạm Thu Trang', upload_date: '2024-10-08' },
    { id: 'f5', project_id: '1', name: 'Main_Banner_Draft.png', size: '5.8 MB', type: 'image', uploader: 'Lê Văn B', upload_date: '2024-10-15' },
    { id: 'f6', project_id: '2', name: 'ERP_Module_Specs.pdf', size: '3.1 MB', type: 'pdf', uploader: 'Trần Văn Nam', upload_date: '2024-09-15' },
    { id: 'f7', project_id: '2', name: 'Database_Schema_v1.sql', size: '125 KB', type: 'sql', uploader: 'Trần Văn Nam', upload_date: '2024-09-20' },
    { id: 'f8', project_id: '3', name: 'Marketing_Plan_Tet2025.pptx', size: '8.5 MB', type: 'ppt', uploader: 'Lê Hoàng', upload_date: '2024-11-01' },
  ];
  
  let seededCount = 0;
  let skippedCount = 0;
  
  for (const file of files) {
    const exists = await recordExists('project_files', file.id);
    if (!exists) {
      await pool.execute(
        `INSERT INTO project_files (id, project_id, name, size, type, uploader, upload_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [file.id, file.project_id, file.name, file.size, file.type, file.uploader, file.upload_date]
      );
      seededCount++;
    } else {
      skippedCount++;
    }
  }
  
  console.log(`✅ Project files seeded (${seededCount} new, ${skippedCount} skipped)`);
}

/**
 * Seed web project tables (phases, environments, etc.)
 */
async function seedWebProjectData(): Promise<void> {
  const pool = getPool();
  
  // Create web project tables if they don't exist
  try {
    await createWebProjectTables();
  } catch (error) {
    console.log('Web project tables may already exist, continuing...');
  }
  
  const projectIds = ['1', '2', '3'];
  let phasesSeeded = 0;
  let phasesSkipped = 0;
  let envsSeeded = 0;
  let envsSkipped = 0;
  
  for (const projectId of projectIds) {
    // Check if phases already exist for this project
    const [existingPhases] = await pool.execute(
      'SELECT COUNT(*) as count FROM project_phases WHERE project_id = ?',
      [projectId]
    ) as any;
    
    if (existingPhases[0].count === 0) {
      await initializeProjectPhases(projectId);
      phasesSeeded += 6; // 6 phases per project
    } else {
      phasesSkipped += 6;
    }
    
    // Check if environments already exist for this project
    const [existingEnvs] = await pool.execute(
      'SELECT COUNT(*) as count FROM project_environments WHERE project_id = ?',
      [projectId]
    ) as any;
    
    if (existingEnvs[0].count === 0) {
      await initializeProjectEnvironments(projectId);
      envsSeeded += 3; // 3 environments per project
    } else {
      envsSkipped += 3;
    }
  }
  
  console.log(`✅ Project phases seeded (${phasesSeeded} new, ${phasesSkipped} skipped)`);
  console.log(`✅ Project environments seeded (${envsSeeded} new, ${envsSkipped} skipped)`);
  console.log('✅ Web project data seeded');
}

/**
 * Seed project resources data
 */
async function seedProjectResources(): Promise<void> {
  const pool = getPool();
  
  const resources = [
    { id: 'res1', project_id: '1', type: 'SITEMAP', name: 'Website Sitemap v1.0', file_path: '/uploads/sitemap_v1.pdf', status: 'APPROVED', approved_by: 'u001' },
    { id: 'res2', project_id: '1', type: 'WIREFRAME', name: 'Homepage Wireframe', file_path: '/uploads/wireframe_home.fig', status: 'APPROVED', approved_by: 'u001' },
    { id: 'res3', project_id: '1', type: 'MOCKUP', name: 'Homepage Mockup Final', url: 'https://figma.com/file/abc123', status: 'APPROVED', approved_by: 'u001' },
    { id: 'res4', project_id: '2', type: 'SRS', name: 'ERP Module Requirements', file_path: '/uploads/erp_srs.pdf', status: 'PENDING' },
  ];
  
  let seededCount = 0;
  let skippedCount = 0;
  
  for (const resource of resources) {
    const exists = await recordExists('project_resources', resource.id);
    if (!exists) {
      await pool.execute(
        `INSERT INTO project_resources (id, project_id, type, name, file_path, url, status, approved_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [resource.id, resource.project_id, resource.type, resource.name, resource.file_path || null, resource.url || null, resource.status, resource.approved_by || null]
      );
      seededCount++;
    } else {
      skippedCount++;
    }
  }
  
  console.log(`✅ Project resources seeded (${seededCount} new, ${skippedCount} skipped)`);
}

/**
 * Seed project tech stack data
 */
async function seedProjectTechStack(): Promise<void> {
  const pool = getPool();
  
  const techStack = [
    { id: 'tech1', project_id: '1', category: 'LANGUAGE', name: 'TypeScript', version: '5.0' },
    { id: 'tech2', project_id: '1', category: 'FRAMEWORK', name: 'React', version: '18.2' },
    { id: 'tech3', project_id: '1', category: 'FRAMEWORK', name: 'Express.js', version: '4.18' },
    { id: 'tech4', project_id: '1', category: 'DATABASE', name: 'MySQL', version: '8.0' },
    { id: 'tech5', project_id: '1', category: 'HOSTING', name: 'AWS EC2', version: null },
    { id: 'tech6', project_id: '2', category: 'LANGUAGE', name: 'Java', version: '17' },
    { id: 'tech7', project_id: '2', category: 'FRAMEWORK', name: 'Spring Boot', version: '3.0' },
    { id: 'tech8', project_id: '2', category: 'DATABASE', name: 'PostgreSQL', version: '15' },
  ];
  
  let seededCount = 0;
  let skippedCount = 0;
  
  for (const tech of techStack) {
    const exists = await recordExists('project_tech_stack', tech.id);
    if (!exists) {
      await pool.execute(
        `INSERT INTO project_tech_stack (id, project_id, category, name, version)
         VALUES (?, ?, ?, ?, ?)`,
        [tech.id, tech.project_id, tech.category, tech.name, tech.version]
      );
      seededCount++;
    } else {
      skippedCount++;
    }
  }
  
  console.log(`✅ Project tech stack seeded (${seededCount} new, ${skippedCount} skipped)`);
}

/**
 * Run all seed functions
 */
export async function seedAll(): Promise<void> {
  console.log('🌱 Starting database seeding...');
  console.log('📋 Idempotent seeding enabled - existing records will be skipped');
  
  await seedUsers();
  await seedDepartments();
  await seedProjects();
  await seedTaskColumns();
  await seedTasks();
  await seedMeetingRooms();
  await seedBookings();
  await seedProjectFiles();
  await seedWebProjectData();
  await seedProjectResources();
  await seedProjectTechStack();
  
  console.log('🎉 Database seeding completed!');
}

/**
 * Standalone execution - run seed script directly
 */
async function main(): Promise<void> {
  const { initializeDatabase, closePool } = await import('../config/database');
  
  try {
    console.log('🚀 Initializing database connection...\n');
    await initializeDatabase();
    
    await seedAll();
    
    console.log('\n✅ Seed script completed successfully!');
  } catch (error) {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  main();
}

export default { seedAll };
