/**
 * Property-Based Tests for Project Repository - Task CRUD Operations
 * 
 * **Feature: real-data-migration, Property 2: Task CRUD Round Trip**
 * **Validates: Requirements 3.2, 3.4**
 * 
 * Tests that for any valid task data, creating a task and then fetching it
 * returns the task with auto-generated code and all provided data.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import * as projectRepo from './project.repository';
import { query } from '../config/database';
import { TaskCategory } from '../../../shared/types/web-project.types';
import { addTaskCategoryColumns, createTaskDependenciesTable } from '../database/task-category-migration';

// Test project ID - will be created in beforeAll
let testProjectId: string;
let testColumnId: string;

// Arbitrary for valid task titles (non-empty strings)
const validTitleArb = fc.string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

// Arbitrary for task types
const taskTypeArb = fc.constantFrom('FEATURE', 'BUG', 'IMPROVEMENT', 'RESEARCH') as fc.Arbitrary<'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'RESEARCH'>;

// Arbitrary for task priorities
const taskPriorityArb = fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'URGENT') as fc.Arbitrary<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>;

// Arbitrary for task categories
const taskCategoryArb = fc.constantFrom('FRONTEND', 'BACKEND', 'DESIGN', 'DEVOPS', 'QA') as fc.Arbitrary<TaskCategory>;

// Arbitrary for optional description
const descriptionArb = fc.option(fc.string({ maxLength: 1000 }), { nil: undefined });

// Arbitrary for valid task input
const validTaskInputArb = fc.record({
  title: validTitleArb,
  type: taskTypeArb,
  priority: taskPriorityArb,
  category: taskCategoryArb,
  description: descriptionArb,
});

describe('Task CRUD Round Trip Property Tests', () => {
  beforeAll(async () => {
    // Ensure database schema is up to date
    try {
      await addTaskCategoryColumns();
      await createTaskDependenciesTable();
    } catch (error) {
      // Ignore errors if columns/tables already exist
      console.log('Migration already applied or error:', error);
    }
    
    // Create a test project for the tests
    const projectKey = `TEST-${Date.now()}`;
    const project = await projectRepo.createProject({
      key: projectKey,
      name: 'Test Project for Task CRUD',
      status: 'ACTIVE',
    });
    testProjectId = project.id;
    
    // Get the first column (should be created by default)
    const columns = await projectRepo.findTaskColumnsByProjectId(testProjectId);
    if (columns.length === 0) {
      throw new Error('No columns found for test project');
    }
    testColumnId = columns[0].id;
  });

  afterAll(async () => {
    // Clean up: delete test project and all related data
    if (testProjectId) {
      // Delete tasks first
      await query('DELETE FROM tasks WHERE project_id = ?', [testProjectId]);
      // Delete columns
      await query('DELETE FROM task_columns WHERE project_id = ?', [testProjectId]);
      // Delete project
      await projectRepo.deleteProject(testProjectId);
    }
  });

  beforeEach(async () => {
    // Clean up tasks before each test to avoid interference
    if (testProjectId) {
      await query('DELETE FROM tasks WHERE project_id = ?', [testProjectId]);
    }
  });

  /**
   * **Feature: real-data-migration, Property 2: Task CRUD Round Trip**
   * **Validates: Requirements 3.2, 3.4**
   * 
   * For any valid task data, creating a task via createTask and then fetching it
   * via findWebTasksByProjectId SHALL return the task with:
   * - Auto-generated task code
   * - All provided data preserved
   */
  it('Property 2: Task CRUD Round Trip - created task can be fetched with all data preserved', async () => {
    await fc.assert(
      fc.asyncProperty(validTaskInputArb, async (taskInput) => {
        // Create task
        const createdTask = await projectRepo.createTask({
          projectId: testProjectId,
          columnId: testColumnId,
          title: taskInput.title,
          type: taskInput.type,
          priority: taskInput.priority,
          category: taskInput.category,
          description: taskInput.description,
        });

        // Verify task was created with auto-generated code
        expect(createdTask.id).toBeDefined();
        expect(createdTask.code).toBeDefined();
        // Code format: PROJECT_KEY-NUMBER (e.g., TEST-1234567890-001 or TASK-001)
        expect(createdTask.code).toMatch(/^[A-Z0-9-]+-\d{3}$/);

        // Fetch tasks for the project
        const fetchedTasks = await projectRepo.findWebTasksByProjectId(testProjectId);
        const fetchedTask = fetchedTasks.find(t => t.id === createdTask.id);

        // Verify task exists in fetched results
        expect(fetchedTask).toBeDefined();
        
        if (fetchedTask) {
          // Verify all provided data is preserved
          expect(fetchedTask.title).toBe(taskInput.title);
          expect(fetchedTask.type).toBe(taskInput.type);
          expect(fetchedTask.priority).toBe(taskInput.priority);
          expect(fetchedTask.category).toBe(taskInput.category);
          expect(fetchedTask.projectId).toBe(testProjectId);
          expect(fetchedTask.columnId).toBe(testColumnId);
          
          // Description: empty string may be stored as null in database
          if (taskInput.description !== undefined && taskInput.description !== '') {
            expect(fetchedTask.description).toBe(taskInput.description);
          } else {
            // Empty string or undefined description may be returned as null or empty string
            expect(fetchedTask.description === null || fetchedTask.description === '' || fetchedTask.description === undefined).toBe(true);
          }
        }

        // Clean up this task for next iteration
        await projectRepo.deleteTask(createdTask.id);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Task update round trip
   * For any valid task, updating it and fetching should reflect the changes
   */
  it('Property 2b: Task Update Round Trip - updated task reflects changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        validTaskInputArb,
        validTaskInputArb,
        async (initialInput, updateInput) => {
          // Create initial task
          const createdTask = await projectRepo.createTask({
            projectId: testProjectId,
            columnId: testColumnId,
            title: initialInput.title,
            type: initialInput.type,
            priority: initialInput.priority,
            category: initialInput.category,
            description: initialInput.description,
          });

          // Update the task
          await projectRepo.updateTask(createdTask.id, {
            title: updateInput.title,
            type: updateInput.type,
            priority: updateInput.priority,
            category: updateInput.category,
            description: updateInput.description,
          });

          // Fetch and verify
          const fetchedTasks = await projectRepo.findWebTasksByProjectId(testProjectId);
          const fetchedTask = fetchedTasks.find(t => t.id === createdTask.id);

          expect(fetchedTask).toBeDefined();
          if (fetchedTask) {
            expect(fetchedTask.title).toBe(updateInput.title);
            expect(fetchedTask.type).toBe(updateInput.type);
            expect(fetchedTask.priority).toBe(updateInput.priority);
            expect(fetchedTask.category).toBe(updateInput.category);
          }

          // Clean up
          await projectRepo.deleteTask(createdTask.id);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Task delete removes task
   * For any created task, deleting it should remove it from fetch results
   */
  it('Property 2c: Task Delete - deleted task is not returned in fetch', async () => {
    await fc.assert(
      fc.asyncProperty(validTaskInputArb, async (taskInput) => {
        // Create task
        const createdTask = await projectRepo.createTask({
          projectId: testProjectId,
          columnId: testColumnId,
          title: taskInput.title,
          type: taskInput.type,
          priority: taskInput.priority,
          category: taskInput.category,
        });

        // Verify task exists
        let fetchedTasks = await projectRepo.findWebTasksByProjectId(testProjectId);
        expect(fetchedTasks.some(t => t.id === createdTask.id)).toBe(true);

        // Delete task
        const deleted = await projectRepo.deleteTask(createdTask.id);
        expect(deleted).toBe(true);

        // Verify task no longer exists
        fetchedTasks = await projectRepo.findWebTasksByProjectId(testProjectId);
        expect(fetchedTasks.some(t => t.id === createdTask.id)).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: real-data-migration, Property 3: Task Move Persistence**
   * **Validates: Requirements 3.3**
   * 
   * For any task move operation, moving a task to a different column via moveTask
   * and then fetching it SHALL show the task in the new column.
   */
  it('Property 3: Task Move Persistence - moved task appears in new column', async () => {
    // Get all columns for the test project
    const columns = await projectRepo.findTaskColumnsByProjectId(testProjectId);
    expect(columns.length).toBeGreaterThanOrEqual(2);
    
    // Create arbitrary for selecting a target column (different from initial)
    const columnIndexArb = fc.integer({ min: 1, max: columns.length - 1 });
    const positionArb = fc.integer({ min: 0, max: 100 });
    
    await fc.assert(
      fc.asyncProperty(
        validTaskInputArb,
        columnIndexArb,
        positionArb,
        async (taskInput, targetColumnIndex, targetPosition) => {
          // Create task in the first column
          const initialColumnId = columns[0].id;
          const createdTask = await projectRepo.createTask({
            projectId: testProjectId,
            columnId: initialColumnId,
            title: taskInput.title,
            type: taskInput.type,
            priority: taskInput.priority,
            category: taskInput.category,
          });

          // Verify task is in initial column
          let fetchedTasks = await projectRepo.findWebTasksByProjectId(testProjectId);
          let fetchedTask = fetchedTasks.find(t => t.id === createdTask.id);
          expect(fetchedTask).toBeDefined();
          expect(fetchedTask?.columnId).toBe(initialColumnId);

          // Move task to a different column
          const targetColumnId = columns[targetColumnIndex].id;
          const moved = await projectRepo.moveTask(createdTask.id, targetColumnId, targetPosition);
          expect(moved).toBe(true);

          // Fetch and verify task is now in the new column
          fetchedTasks = await projectRepo.findWebTasksByProjectId(testProjectId);
          fetchedTask = fetchedTasks.find(t => t.id === createdTask.id);
          
          expect(fetchedTask).toBeDefined();
          expect(fetchedTask?.columnId).toBe(targetColumnId);
          expect(fetchedTask?.position).toBe(targetPosition);

          // Clean up
          await projectRepo.deleteTask(createdTask.id);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3b: Task Move Round Trip - moving task back returns to original state
   * For any task, moving it to another column and back should preserve the task data
   */
  it('Property 3b: Task Move Round Trip - moving task back preserves data', async () => {
    const columns = await projectRepo.findTaskColumnsByProjectId(testProjectId);
    expect(columns.length).toBeGreaterThanOrEqual(2);
    
    await fc.assert(
      fc.asyncProperty(validTaskInputArb, async (taskInput) => {
        // Create task in the first column
        const initialColumnId = columns[0].id;
        const createdTask = await projectRepo.createTask({
          projectId: testProjectId,
          columnId: initialColumnId,
          title: taskInput.title,
          type: taskInput.type,
          priority: taskInput.priority,
          category: taskInput.category,
        });

        const initialPosition = createdTask.position;

        // Move to second column
        const targetColumnId = columns[1].id;
        await projectRepo.moveTask(createdTask.id, targetColumnId, 0);

        // Move back to first column
        await projectRepo.moveTask(createdTask.id, initialColumnId, initialPosition);

        // Fetch and verify task is back in original column with data preserved
        const fetchedTasks = await projectRepo.findWebTasksByProjectId(testProjectId);
        const fetchedTask = fetchedTasks.find(t => t.id === createdTask.id);
        
        expect(fetchedTask).toBeDefined();
        expect(fetchedTask?.columnId).toBe(initialColumnId);
        expect(fetchedTask?.title).toBe(taskInput.title);
        expect(fetchedTask?.type).toBe(taskInput.type);
        expect(fetchedTask?.priority).toBe(taskInput.priority);
        expect(fetchedTask?.category).toBe(taskInput.category);

        // Clean up
        await projectRepo.deleteTask(createdTask.id);
      }),
      { numRuns: 30 }
    );
  });
});
