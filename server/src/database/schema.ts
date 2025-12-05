import { getPool } from '../config/database';
import { createWebProjectTables, dropWebProjectTables } from './web-project-schema';

/**
 * Drop all tables (for clean setup)
 */
export async function dropAllTables(): Promise<void> {
  const pool = getPool();
  
  // Drop web project tables first (they have foreign keys to base tables)
  await dropWebProjectTables();
  
  // Disable foreign key checks
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  
  const tables = [
    'booking_participants',
    'bookings',
    'room_amenities',
    'meeting_rooms',
    'project_files',
    'comment_mentions',
    'comments',
    'checklist_items',
    'task_tags',
    'task_dependencies',
    'tasks',
    'task_columns',
    'project_members',
    'projects',
    'departments',
    'linked_accounts',
    'users',
  ];
  
  for (const table of tables) {
    try {
      await pool.execute(`DROP TABLE IF EXISTS ${table}`);
    } catch (error) {
      // Ignore errors
    }
  }
  
  // Re-enable foreign key checks
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
  
  console.log('✅ All tables dropped');
}

/**
 * Create all tables
 */
export async function createTables(): Promise<void> {
  const pool = getPool();
  
  // Users table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      avatar_url TEXT,
      position VARCHAR(255),
      department VARCHAR(255),
      role ENUM('Admin', 'Manager', 'Employee') DEFAULT 'Employee',
      status ENUM('Active', 'Blocked') DEFAULT 'Active',
      employee_status ENUM('Active', 'On Leave', 'Terminated') DEFAULT 'Active',
      account_status ENUM('Pending', 'Active') DEFAULT 'Pending',
      is_first_login BOOLEAN DEFAULT TRUE,
      phone VARCHAR(50),
      join_date DATE,
      employee_id VARCHAR(50) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('  - users table created');


  // Linked accounts table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS linked_accounts (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      provider VARCHAR(50) NOT NULL,
      provider_email VARCHAR(255),
      connected BOOLEAN DEFAULT FALSE,
      last_synced VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('  - linked_accounts table created');

  // Departments table (without foreign key first)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS departments (
      id VARCHAR(36) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      manager_name VARCHAR(255),
      manager_avatar TEXT,
      member_count INT DEFAULT 0,
      description TEXT,
      budget VARCHAR(100),
      kpi_status VARCHAR(50),
      parent_dept_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('  - departments table created');

  // Projects table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(36) PRIMARY KEY,
      project_key VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      manager_id VARCHAR(36),
      progress INT DEFAULT 0,
      status ENUM('PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD') DEFAULT 'PLANNING',
      start_date VARCHAR(50),
      end_date VARCHAR(50),
      budget VARCHAR(100),
      description TEXT,
      workflow_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('  - projects table created');

  // Project members table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS project_members (
      project_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      role ENUM('MANAGER', 'LEADER', 'MEMBER', 'VIEWER') DEFAULT 'MEMBER',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('  - project_members table created');

  // Task columns table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS task_columns (
      id VARCHAR(36) PRIMARY KEY,
      project_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      position INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  console.log('  - task_columns table created');

  // Tasks table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(36) PRIMARY KEY,
      code VARCHAR(50) NOT NULL,
      project_id VARCHAR(36) NOT NULL,
      column_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      type ENUM('FEATURE', 'BUG', 'IMPROVEMENT', 'RESEARCH') DEFAULT 'FEATURE',
      priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
      assignee_id VARCHAR(36),
      reporter_id VARCHAR(36),
      due_date DATE,
      description TEXT,
      position INT DEFAULT 0,
      attachments INT DEFAULT 0,
      category ENUM('FRONTEND', 'BACKEND', 'DESIGN', 'DEVOPS', 'QA') DEFAULT NULL,
      commit_reference VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (column_id) REFERENCES task_columns(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('  - tasks table created');


  // Task tags table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS task_tags (
      id VARCHAR(36) PRIMARY KEY,
      task_id VARCHAR(36) NOT NULL,
      tag VARCHAR(100) NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
  console.log('  - task_tags table created');

  // Checklist items table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id VARCHAR(36) PRIMARY KEY,
      task_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      is_completed BOOLEAN DEFAULT FALSE,
      position INT DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
  console.log('  - checklist_items table created');

  // Comments table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(36) PRIMARY KEY,
      task_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      text TEXT NOT NULL,
      parent_id VARCHAR(36) NULL,
      is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    )
  `);
  console.log('  - comments table created');

  // Comment mentions table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS comment_mentions (
      id VARCHAR(36) PRIMARY KEY,
      comment_id VARCHAR(36) NOT NULL,
      mentioned_user_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_mention (comment_id, mentioned_user_id)
    )
  `);
  console.log('  - comment_mentions table created');

  // Meeting rooms table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS meeting_rooms (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      capacity INT DEFAULT 10,
      type ENUM('PHYSICAL', 'VIRTUAL') DEFAULT 'PHYSICAL',
      location VARCHAR(255),
      status ENUM('AVAILABLE', 'BOOKED', 'MAINTENANCE') DEFAULT 'AVAILABLE',
      image TEXT,
      meeting_url TEXT,
      platform VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('  - meeting_rooms table created');

  // Room amenities table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS room_amenities (
      id VARCHAR(36) PRIMARY KEY,
      room_id VARCHAR(36) NOT NULL,
      amenity VARCHAR(100) NOT NULL,
      FOREIGN KEY (room_id) REFERENCES meeting_rooms(id) ON DELETE CASCADE
    )
  `);
  console.log('  - room_amenities table created');

  // Bookings table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(36) PRIMARY KEY,
      room_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      organizer_id VARCHAR(36) NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status ENUM('PENDING', 'CONFIRMED', 'CANCELLED') DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES meeting_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('  - bookings table created');

  // Booking participants table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS booking_participants (
      id VARCHAR(36) PRIMARY KEY,
      booking_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('  - booking_participants table created');

  // Project files table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS project_files (
      id VARCHAR(36) PRIMARY KEY,
      project_id VARCHAR(36),
      name VARCHAR(255) NOT NULL,
      size VARCHAR(50),
      type VARCHAR(50),
      uploader VARCHAR(255),
      upload_date DATE,
      file_path TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  console.log('  - project_files table created');

  // Task dependencies table (for web project)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS task_dependencies (
      id VARCHAR(36) PRIMARY KEY,
      task_id VARCHAR(36) NOT NULL,
      depends_on_task_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
  console.log('  - task_dependencies table created');

  console.log('✅ Base tables created successfully');

  // Create web project management tables
  console.log('\n📋 Creating web project tables...');
  await createWebProjectTables();
}

export default { createTables, dropAllTables };
