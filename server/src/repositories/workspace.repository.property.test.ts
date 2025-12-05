/**
 * Property-Based Tests for Workspace Repository - Booking Conflict Prevention
 * 
 * **Feature: real-data-migration, Property 8: Booking Conflict Prevention**
 * **Validates: Requirements 7.4**
 * 
 * Tests that for any room at a given time, the system SHALL prevent overlapping bookings.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import * as workspaceRepo from './workspace.repository';
import { query } from '../config/database';

// Test room ID - will be created in beforeAll
let testRoomId: string;
let testOrganizerId: string;

// Helper to format date as MySQL DATETIME string (YYYY-MM-DD HH:MM:SS)
function formatMySQLDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Helper to generate MySQL datetime strings for a specific day
function generateTimeSlot(baseDate: Date, startHour: number, durationMinutes: number): { startTime: string; endTime: string } {
  const start = new Date(baseDate);
  start.setHours(startHour, 0, 0, 0);
  
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);
  
  return {
    startTime: formatMySQLDateTime(start),
    endTime: formatMySQLDateTime(end),
  };
}

// Arbitrary for valid booking titles
const validTitleArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

// Arbitrary for hour of day (0-23)
const hourArb = fc.integer({ min: 0, max: 22 });

// Arbitrary for duration in minutes (15 min to 4 hours)
const durationArb = fc.integer({ min: 15, max: 240 });

describe('Booking Conflict Prevention Property Tests', () => {
  beforeAll(async () => {
    // Create a test meeting room
    testRoomId = `test-room-${Date.now()}`;
    await query(
      `INSERT INTO meeting_rooms (id, name, capacity, type, location, status, image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [testRoomId, 'Test Room for Booking Conflicts', 10, 'PHYSICAL', 'Test Location', 'AVAILABLE', '/test.jpg']
    );
    
    // Get or create a test user for organizer
    const users = await query<{ id: string }[]>('SELECT id FROM users LIMIT 1');
    if (users.length > 0) {
      testOrganizerId = users[0].id;
    } else {
      testOrganizerId = `test-user-${Date.now()}`;
      await query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [testOrganizerId, 'test@test.com', 'hash', 'Test', 'User', 'EMPLOYEE', 'ACTIVE']
      );
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testRoomId) {
      await query('DELETE FROM booking_participants WHERE booking_id IN (SELECT id FROM bookings WHERE room_id = ?)', [testRoomId]);
      await query('DELETE FROM bookings WHERE room_id = ?', [testRoomId]);
      await query('DELETE FROM room_amenities WHERE room_id = ?', [testRoomId]);
      await query('DELETE FROM meeting_rooms WHERE id = ?', [testRoomId]);
    }
  });

  beforeEach(async () => {
    // Clean up bookings before each test
    if (testRoomId) {
      await query('DELETE FROM booking_participants WHERE booking_id IN (SELECT id FROM bookings WHERE room_id = ?)', [testRoomId]);
      await query('DELETE FROM bookings WHERE room_id = ?', [testRoomId]);
    }
  });

  /**
   * **Feature: real-data-migration, Property 8: Booking Conflict Prevention**
   * **Validates: Requirements 7.4**
   * 
   * For any room at a given time, the system SHALL prevent overlapping bookings.
   * 
   * Property: If a booking exists for a time range [A_start, A_end], then attempting
   * to create another booking with overlapping time range [B_start, B_end] where
   * B_start < A_end AND B_end > A_start SHALL be detected as a conflict.
   */
  it('Property 8: Booking Conflict Prevention - overlapping bookings are detected', async () => {
    // Use a fixed base date for testing
    const baseDate = new Date('2025-01-15');
    
    await fc.assert(
      fc.asyncProperty(
        validTitleArb,
        validTitleArb,
        hourArb,
        durationArb,
        fc.integer({ min: -60, max: 60 }), // Overlap offset in minutes
        async (title1, title2, startHour, duration, overlapOffset) => {
          // Create first booking
          const slot1 = generateTimeSlot(baseDate, startHour, duration);
          
          const booking1 = await workspaceRepo.createBooking({
            roomId: testRoomId,
            title: title1,
            organizerId: testOrganizerId,
            startTime: slot1.startTime,
            endTime: slot1.endTime,
          });
          
          expect(booking1.id).toBeDefined();
          
          // Calculate overlapping time slot
          // Start the second booking somewhere within the first booking's time range
          const slot1Start = new Date(slot1.startTime.replace(' ', 'T'));
          const slot1End = new Date(slot1.endTime.replace(' ', 'T'));
          
          // Create an overlapping slot by starting within the first booking
          const overlapStart = new Date(slot1Start.getTime() + Math.abs(overlapOffset) * 60000);
          // Ensure it ends after the first booking starts (creating overlap)
          const overlapEnd = new Date(overlapStart.getTime() + Math.max(30, duration) * 60000);
          
          // Only test if there's actual overlap
          const hasOverlap = overlapStart < slot1End && overlapEnd > slot1Start;
          
          if (hasOverlap) {
            // Check that conflict is detected
            const conflictDetected = await workspaceRepo.hasBookingConflict(
              testRoomId,
              formatMySQLDateTime(overlapStart),
              formatMySQLDateTime(overlapEnd)
            );
            
            expect(conflictDetected).toBe(true);
            
            // Also verify findConflictingBookings returns the conflicting booking
            const conflicts = await workspaceRepo.findConflictingBookings(
              testRoomId,
              formatMySQLDateTime(overlapStart),
              formatMySQLDateTime(overlapEnd)
            );
            
            expect(conflicts.length).toBeGreaterThan(0);
            expect(conflicts.some(c => c.id === booking1.id)).toBe(true);
          }
          
          // Clean up
          await query('DELETE FROM bookings WHERE id = ?', [booking1.id]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8b: Non-overlapping bookings are allowed
   * 
   * For any two non-overlapping time ranges, both bookings should be allowed.
   */
  it('Property 8b: Non-overlapping bookings are allowed', async () => {
    const baseDate = new Date('2025-01-15');
    
    await fc.assert(
      fc.asyncProperty(
        validTitleArb,
        validTitleArb,
        hourArb,
        durationArb,
        async (title1, title2, startHour, duration) => {
          // Ensure we have room for two non-overlapping bookings
          const adjustedStartHour = Math.min(startHour, 20);
          const adjustedDuration = Math.min(duration, 60);
          
          // Create first booking
          const slot1 = generateTimeSlot(baseDate, adjustedStartHour, adjustedDuration);
          
          const booking1 = await workspaceRepo.createBooking({
            roomId: testRoomId,
            title: title1,
            organizerId: testOrganizerId,
            startTime: slot1.startTime,
            endTime: slot1.endTime,
          });
          
          // Create second booking that starts after the first one ends
          const slot1End = new Date(slot1.endTime.replace(' ', 'T'));
          const slot2Start = new Date(slot1End.getTime() + 60000); // 1 minute gap
          const slot2End = new Date(slot2Start.getTime() + adjustedDuration * 60000);
          
          // Verify no conflict is detected
          const conflictDetected = await workspaceRepo.hasBookingConflict(
            testRoomId,
            formatMySQLDateTime(slot2Start),
            formatMySQLDateTime(slot2End)
          );
          
          expect(conflictDetected).toBe(false);
          
          // Create the second booking - should succeed
          const booking2 = await workspaceRepo.createBooking({
            roomId: testRoomId,
            title: title2,
            organizerId: testOrganizerId,
            startTime: formatMySQLDateTime(slot2Start),
            endTime: formatMySQLDateTime(slot2End),
          });
          
          expect(booking2.id).toBeDefined();
          expect(booking2.id).not.toBe(booking1.id);
          
          // Clean up
          await query('DELETE FROM bookings WHERE id IN (?, ?)', [booking1.id, booking2.id]);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8c: Cancelled bookings don't cause conflicts
   * 
   * A cancelled booking should not prevent new bookings in the same time slot.
   */
  it('Property 8c: Cancelled bookings do not cause conflicts', async () => {
    const baseDate = new Date('2025-01-15');
    
    await fc.assert(
      fc.asyncProperty(
        validTitleArb,
        validTitleArb,
        hourArb,
        durationArb,
        async (title1, title2, startHour, duration) => {
          // Create first booking
          const slot = generateTimeSlot(baseDate, startHour, duration);
          
          const booking1 = await workspaceRepo.createBooking({
            roomId: testRoomId,
            title: title1,
            organizerId: testOrganizerId,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
          
          // Cancel the booking
          await workspaceRepo.updateBooking(booking1.id, { status: 'CANCELLED' });
          
          // Verify no conflict is detected for the same time slot
          const conflictDetected = await workspaceRepo.hasBookingConflict(
            testRoomId,
            slot.startTime,
            slot.endTime
          );
          
          expect(conflictDetected).toBe(false);
          
          // Create another booking in the same slot - should succeed
          const booking2 = await workspaceRepo.createBooking({
            roomId: testRoomId,
            title: title2,
            organizerId: testOrganizerId,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
          
          expect(booking2.id).toBeDefined();
          
          // Clean up
          await query('DELETE FROM bookings WHERE id IN (?, ?)', [booking1.id, booking2.id]);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8d: Update conflict detection excludes current booking
   * 
   * When updating a booking's time, the conflict check should exclude the booking being updated.
   */
  it('Property 8d: Update conflict detection excludes current booking', async () => {
    const baseDate = new Date('2025-01-15');
    
    await fc.assert(
      fc.asyncProperty(
        validTitleArb,
        hourArb,
        durationArb,
        async (title, startHour, duration) => {
          // Create a booking
          const slot = generateTimeSlot(baseDate, startHour, duration);
          
          const booking = await workspaceRepo.createBooking({
            roomId: testRoomId,
            title: title,
            organizerId: testOrganizerId,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
          
          // Check for conflict with the same time slot, excluding this booking
          const conflictDetected = await workspaceRepo.hasBookingConflict(
            testRoomId,
            slot.startTime,
            slot.endTime,
            booking.id // Exclude this booking
          );
          
          // Should not detect conflict with itself
          expect(conflictDetected).toBe(false);
          
          // Clean up
          await query('DELETE FROM bookings WHERE id = ?', [booking.id]);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8e: Edge case - bookings that touch but don't overlap
   * 
   * A booking that ends exactly when another starts should not be a conflict.
   */
  it('Property 8e: Adjacent bookings (end time = start time) are allowed', async () => {
    const baseDate = new Date('2025-01-15');
    
    await fc.assert(
      fc.asyncProperty(
        validTitleArb,
        validTitleArb,
        hourArb,
        durationArb,
        async (title1, title2, startHour, duration) => {
          const adjustedStartHour = Math.min(startHour, 20);
          const adjustedDuration = Math.min(duration, 60);
          
          // Create first booking
          const slot1 = generateTimeSlot(baseDate, adjustedStartHour, adjustedDuration);
          
          const booking1 = await workspaceRepo.createBooking({
            roomId: testRoomId,
            title: title1,
            organizerId: testOrganizerId,
            startTime: slot1.startTime,
            endTime: slot1.endTime,
          });
          
          // Create second booking that starts exactly when the first ends
          const slot2Start = slot1.endTime; // Exactly the same time
          const slot2End = formatMySQLDateTime(new Date(new Date(slot2Start.replace(' ', 'T')).getTime() + adjustedDuration * 60000));
          
          // Verify no conflict is detected (adjacent, not overlapping)
          const conflictDetected = await workspaceRepo.hasBookingConflict(
            testRoomId,
            slot2Start,
            slot2End
          );
          
          expect(conflictDetected).toBe(false);
          
          // Create the second booking - should succeed
          const booking2 = await workspaceRepo.createBooking({
            roomId: testRoomId,
            title: title2,
            organizerId: testOrganizerId,
            startTime: slot2Start,
            endTime: slot2End,
          });
          
          expect(booking2.id).toBeDefined();
          
          // Clean up
          await query('DELETE FROM bookings WHERE id IN (?, ?)', [booking1.id, booking2.id]);
        }
      ),
      { numRuns: 50 }
    );
  });
});
