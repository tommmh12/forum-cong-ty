/**
 * Property-Based Tests for Seed Data Idempotence
 * 
 * **Feature: real-data-migration, Property 9: Seed Data Idempotence**
 * **Validates: Requirements 9.4**
 * 
 * Tests that for any database, running the seed script multiple times
 * SHALL not create duplicate records.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { getPool, query, initializeDatabase, closePool } from '../config/database';
import { seedAll } from './seed';

// Tables that are seeded by the seed script
const SEEDED_TABLES = [
  'users',
  'linked_accounts',
  'departments',
  'projects',
  'task_columns',
  'tasks',
  'task_tags',
  'checklist_items',
  'comments',
  'meeting_rooms',
  'room_amenities',
  'bookings',
  'booking_participants',
  'project_files',
  'project_phases',
  'project_environments',
  'project_resources',
  'project_tech_stack',
];

/**
 * Get record counts for all seeded tables
 */
async function getTableCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  
  for (const table of SEEDED_TABLES) {
    try {
      const result = await query<any[]>(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = result[0]?.count ?? 0;
    } catch (error) {
      // Table might not exist, set count to 0
      counts[table] = 0;
    }
  }
  
  return counts;
}

describe('Seed Data Idempotence Property Tests', () => {
  beforeAll(async () => {
    // Initialize database connection
    await initializeDatabase();
  });

  afterAll(async () => {
    // Close database connection
    await closePool();
  });


  /**
   * **Feature: real-data-migration, Property 9: Seed Data Idempotence**
   * **Validates: Requirements 9.4**
   * 
   * For any database, running the seed script multiple times SHALL not create
   * duplicate records. The record counts should remain the same after each
   * subsequent seed execution.
   */
  it('Property 9: Seed Data Idempotence - running seed multiple times does not create duplicates', async () => {
    // Run seed once to establish baseline
    await seedAll();
    const countsAfterFirstSeed = await getTableCounts();
    
    // Property: For any number of additional seed runs (1-5), counts should remain the same
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // Number of additional seed runs
        async (additionalRuns) => {
          // Run seed additional times
          for (let i = 0; i < additionalRuns; i++) {
            await seedAll();
          }
          
          // Get counts after additional runs
          const countsAfterAdditionalSeeds = await getTableCounts();
          
          // Verify counts are the same for all tables
          for (const table of SEEDED_TABLES) {
            const beforeCount = countsAfterFirstSeed[table];
            const afterCount = countsAfterAdditionalSeeds[table];
            
            // Counts should be equal (no duplicates created)
            expect(afterCount).toBe(beforeCount);
          }
        }
      ),
      { numRuns: 5 } // Run 5 property tests (each with 1-3 seed runs)
    );
  });

  /**
   * Additional property: Seed creates expected records
   * After seeding, all expected tables should have at least one record
   */
  it('Property 9b: Seed creates records in expected tables', async () => {
    // Run seed
    await seedAll();
    
    // Get counts
    const counts = await getTableCounts();
    
    // Core tables that must have records after seeding
    const coreTables = [
      'users',
      'departments', 
      'projects',
      'task_columns',
      'tasks',
      'meeting_rooms',
      'bookings',
    ];
    
    for (const table of coreTables) {
      expect(counts[table]).toBeGreaterThan(0);
    }
  });

  /**
   * Property: Seed maintains referential integrity
   * All foreign key references should point to existing records
   */
  it('Property 9c: Seed maintains referential integrity', async () => {
    // Run seed
    await seedAll();
    
    // Check that all task column references exist
    const orphanedTasks = await query<any[]>(`
      SELECT t.id FROM tasks t 
      LEFT JOIN task_columns tc ON t.column_id = tc.id 
      WHERE tc.id IS NULL
    `);
    expect(orphanedTasks.length).toBe(0);
    
    // Check that all project references in tasks exist
    const orphanedTaskProjects = await query<any[]>(`
      SELECT t.id FROM tasks t 
      LEFT JOIN projects p ON t.project_id = p.id 
      WHERE p.id IS NULL
    `);
    expect(orphanedTaskProjects.length).toBe(0);
    
    // Check that all department parent references exist (or are null)
    const orphanedDepts = await query<any[]>(`
      SELECT d.id FROM departments d 
      LEFT JOIN departments pd ON d.parent_dept_id = pd.id 
      WHERE d.parent_dept_id IS NOT NULL AND pd.id IS NULL
    `);
    expect(orphanedDepts.length).toBe(0);
    
    // Check that all booking room references exist
    const orphanedBookings = await query<any[]>(`
      SELECT b.id FROM bookings b 
      LEFT JOIN meeting_rooms mr ON b.room_id = mr.id 
      WHERE mr.id IS NULL
    `);
    expect(orphanedBookings.length).toBe(0);
  });
});
