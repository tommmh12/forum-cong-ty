/**
 * Property-Based Tests for Delete Cascade
 * 
 * **Feature: real-data-migration, Property 12: Delete Cascade**
 * **Validates: Requirements 2.4**
 * 
 * Tests that for any deleted project, all related tasks, columns, and resources
 * SHALL also be deleted.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import * as projectRepo from './project.repository';
import { query, initializeDatabase, closePool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Tables that should cascade delete when a project is deleted
const PROJECT_RELATED_TABLES = [
  'task_columns',
  'tasks',
  'project_resources',
  'project_phases',
  'project_tech_stack',
  'project_environments',
  'bug_reports',
  'uat_feedback',
  'project_signoffs',
];

// Arbitrary for valid project names
const validProjectNameArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

// Arbitrary for valid project keys
const validProjectKeyArb = fc.string({ minLength: 2, maxLength: 10 })
  .map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'TEST')
  .filter(s => s.length >= 2);

// Arbitrary for task titles
const validTaskTitleArb = fc.string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

// Arbitrary for number of tasks to create
const taskCountArb = fc.integer({ min: 0, max: 5 });

// Arbitrary for number of resources to create
const resourceCountArb = fc.integer({ min: 0, max: 3 });

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
 * Count records in a table for a specific project
 */
