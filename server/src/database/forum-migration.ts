import { getPool, initializeDatabase, closePool } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Migration script to create forum tables
 * Creates: forum_spaces, forum_space_members, forum_posts, forum_votes, forum_comments
 * Adds: karma_points column to users table
 */
export async function createForumTables(): Promise<void> {
  const pool = getPool();

  try {
    logger.info('🔄 Starting forum tables migration...');

    // 0. Update users table collation to match forum tables (fix collation mismatch)
    logger.info('  🔧 Updating users table collation...');
    try {
      await pool.execute(`
        ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);
      logger.info('  ✅ users table collation updated');
    } catch (error: any) {
      // Table might already have correct collation or other issue
      logger.info('  ℹ️  users table collation update skipped or already correct');
    }

    // 1. Create forum_spaces table (without foreign key first)
    logger.info('  ➕ Creating forum_spaces table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS forum_spaces (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(255),
        type ENUM('PUBLIC', 'PRIVATE') DEFAULT 'PUBLIC',
        creator_id VARCHAR(36),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_forum_spaces_creator (creator_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('  ✅ forum_spaces table created');

    // 2. Create forum_space_members table (without foreign keys first)
    logger.info('  ➕ Creating forum_space_members table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS forum_space_members (
        user_id VARCHAR(36) NOT NULL,
        space_id VARCHAR(36) NOT NULL,
        role ENUM('ADMIN', 'MEMBER') DEFAULT 'MEMBER',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, space_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('  ✅ forum_space_members table created');

    // 3. Create forum_posts table (without foreign keys first)
    logger.info('  ➕ Creating forum_posts table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS forum_posts (
        id VARCHAR(36) PRIMARY KEY,
        space_id VARCHAR(36) NOT NULL,
        author_id VARCHAR(36),
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        tags JSON,
        vote_score INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_forum_posts_space (space_id),
        INDEX idx_forum_posts_author (author_id),
        INDEX idx_forum_posts_created (created_at),
        INDEX idx_forum_posts_vote_score (vote_score)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('  ✅ forum_posts table created');

    // 4. Create forum_votes table (without foreign key first)
    logger.info('  ➕ Creating forum_votes table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS forum_votes (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        target_id VARCHAR(36) NOT NULL,
        target_type VARCHAR(20) NOT NULL,
        vote_type TINYINT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_forum_votes_target (target_id),
        INDEX idx_forum_votes_target_type (target_type),
        INDEX idx_forum_votes_user (user_id),
        UNIQUE INDEX idx_forum_votes_unique (user_id, target_id, target_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('  ✅ forum_votes table created');

    // 5. Create forum_comments table (without foreign keys first)
    logger.info('  ➕ Creating forum_comments table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS forum_comments (
        id VARCHAR(36) PRIMARY KEY,
        post_id VARCHAR(36) NOT NULL,
        author_id VARCHAR(36),
        content TEXT NOT NULL,
        parent_id VARCHAR(36) NULL,
        vote_score INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_forum_comments_post (post_id),
        INDEX idx_forum_comments_author (author_id),
        INDEX idx_forum_comments_parent (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('  ✅ forum_comments table created');

    // Now add foreign keys
    logger.info('  ➕ Adding foreign key constraints...');

    // Add foreign keys for forum_spaces
    try {
      await pool.execute(`
        ALTER TABLE forum_spaces
        ADD CONSTRAINT fk_forum_spaces_creator
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (error: any) {
      if (error.code !== 'ER_DUP_KEYNAME' && error.code !== 'ER_DUP_CONSTRAINT_NAME' && error.code !== 'ER_FK_INCOMPATIBLE_COLUMNS') {
        logger.warn('  ⚠️  Could not add fk_forum_spaces_creator:', error.message);
      }
    }

    // Add foreign keys for forum_space_members
    try {
      await pool.execute(`
        ALTER TABLE forum_space_members
        ADD CONSTRAINT fk_forum_space_members_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    } catch (error: any) {
      if (error.code !== 'ER_DUP_KEYNAME' && error.code !== 'ER_DUP_CONSTRAINT_NAME' && error.code !== 'ER_FK_INCOMPATIBLE_COLUMNS') {
        logger.warn('  ⚠️  Could not add fk_forum_space_members_user:', error.message);
      }
    }
    try {
      await pool.execute(`
        ALTER TABLE forum_space_members
        ADD CONSTRAINT fk_forum_space_members_space
        FOREIGN KEY (space_id) REFERENCES forum_spaces(id) ON DELETE CASCADE
      `);
    } catch (error: any) {
      if (error.code !== 'ER_DUP_KEYNAME' && error.code !== 'ER_DUP_CONSTRAINT_NAME') {
        logger.warn('  ⚠️  Could not add fk_forum_space_members_space:', error.message);
      }
    }

    // Add foreign keys for forum_posts
    try {
      await pool.execute(`
        ALTER TABLE forum_posts
        ADD CONSTRAINT fk_forum_posts_space
        FOREIGN KEY (space_id) REFERENCES forum_spaces(id) ON DELETE CASCADE
      `);
    } catch (error: any) {
      if (error.code !== 'ER_DUP_KEYNAME' && error.code !== 'ER_DUP_CONSTRAINT_NAME') {
        logger.warn('  ⚠️  Could not add fk_forum_posts_space:', error.message);
      }
    }
    try {
      await pool.execute(`
        ALTER TABLE forum_posts
        ADD CONSTRAINT fk_forum_posts_author
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (error: any) {
      if (error.code !== 'ER_DUP_KEYNAME' && error.code !== 'ER_DUP_CONSTRAINT_NAME' && error.code !== 'ER_FK_INCOMPATIBLE_COLUMNS') {
        logger.warn('  ⚠️  Could not add fk_forum_posts_author:', error.message);
      }
    }

    // Add foreign key for forum_votes
    try {
      await pool.execute(`
        ALTER TABLE forum_votes
        ADD CONSTRAINT fk_forum_votes_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    } catch (error: any) {
      if (error.code !== 'ER_DUP_KEYNAME' && error.code !== 'ER_DUP_CONSTRAINT_NAME' && error.code !== 'ER_FK_INCOMPATIBLE_COLUMNS') {
        logger.warn('  ⚠️  Could not add fk_forum_votes_user:', error.message);
      }
    }

    // Add foreign keys for forum_comments
    try {
      await pool.execute(`
        ALTER TABLE forum_comments
        ADD CONSTRAINT fk_forum_comments_post
        FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE
      `);
    } catch (error: any) {
      if (error.code !== 'ER_DUP_KEYNAME' && error.code !== 'ER_DUP_CONSTRAINT_NAME') {
        logger.warn('  ⚠️  Could not add fk_forum_comments_post:', error.message);
      }
    }
    try {
      await pool.execute(`
        ALTER TABLE forum_comments
        ADD CONSTRAINT fk_forum_comments_author
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (error: any) {
      if (error.code !== 'ER_DUP_KEYNAME' && error.code !== 'ER_DUP_CONSTRAINT_NAME' && error.code !== 'ER_FK_INCOMPATIBLE_COLUMNS') {
        logger.warn('  ⚠️  Could not add fk_forum_comments_author:', error.message);
      }
    }
    try {
      await pool.execute(`
        ALTER TABLE forum_comments
        ADD CONSTRAINT fk_forum_comments_parent
        FOREIGN KEY (parent_id) REFERENCES forum_comments(id) ON DELETE CASCADE
      `);
    } catch (error: any) {
      if (error.code !== 'ER_DUP_KEYNAME' && error.code !== 'ER_DUP_CONSTRAINT_NAME') {
        logger.warn('  ⚠️  Could not add fk_forum_comments_parent:', error.message);
      }
    }

    logger.info('  ✅ Foreign key constraints added (some may have been skipped)');

    // 6. Add karma_points column to users table
    logger.info('  ➕ Adding karma_points column to users table...');
    try {
      await pool.execute(`
        ALTER TABLE users 
        ADD COLUMN karma_points INT DEFAULT 0
      `);
      logger.info('  ✅ karma_points column added');
    } catch (error: any) {
      // Column might already exist, that's okay
      if (error.code === 'ER_DUP_FIELDNAME') {
        logger.info('  ℹ️  karma_points column already exists');
      } else {
        throw error;
      }
    }

    logger.info('✅ Forum migration completed successfully');
  } catch (error) {
    logger.error('❌ Error running forum migration:', error);
    throw error;
  }
}

/**
 * Run the migration
 */
async function runForumMigration(): Promise<void> {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Run migration
    await createForumTables();
    console.log('✅ Forum migration completed');
  } catch (error) {
    console.error('❌ Forum migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run migration when this file is executed directly
runForumMigration();
