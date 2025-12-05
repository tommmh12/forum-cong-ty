import { getPool } from '../config/database';

/**
 * Migration to add category and commit_reference columns to tasks table
 * for Web Project Management feature
 */
export async function addTaskCategoryColumns(): Promise<void> {
  const pool = getPool();
  
  try {
    // Check if category column exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'tasks' 
      AND COLUMN_NAME = 'category'
    `) as any[];
    
    if (columns.length === 0) {
      // Add category column
      await pool.execute(`
        ALTER TABLE tasks 
        ADD COLUMN category ENUM('FRONTEND', 'BACKEND', 'DESIGN', 'DEVOPS', 'QA') DEFAULT NULL
      `);
      console.log('  - Added category column to tasks table');
    }
    
    // Check if commit_reference column exists
    const [commitCols] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'tasks' 
      AND COLUMN_NAME = 'commit_reference'
    `) as any[];
    
    if (commitCols.length === 0) {
      // Add commit_reference column
      await pool.execute(`
        ALTER TABLE tasks 
        ADD COLUMN commit_reference VARCHAR(255) DEFAULT NULL
      `);
      console.log('  - Added commit_reference column to tasks table');
    }
    
    console.log('✅ Task category migration completed');
  } catch (error) {
    console.error('Error running task category migration:', error);
    throw error;
  }
}

/**
 * Create task_dependencies table for tracking task dependencies
 */
export async function createTaskDependenciesTable(): Promise<void> {
  const pool = getPool();
  
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS task_dependencies (
      id VARCHAR(36) PRIMARY KEY,
      task_id VARCHAR(36) NOT NULL,
      depends_on_task_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      UNIQUE KEY unique_dependency (task_id, depends_on_task_id)
    )
  `);
  console.log('  - task_dependencies table created');
}

export default {
  addTaskCategoryColumns,
  createTaskDependenciesTable,
};
