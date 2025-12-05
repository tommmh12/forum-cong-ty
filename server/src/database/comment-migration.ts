import { getPool, initializeDatabase, closePool } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Migration script to add missing columns to comments table
 * Adds: parent_id, is_deleted, updated_at
 */
export async function addCommentColumns(): Promise<void> {
  const pool = getPool();

  try {
    logger.info('🔄 Starting comment table migration...');

    // Check and add parent_id column
    const [parentIdColumns] = await pool.execute<any[]>(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'comments' 
       AND COLUMN_NAME = 'parent_id'`
    ) as any;

    if (Array.isArray(parentIdColumns) && parentIdColumns.length === 0) {
      logger.info('  ➕ Adding parent_id column...');
      await pool.execute(`
        ALTER TABLE comments 
        ADD COLUMN parent_id VARCHAR(36) NULL
      `);
      
      // Add foreign key constraint after adding the column
      try {
        await pool.execute(`
          ALTER TABLE comments 
          ADD CONSTRAINT fk_comment_parent 
          FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
        `);
        logger.info('  ✅ parent_id foreign key constraint added');
      } catch (error: any) {
        // Foreign key might already exist, that's okay
        if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_CONSTRAINT_NAME') {
          logger.info('  ℹ️  parent_id foreign key constraint already exists');
        } else {
          throw error;
        }
      }
      logger.info('  ✅ parent_id column added');
    } else {
      logger.info('  ℹ️  parent_id column already exists');
    }

    // Check and add is_deleted column
    const [isDeletedColumns] = await pool.execute<any[]>(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'comments' 
       AND COLUMN_NAME = 'is_deleted'`
    ) as any;

    if (Array.isArray(isDeletedColumns) && isDeletedColumns.length === 0) {
      logger.info('  ➕ Adding is_deleted column...');
      await pool.execute(`
        ALTER TABLE comments 
        ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE
      `);
      logger.info('  ✅ is_deleted column added');
    } else {
      logger.info('  ℹ️  is_deleted column already exists');
    }

    // Check and add updated_at column
    const [updatedAtColumns] = await pool.execute<any[]>(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'comments' 
       AND COLUMN_NAME = 'updated_at'`
    ) as any;

    if (Array.isArray(updatedAtColumns) && updatedAtColumns.length === 0) {
      logger.info('  ➕ Adding updated_at column...');
      await pool.execute(`
        ALTER TABLE comments 
        ADD COLUMN updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      `);
      logger.info('  ✅ updated_at column added');
    } else {
      logger.info('  ℹ️  updated_at column already exists');
    }

    logger.info('✅ Comment migration completed successfully');
  } catch (error) {
    logger.error('❌ Error running comment migration:', error);
    throw error;
  }
}

/**
 * Run the migration
 */
async function runCommentMigration(): Promise<void> {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Run migration
    await addCommentColumns();
    console.log('✅ Comment migration completed');
  } catch (error) {
    console.error('❌ Comment migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run migration when this file is executed directly
runCommentMigration();
