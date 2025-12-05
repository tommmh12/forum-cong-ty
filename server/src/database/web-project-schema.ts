import { getPool } from '../config/database';

/**
 * Web Project Management Schema
 * Các bảng mới cho module quản lý dự án web
 */

/**
 * Drop all web project tables (for clean setup)
 */
export async function dropWebProjectTables(): Promise<void> {
  const pool = getPool();
  
  // Disable foreign key checks
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  
  const tables = [
    'project_signoffs',
    'uat_feedback',
    'bug_reports',
    'design_reviews',
    'deployment_history',
    'project_environments',
    'project_tech_stack',
    'project_phases',
    'project_resources',
    'workflows',
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
  
  console.log('✅ All web project tables dropped');
}

/**
 * Create web project management tables
 */
export async function createWebProjectTables(): Promise<void> {
  const pool = getPool();

  // Project Resources table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS project_resources (
      id VARCHAR(36) PRIMARY KEY,
      project_id VARCHAR(36) NOT NULL,
      type ENUM('SITEMAP', 'SRS', 'WIREFRAME', 'MOCKUP', 'FIGMA_LINK', 'ASSET', 'CREDENTIAL') NOT NULL,
      name VARCHAR(255) NOT NULL,
      file_path TEXT,
      url TEXT,
      version INT DEFAULT 1,
      status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
      approved_by VARCHAR(36),
      approved_at TIMESTAMP NULL,
      encrypted_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('  - project_resources table created');

  // Project Phases table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS project_phases (
      id VARCHAR(36) PRIMARY KEY,
      project_id VARCHAR(36) NOT NULL,
      phase_type ENUM('KICKOFF', 'TECHNICAL_PLANNING', 'DEVELOPMENT', 'INTERNAL_TESTING', 'UAT', 'GO_LIVE') NOT NULL,
      position INT NOT NULL,
      status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED') DEFAULT 'PENDING',
      started_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      blocked_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  console.log('  - project_phases table created');

  // Project Tech Stack table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS project_tech_stack (
      id VARCHAR(36) PRIMARY KEY,
      project_id VARCHAR(36) NOT NULL,
      category ENUM('LANGUAGE', 'FRAMEWORK', 'DATABASE', 'HOSTING', 'OTHER') NOT NULL,
      name VARCHAR(100) NOT NULL,
      version VARCHAR(50),
      is_locked BOOLEAN DEFAULT FALSE,
      locked_at TIMESTAMP NULL,
      locked_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('  - project_tech_stack table created');

  // Project Environments table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS project_environments (
      id VARCHAR(36) PRIMARY KEY,
      project_id VARCHAR(36) NOT NULL,
      env_type ENUM('LOCAL', 'STAGING', 'PRODUCTION') NOT NULL,
      url TEXT,
      current_version VARCHAR(50),
      last_deployed_at TIMESTAMP NULL,
      last_deployed_by VARCHAR(36),
      ssl_enabled BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (last_deployed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('  - project_environments table created');

  // Deployment History table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS deployment_history (
      id VARCHAR(36) PRIMARY KEY,
      environment_id VARCHAR(36) NOT NULL,
      version VARCHAR(50) NOT NULL,
      deployed_by VARCHAR(36) NOT NULL,
      deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      commit_hash VARCHAR(100),
      notes TEXT,
      status ENUM('SUCCESS', 'FAILED', 'ROLLBACK') DEFAULT 'SUCCESS',
      FOREIGN KEY (environment_id) REFERENCES project_environments(id) ON DELETE CASCADE,
      FOREIGN KEY (deployed_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('  - deployment_history table created');

  // Design Reviews table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS design_reviews (
      id VARCHAR(36) PRIMARY KEY,
      project_id VARCHAR(36) NOT NULL,
      resource_id VARCHAR(36) NOT NULL,
      status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CHANGE_REQUESTED') DEFAULT 'PENDING',
      reviewer_id VARCHAR(36),
      reviewed_at TIMESTAMP NULL,
      comments TEXT,
      version_locked INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (resource_id) REFERENCES project_resources(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('  - design_reviews table created');

  // Bug Reports table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS bug_reports (
      id VARCHAR(36) PRIMARY KEY,
      project_id VARCHAR(36) NOT NULL,
      task_id VARCHAR(36),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
      status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'WONT_FIX') DEFAULT 'OPEN',
      environment ENUM('LOCAL', 'STAGING', 'PRODUCTION') NOT NULL,
      reproduction_steps TEXT NOT NULL,
      reported_by VARCHAR(36) NOT NULL,
      assigned_to VARCHAR(36),
      resolved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
      FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('  - bug_reports table created');

  // UAT Feedback table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS uat_feedback (
      id VARCHAR(36) PRIMARY KEY,
      project_id VARCHAR(36) NOT NULL,
      feature_name VARCHAR(255),
      page_url TEXT,
      feedback_text TEXT NOT NULL,
      status ENUM('PENDING', 'ADDRESSED', 'REJECTED') DEFAULT 'PENDING',
      provided_by VARCHAR(255) NOT NULL,
      addressed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  console.log('  - uat_feedback table created');

  // Project Signoffs table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS project_signoffs (
      id VARCHAR(36) PRIMARY KEY,
      project_id VARCHAR(36) NOT NULL,
      signoff_type ENUM('DESIGN', 'UAT', 'GO_LIVE') NOT NULL,
      approver_name VARCHAR(255) NOT NULL,
      approver_email VARCHAR(255),
      signature_data TEXT,
      signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  console.log('  - project_signoffs table created');

  // Workflows table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS workflows (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      steps TEXT NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('  - workflows table created');

  // Add workflow_id column to projects table if it doesn't exist
  try {
    await pool.execute(`
      ALTER TABLE projects 
      ADD COLUMN workflow_id VARCHAR(36),
      ADD FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL
    `);
    console.log('  - Added workflow_id column to projects table');
  } catch (error: any) {
    // Column might already exist, ignore error
    if (!error.message?.includes('Duplicate column name')) {
      console.warn('  - Could not add workflow_id column:', error.message);
    }
  }

  console.log('✅ All web project tables created successfully');
}

/**
 * Initialize phases for a new project
 */
export async function initializeProjectPhases(projectId: string): Promise<void> {
  const pool = getPool();
  const { v4: uuidv4 } = await import('uuid');
  
  const phases = [
    { type: 'KICKOFF', position: 0 },
    { type: 'TECHNICAL_PLANNING', position: 1 },
    { type: 'DEVELOPMENT', position: 2 },
    { type: 'INTERNAL_TESTING', position: 3 },
    { type: 'UAT', position: 4 },
    { type: 'GO_LIVE', position: 5 },
  ];

  for (const phase of phases) {
    await pool.execute(
      `INSERT INTO project_phases (id, project_id, phase_type, position, status) VALUES (?, ?, ?, ?, 'PENDING')`,
      [uuidv4(), projectId, phase.type, phase.position]
    );
  }
}

/**
 * Initialize environments for a new project
 */
export async function initializeProjectEnvironments(projectId: string): Promise<void> {
  const pool = getPool();
  const { v4: uuidv4 } = await import('uuid');
  
  const environments = ['LOCAL', 'STAGING', 'PRODUCTION'];

  for (const envType of environments) {
    await pool.execute(
      `INSERT INTO project_environments (id, project_id, env_type) VALUES (?, ?, ?)`,
      [uuidv4(), projectId, envType]
    );
  }
}

export default { 
  createWebProjectTables, 
  dropWebProjectTables,
  initializeProjectPhases,
  initializeProjectEnvironments
};
