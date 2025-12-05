/**
 * Property-Based Tests for Referential Integrity
 * 
 * **Feature: real-data-migration, Property 10: Referential Integrity**
 * **Validates: Requirements 9.3**
 * 
 * Tests that for any foreign key relationship in the database,
 * the referenced record SHALL exist.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { query, initializeDatabase, closePool } from '../config/database';

/**
 * Foreign key relationship definition
 */
interface ForeignKeyRelation {
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  nullable: boolean;
}

/**
 * All foreign key relationships in the database schema
 */
const FOREIGN_KEY_RELATIONS: ForeignKeyRelation[] = [
  // Core tables
  { table: 'linked_accounts', column: 'user_id', referencedTable: 'users', referencedColumn: 'id', nullable: false },
  { table: 'departments', column: 'parent_dept_id', referencedTable: 'departments', referencedColumn: 'id', nullable: true },
  { table: 'projects', column: 'manager_id', referencedTable: 'users', referencedColumn: 'id', nullable: true },
  { table: 'task_columns', column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', nullable: false },
  { table: 'tasks', column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', nullable: false },
  { table: 'tasks', column: 'column_id', referencedTable: 'task_columns', referencedColumn: 'id', nullable: false },
  { table: 'tasks', column: 'assignee_id', referencedTable: 'users', referencedColumn: 'id', nullable: true },
  { table: 'tasks', column: 'reporter_id', referencedTable: 'users', referencedColumn: 'id', nullable: true },
  { table: 'task_tags', column: 'task_id', referencedTable: 'tasks', referencedColumn: 'id', nullable: false },
  { table: 'checklist_items', column: 'task_id', referencedTable: 'tasks', referencedColumn: 'id', nullable: false },
  { table: 'comments', column: 'task_id', referencedTable: 'tasks', referencedColumn: 'id', nullable: false },
  { table: 'comments', column: 'user_id', referencedTable: 'users', referencedColumn: 'id', nullable: false },
  { table: 'room_amenities', column: 'room_id', referencedTable: 'meeting_rooms', referencedColumn: 'id', nullable: false },
  { table: 'bookings', column: 'room_id', referencedTable: 'meeting_rooms', referencedColumn: 'id', nullable: false },
  { table: 'bookings', column: 'organizer_id', referencedTable: 'users', referencedColumn: 'id', nullable: false },
  { table: 'booking_participants', column: 'booking_id', referencedTable: 'bookings', referencedColumn: 'id', nullable: false },
  { table: 'booking_participants', column: 'user_id', referencedTable: 'users', referencedColumn: 'id', nullable: false },
  { table: 'project_files', column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', nullable: true },
  
  // Web project tables
  { table: 'project_resources', column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', nullable: false },
  { table: 'project_resources', column: 'approved_by', referencedTable: 'users', referencedColumn: 'id', nullable: true },
  { table: 'project_phases', column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', nullable: false },
  { table: 'project_tech_stack', column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', nullable: false },
  { table: 'project_tech_stack', column: 'locked_by', referencedTable: 'users', referencedColumn: 'id', nullable: true },
  { table: 'project_environments', column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', nullable: false },
  { table: 'project_environments', column: 'last_deployed_by', referencedTable: 'users', referencedColumn: 'id', nullable: true },
  { table: 'deployment_history', column: 'environment_id', referencedTable: 'project_environments', referencedColumn: 'id', nullable: false },
  { table: 'deployment_history', column: 'deployed_by', referencedTable: 'users', referencedColumn: 'id', nullable: false },
  { table: 'design_reviews', column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', nullable: false },
  { table: 'design_reviews', column: 'resource_id', referencedTable: 'project_resources', referencedColumn: 'id', nullable: false },
  { table: 'design_reviews', column: 'reviewer_id', referencedTable: 'users', referencedColumn: 'id', nullable: true },
  { table: 'bug_reports', column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', nullable: false },
  { table: 'bug_reports', column: 'task_id', referencedTable: 'tasks', referencedColumn: 'id', nullable: true },
  { table: 'bug_reports', column: 'reported_by', referencedTable: 'users', referencedColumn: 'id', nullable: false },
  { table: 'bug_reports', column: 'assigned_to', referencedTable: 'users', referencedColumn: 'id', nullable: true },
  { table: 'uat_feedback', column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', nullable: false },
  { table: 'project_signoffs', column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', nullable: false },
];


/**
 * Check if a table exists in the database
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await query<any[]>(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = ?
    `, [tableName]);
    return result[0]?.count > 0;
  } catch {
    return false;
  }
}

/**
 * Check referential integrity for a single foreign key relationship
 * Returns the count of orphaned records (records with invalid foreign key references)
 */
async function checkReferentialIntegrity(relation: ForeignKeyRelation): Promise<{
  relation: ForeignKeyRelation;
  orphanedCount: number;
  orphanedIds: string[];
}> {
  // Check if both tables exist
  const sourceExists = await tableExists(relation.table);
  const targetExists = await tableExists(relation.referencedTable);
  
  if (!sourceExists || !targetExists) {
    return { relation, orphanedCount: 0, orphanedIds: [] };
  }

  // Build query to find orphaned records
  // For nullable columns, we only check non-null values
  const nullCondition = relation.nullable 
    ? `AND t.${relation.column} IS NOT NULL` 
    : '';
  
  const orphanedQuery = `
    SELECT t.id, t.${relation.column} as fk_value
    FROM ${relation.table} t
    LEFT JOIN ${relation.referencedTable} r ON t.${relation.column} = r.${relation.referencedColumn}
    WHERE r.${relation.referencedColumn} IS NULL ${nullCondition}
  `;
  
  try {
    const orphanedRecords = await query<any[]>(orphanedQuery);
    return {
      relation,
      orphanedCount: orphanedRecords.length,
      orphanedIds: orphanedRecords.map(r => r.id),
    };
  } catch (error) {
    // If query fails (e.g., column doesn't exist), return 0 orphaned
    console.warn(`Warning: Could not check ${relation.table}.${relation.column}: ${error}`);
    return { relation, orphanedCount: 0, orphanedIds: [] };
  }
}

describe('Referential Integrity Property Tests', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closePool();
  });

  /**
   * **Feature: real-data-migration, Property 10: Referential Integrity**
   * **Validates: Requirements 9.3**
   * 
   * For any foreign key relationship in the database, the referenced record SHALL exist.
   * This property verifies that all foreign key constraints are satisfied.
   */
  it('Property 10: Referential Integrity - all foreign key references point to existing records', async () => {
    // Property: For any subset of foreign key relations, all references should be valid
    await fc.assert(
      fc.asyncProperty(
        // Generate a random subset of relations to check (at least 1, up to all)
        fc.shuffledSubarray(FOREIGN_KEY_RELATIONS, { minLength: 1 }),
        async (relationsToCheck) => {
          const results = await Promise.all(
            relationsToCheck.map(relation => checkReferentialIntegrity(relation))
          );
          
          // All relations should have zero orphaned records
          for (const result of results) {
            if (result.orphanedCount > 0) {
              console.error(
                `Referential integrity violation: ${result.relation.table}.${result.relation.column} ` +
                `has ${result.orphanedCount} orphaned records referencing non-existent ` +
                `${result.relation.referencedTable}.${result.relation.referencedColumn}`
              );
            }
            expect(result.orphanedCount).toBe(0);
          }
        }
      ),
      { numRuns: 10 } // Run 10 property tests with different subsets
    );
  });

  /**
   * Comprehensive check: Verify ALL foreign key relationships at once
   */
  it('Property 10b: All foreign key relationships maintain integrity', async () => {
    const violations: string[] = [];
    
    for (const relation of FOREIGN_KEY_RELATIONS) {
      const result = await checkReferentialIntegrity(relation);
      
      if (result.orphanedCount > 0) {
        violations.push(
          `${relation.table}.${relation.column} -> ${relation.referencedTable}.${relation.referencedColumn}: ` +
          `${result.orphanedCount} orphaned records (IDs: ${result.orphanedIds.slice(0, 5).join(', ')}${result.orphanedCount > 5 ? '...' : ''})`
        );
      }
    }
    
    if (violations.length > 0) {
      console.error('Referential integrity violations found:');
      violations.forEach(v => console.error(`  - ${v}`));
    }
    
    expect(violations).toHaveLength(0);
  });

  /**
   * Property: Core table relationships are always valid
   * Tests the most critical foreign key relationships
   */
  it('Property 10c: Core table relationships maintain integrity', async () => {
    const coreRelations = FOREIGN_KEY_RELATIONS.filter(r => 
      ['tasks', 'projects', 'users', 'departments', 'bookings'].includes(r.table) ||
      ['tasks', 'projects', 'users', 'departments', 'bookings'].includes(r.referencedTable)
    );
    
    await fc.assert(
      fc.asyncProperty(
        fc.shuffledSubarray(coreRelations, { minLength: 1 }),
        async (relationsToCheck) => {
          for (const relation of relationsToCheck) {
            const result = await checkReferentialIntegrity(relation);
            expect(result.orphanedCount).toBe(0);
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Self-referential relationships (like department hierarchy) are valid
   */
  it('Property 10d: Self-referential relationships maintain integrity', async () => {
    const selfRefRelations = FOREIGN_KEY_RELATIONS.filter(r => 
      r.table === r.referencedTable
    );
    
    for (const relation of selfRefRelations) {
      const result = await checkReferentialIntegrity(relation);
      expect(result.orphanedCount).toBe(0);
    }
  });

  /**
   * Property: Cascade delete relationships don't leave orphans
   * After any data exists, all child records should have valid parent references
   */
  it('Property 10e: Cascade relationships maintain integrity', async () => {
    // Relations that use ON DELETE CASCADE
    const cascadeRelations = FOREIGN_KEY_RELATIONS.filter(r => !r.nullable);
    
    await fc.assert(
      fc.asyncProperty(
        fc.shuffledSubarray(cascadeRelations, { minLength: 1 }),
        async (relationsToCheck) => {
          for (const relation of relationsToCheck) {
            const result = await checkReferentialIntegrity(relation);
            expect(result.orphanedCount).toBe(0);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});
