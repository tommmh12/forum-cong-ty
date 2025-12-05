-- Migration: Add missing columns to comments table
-- Run this script if you get "Unknown column 'is_deleted' in 'field list'" error
-- 
-- NOTE: MySQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- If a column already exists, the ALTER TABLE command will fail with an error
-- That's okay - just skip that command and continue with the others
--
-- RECOMMENDED: Use the TypeScript migration script instead:
-- npm run db:migrate:comments

-- 1. Add parent_id column (for nested replies)
-- This will fail if the column already exists - that's okay, just continue
ALTER TABLE comments 
ADD COLUMN parent_id VARCHAR(36) NULL;

-- Add foreign key constraint for parent_id
-- This will fail if the constraint already exists - that's okay
ALTER TABLE comments 
ADD CONSTRAINT fk_comment_parent 
FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;

-- 2. Add is_deleted column (for soft delete)
-- This will fail if the column already exists - that's okay, just continue
ALTER TABLE comments 
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- 3. Add updated_at column (for edit tracking)
-- This will fail if the column already exists - that's okay, just continue
ALTER TABLE comments 
ADD COLUMN updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP;

-- Verify the columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'comments'
AND COLUMN_NAME IN ('parent_id', 'is_deleted', 'updated_at');