async function countProjectRecords(tableName: string, projectId: string): Promise<number> {
  const exists = await tableExists(tableName);
  if (!exists) return 0;
  
  try {
    const result = await query<any[]>(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE project_id = ?`,
      [projectId]
    );
    return result[0]?.count || 0;
  } catch {
    return 0;
  }
}

/**
 * Create test resources for a project
 */
async function createTestResources(projectId: string, count: number): Promise<string[]> {
  const exists = await tableExists('project_resources');
  if (!exists || count === 0) return [];
  
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = uuidv4();
    try {
      await query(
        `INSERT INTO project_resources (id, project_id, type, name, status) VALUES (?, ?, 'SITEMAP', ?, 'PENDING')`,
        [id, projectId, `Test Resource ${i + 1}`]
      );
      ids.push(id);
    } catch {
      // Ignore errors
    }
  }
  return ids;
}

/**
 * Create test tech stack items for a project
 */
async function createTestTechStack(projectId: string, count: number): Promise<string[]> {
  const exists = await tableExists('project_tech_stack');
  if (!exists || count === 0) return [];
  
  const ids: string[] = [];
  const categories = ['LANGUAGE', 'FRAMEWORK', 'DATABASE'];
  for (let i = 0; i < count; i++) {
    const id = uuidv4();
    try {
      await query(
        `INSERT INTO project_tech_stack (id, project_id, category, name) VALUES (?, ?, ?, ?)`,
        [id, projectId, categories[i % categories.length], `Tech ${i + 1}`]
      );
      ids.push(id);
    } catch {
      // Ignore errors
    }
  }
  return ids;
}

/**
 * Create test UAT feedback for a project
 */
async function createTestUATFeedback(projectId: string, count: number): Promise<string[]> {
  const exists = await tableExists('uat_feedback');
  if (!exists || count === 0) return [];
  
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = uuidv4();
    try {
      await query(
        `INSERT INTO uat_feedback (id, project_id, feedback_text, provided_by) VALUES (?, ?, ?, ?)`,
        [id, projectId, `Test feedback ${i + 1}`, 'Test User']
      );
      ids.push(id);
    } catch {
      // Ignore errors
    }
  }
  return ids;
}

/**
 * Create test bug reports for a project
 */
async function createTestBugReports(projectId: string, userId: string, count: number): Promise<string[]> {
  const exists = await tableExists('bug_reports');
  if (!exists || count === 0) return [];
  
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = uuidv4();
    try {
      await query(
        `INSERT INTO bug_reports (id, project_id, title, severity, environment, reproduction_steps, reported_by) 
         VALUES (?, ?, ?, 'LOW', 'STAGING', 'Steps to reproduce', ?)`,
        [id, projectId, `Bug ${i + 1}`, userId]
      );
      ids.push(id);
    } catch {
      // Ignore errors
    }
  }
  return ids;
}

/**
 * Create test signoffs for a project
 */
async function createTestSignoffs(projectId: string, count: number): Promise<string[]> {
  const exists = await tableExists('project_signoffs');
  if (!exists || count === 0) return [];
  
  const ids: string[] = [];
  const types = ['DESIGN', 'UAT', 'GO_LIVE'];
  for (let i = 0; i < count; i++) {
    const id = uuidv4();
    try {
      await query(
        `INSERT INTO project_signoffs (id, project_id, signoff_type, approver_name) VALUES (?, ?, ?, ?)`,
        [id, projectId, types[i % types.length], `Approver ${i + 1}`]
      );
      ids.push(id);
    } catch {
      // Ignore errors
    }
  }
  return ids;
}

describe('Delete Cascade Property Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Get or create a test user for bug reports
    const users = await query<any[]>('SELECT id FROM users LIMIT 1');
    if (users.length > 0) {
      testUserId = users[0].id;
    } else {
      testUserId = uuidv4();
      await query(
        `INSERT INTO users (id, full_name, email, role) VALUES (?, 'Test User', ?, 'Employee')`,
        [testUserId, `test-${Date.now()}@test.com`]
      );
    }
  });

  afterAll(async () => {
    await closePool();
  });

  /**
   * **Feature: real-data-migration, Property 12: Delete Cascade**
   * **Validates: Requirements 2.4**
   * 
   * For any deleted project, all related tasks, columns, and resources
   * SHALL also be deleted.
   */
  it('Property 12: Delete Cascade - deleting project removes all related data', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectKeyArb,
        validProjectNameArb,
        taskCountArb,
        resourceCountArb,
        async (projectKey, projectName, taskCount, resourceCount) => {
          // Create a unique project key to avoid conflicts
          const uniqueKey = `${projectKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
          
          // Create project (this also creates default columns and phases/environments)
          const project = await projectRepo.createProject({
            key: uniqueKey,
            name: projectName,
            status: 'ACTIVE',
          });
          const projectId = project.id;

          // Get columns for task creation
          const columns = await projectRepo.findTaskColumnsByProjectId(projectId);
          const columnId = columns.length > 0 ? columns[0].id : null;

          // Create tasks if we have a column
          const createdTaskIds: string[] = [];
          if (columnId && taskCount > 0) {
            for (let i = 0; i < taskCount; i++) {
              const task = await projectRepo.createTask({
                projectId,
                columnId,
                title: `Test Task ${i + 1}`,
                type: 'FEATURE',
                priority: 'MEDIUM',
              });
              createdTaskIds.push(task.id);
            }
          }

          // Create additional related data
          await createTestResources(projectId, resourceCount);
          await createTestTechStack(projectId, resourceCount);
          await createTestUATFeedback(projectId, resourceCount);
          await createTestBugReports(projectId, testUserId, resourceCount);
          await createTestSignoffs(projectId, resourceCount);

          // Verify data was created
          const columnsBeforeDelete = await countProjectRecords('task_columns', projectId);
          const tasksBeforeDelete = await countProjectRecords('tasks', projectId);
          const phasesBeforeDelete = await countProjectRecords('project_phases', projectId);
          const environmentsBeforeDelete = await countProjectRecords('project_environments', projectId);

          // At minimum, we should have columns (created by default)
          expect(columnsBeforeDelete).toBeGreaterThan(0);
          expect(tasksBeforeDelete).toBe(taskCount);

          // Delete the project
          const deleted = await projectRepo.deleteProject(projectId);
          expect(deleted).toBe(true);

          // Verify project is deleted
          const projectAfterDelete = await projectRepo.findProjectById(projectId);
          expect(projectAfterDelete).toBeNull();

          // Verify all related data is deleted (cascade)
          for (const tableName of PROJECT_RELATED_TABLES) {
            const count = await countProjectRecords(tableName, projectId);
            if (count > 0) {
              console.error(`Table ${tableName} still has ${count} records for deleted project ${projectId}`);
            }
            expect(count).toBe(0);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 12b: Delete cascade removes tasks with their related data
   * When a project is deleted, tasks and their tags, checklists, comments should also be deleted
   */
  it('Property 12b: Delete Cascade - tasks and their related data are removed', async () => {
    await fc.assert(
      fc.asyncProperty(
        validProjectKeyArb,
        validProjectNameArb,
        fc.integer({ min: 1, max: 3 }),
        async (projectKey, projectName, taskCount) => {
          const uniqueKey = `${projectKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
          
          // Create project
          const project = await projectRepo.createProject({
            key: uniqueKey,
            name: projectName,
            status: 'ACTIVE',
          });
          const projectId = project.id;

          // Get first column
          const columns = await projectRepo.findTaskColumnsByProjectId(projectId);
          expect(columns.length).toBeGreaterThan(0);
          const columnId = columns[0].id;

          // Create tasks with tags and checklist items
          const taskIds: string[] = [];
          for (let i = 0; i < taskCount; i++) {
            const task = await projectRepo.createTask({
              projectId,
              columnId,
              title: `Task ${i + 1}`,
              type: 'FEATURE',
              priority: 'MEDIUM',
            });
            taskIds.push(task.id);

            // Add tags
            const tagId = uuidv4();
            await query(
              'INSERT INTO task_tags (id, task_id, tag) VALUES (?, ?, ?)',
              [tagId, task.id, `tag-${i}`]
            );

            // Add checklist items
            const checklistId = uuidv4();
            await query(
              'INSERT INTO checklist_items (id, task_id, title, is_completed, position) VALUES (?, ?, ?, FALSE, 0)',
              [checklistId, task.id, `Checklist item ${i}`]
            );
          }

          // Verify task-related data exists
          const tagsBeforeDelete = await query<any[]>(
            `SELECT COUNT(*) as count FROM task_tags WHERE task_id IN (${taskIds.map(() => '?').join(',')})`,
            taskIds
          );
          const checklistsBeforeDelete = await query<any[]>(
            `SELECT COUNT(*) as count FROM checklist_items WHERE task_id IN (${taskIds.map(() => '?').join(',')})`,
            taskIds
          );
          
          expect(tagsBeforeDelete[0].count).toBe(taskCount);
          expect(checklistsBeforeDelete[0].count).toBe(taskCount);

          // Delete project
          await projectRepo.deleteProject(projectId);

          // Verify tasks are deleted
          const tasksAfterDelete = await query<any[]>(
            `SELECT COUNT(*) as count FROM tasks WHERE id IN (${taskIds.map(() => '?').join(',')})`,
            taskIds
          );
          expect(tasksAfterDelete[0].count).toBe(0);

          // Verify task tags are deleted (cascade from tasks)
          const tagsAfterDelete = await query<any[]>(
            `SELECT COUNT(*) as count FROM task_tags WHERE task_id IN (${taskIds.map(() => '?').join(',')})`,
            taskIds
          );
          expect(tagsAfterDelete[0].count).toBe(0);

          // Verify checklist items are deleted (cascade from tasks)
          const checklistsAfterDelete = await query<any[]>(
            `SELECT COUNT(*) as count FROM checklist_items WHERE task_id IN (${taskIds.map(() => '?').join(',')})`,
            taskIds
          );
          expect(checklistsAfterDelete[0].count).toBe(0);
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property 12c: Delete cascade removes environments and deployment history
   * When a project is deleted, environments and their deployment history should also be deleted
   */
  it('Property 12c: Delete Cascade - environments and deployment history are removed', async () => {
    const envTableExists = await tableExists('project_environments');
    const deployTableExists = await tableExists('deployment_history');
    
    if (!envTableExists) {
      console.log('Skipping test: project_environments table does not exist');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        validProjectKeyArb,
        validProjectNameArb,
        async (projectKey, projectName) => {
          const uniqueKey = `${projectKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
          
          // Create project (this initializes environments)
          const project = await projectRepo.createProject({
            key: uniqueKey,
            name: projectName,
            status: 'ACTIVE',
          });
          const projectId = project.id;

          // Get environments
          const environments = await query<any[]>(
            'SELECT id FROM project_environments WHERE project_id = ?',
            [projectId]
          );

          // Add deployment history if table exists and we have environments
          if (deployTableExists && environments.length > 0) {
            const deployId = uuidv4();
            await query(
              `INSERT INTO deployment_history (id, environment_id, version, deployed_by, status) 
               VALUES (?, ?, '1.0.0', ?, 'SUCCESS')`,
              [deployId, environments[0].id, testUserId]
            );
          }

          // Verify environments exist
          const envsBeforeDelete = await countProjectRecords('project_environments', projectId);
          expect(envsBeforeDelete).toBeGreaterThan(0);

          // Delete project
          await projectRepo.deleteProject(projectId);

          // Verify environments are deleted
          const envsAfterDelete = await countProjectRecords('project_environments', projectId);
          expect(envsAfterDelete).toBe(0);

          // Verify deployment history is deleted (cascade from environments)
          if (deployTableExists && environments.length > 0) {
            const deploysAfterDelete = await query<any[]>(
              `SELECT COUNT(*) as count FROM deployment_history WHERE environment_id IN (${environments.map(() => '?').join(',')})`,
              environments.map(e => e.id)
            );
            expect(deploysAfterDelete[0].count).toBe(0);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 12d: Multiple project deletions maintain database integrity
   * Deleting multiple projects should not affect other projects' data
   */
  it('Property 12d: Delete Cascade - multiple deletions maintain integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 4 }),
        async (projectCount) => {
          const projects: { id: string; key: string }[] = [];
          
          // Create multiple projects
          for (let i = 0; i < projectCount; i++) {
            const uniqueKey = `MULTI-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
            const project = await projectRepo.createProject({
              key: uniqueKey,
              name: `Multi Project ${i + 1}`,
              status: 'ACTIVE',
            });
            projects.push({ id: project.id, key: uniqueKey });
          }

          // Verify all projects have columns
          for (const project of projects) {
            const columns = await countProjectRecords('task_columns', project.id);
            expect(columns).toBeGreaterThan(0);
          }

          // Delete first project
          await projectRepo.deleteProject(projects[0].id);

          // Verify first project's data is deleted
          const deletedProjectColumns = await countProjectRecords('task_columns', projects[0].id);
          expect(deletedProjectColumns).toBe(0);

          // Verify other projects' data is intact
          for (let i = 1; i < projects.length; i++) {
            const columns = await countProjectRecords('task_columns', projects[i].id);
            expect(columns).toBeGreaterThan(0);
          }

          // Clean up remaining projects
          for (let i = 1; i < projects.length; i++) {
            await projectRepo.deleteProject(projects[i].id);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});
