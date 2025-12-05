-- Migration: Add Forum Tables for Reddit-style Forum
-- Run this script to create forum_spaces, forum_space_members, forum_posts, forum_votes, forum_comments
-- and add karma_points to users table

-- NOTE: MySQL doesn't support IF NOT EXISTS for CREATE TABLE
-- If a table already exists, the CREATE TABLE command will fail with an error
-- That's okay - just skip that command and continue with the others

-- 1. Create forum_spaces table
CREATE TABLE IF NOT EXISTS forum_spaces (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  type ENUM('PUBLIC', 'PRIVATE') DEFAULT 'PUBLIC',
  creator_id CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_forum_spaces_creator (creator_id),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create forum_space_members table (Composite Primary Key)
CREATE TABLE IF NOT EXISTS forum_space_members (
  user_id CHAR(36) NOT NULL,
  space_id CHAR(36) NOT NULL,
  role ENUM('ADMIN', 'MEMBER') DEFAULT 'MEMBER',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, space_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (space_id) REFERENCES forum_spaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id CHAR(36) PRIMARY KEY,
  space_id CHAR(36) NOT NULL,
  author_id CHAR(36),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  tags JSON,
  vote_score INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_forum_posts_space (space_id),
  INDEX idx_forum_posts_author (author_id),
  INDEX idx_forum_posts_created (created_at),
  INDEX idx_forum_posts_vote_score (vote_score),
  FOREIGN KEY (space_id) REFERENCES forum_spaces(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create forum_votes table (Polymorphic)
CREATE TABLE IF NOT EXISTS forum_votes (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  target_id CHAR(36) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  vote_type TINYINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_forum_votes_target (target_id),
  INDEX idx_forum_votes_target_type (target_type),
  INDEX idx_forum_votes_user (user_id),
  UNIQUE INDEX idx_forum_votes_unique (user_id, target_id, target_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create forum_comments table
CREATE TABLE IF NOT EXISTS forum_comments (
  id CHAR(36) PRIMARY KEY,
  post_id CHAR(36) NOT NULL,
  author_id CHAR(36),
  content TEXT NOT NULL,
  parent_id CHAR(36) NULL,
  vote_score INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_forum_comments_post (post_id),
  INDEX idx_forum_comments_author (author_id),
  INDEX idx_forum_comments_parent (parent_id),
  FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES forum_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Add karma_points column to users table
-- This will fail if the column already exists - that's okay
ALTER TABLE users 
ADD COLUMN karma_points INT DEFAULT 0;

-- Verify the tables were created
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('forum_spaces', 'forum_space_members', 'forum_posts', 'forum_votes', 'forum_comments');

-- Verify karma_points column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'users'
AND COLUMN_NAME = 'karma_points';

