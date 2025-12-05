import { query } from '../config/database';
import { MeetingRoom, Booking } from '../../../shared/types';

// Meeting Room Repository
export interface MeetingRoomRow {
  id: string;
  name: string;
  capacity: number;
  type: 'PHYSICAL' | 'VIRTUAL';
  location: string;
  status: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';
  image: string;
  meeting_url: string | null;
  platform: string | null;
}

export interface RoomAmenityRow {
  id: string;
  room_id: string;
  amenity: string;
}

export async function findAllMeetingRooms(): Promise<MeetingRoom[]> {
  const rooms = await query<MeetingRoomRow[]>('SELECT * FROM meeting_rooms');
  const amenities = await query<RoomAmenityRow[]>('SELECT * FROM room_amenities');
  
  return rooms.map(room => ({
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    type: room.type,
    location: room.location,
    status: room.status,
    image: room.image,
    meetingUrl: room.meeting_url || undefined,
    platform: room.platform || undefined,
    amenities: amenities.filter(a => a.room_id === room.id).map(a => a.amenity),
  }));
}

export async function findMeetingRoomById(id: string): Promise<MeetingRoom | null> {
  const rooms = await query<MeetingRoomRow[]>('SELECT * FROM meeting_rooms WHERE id = ?', [id]);
  if (rooms.length === 0) return null;
  
  const amenities = await query<RoomAmenityRow[]>(
    'SELECT * FROM room_amenities WHERE room_id = ?',
    [id]
  );
  
  const room = rooms[0];
  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    type: room.type,
    location: room.location,
    status: room.status,
    image: room.image,
    meetingUrl: room.meeting_url || undefined,
    platform: room.platform || undefined,
    amenities: amenities.map(a => a.amenity),
  };
}

// Meeting Room CRUD Operations
export interface CreateMeetingRoomData {
  name: string;
  capacity: number;
  type: 'PHYSICAL' | 'VIRTUAL';
  location?: string;
  status?: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';
  image?: string;
  meetingUrl?: string;
  platform?: string;
  amenities?: string[];
}

export async function createMeetingRoom(data: CreateMeetingRoomData): Promise<MeetingRoom> {
  const id = `room-${Date.now()}`;
  const status = data.status || 'AVAILABLE';
  const image = data.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400';
  
  await query(
    `INSERT INTO meeting_rooms (id, name, capacity, type, location, status, image, meeting_url, platform)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.capacity, data.type, data.location || '', status, image, data.meetingUrl || null, data.platform || null]
  );
  
  // Insert amenities if provided
  if (data.amenities && data.amenities.length > 0) {
    for (const amenity of data.amenities) {
      const amenityId = `amenity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await query(
        'INSERT INTO room_amenities (id, room_id, amenity) VALUES (?, ?, ?)',
        [amenityId, id, amenity]
      );
    }
  }
  
  return {
    id,
    name: data.name,
    capacity: data.capacity,
    type: data.type,
    location: data.location || '',
    status,
    image,
    meetingUrl: data.meetingUrl,
    platform: data.platform,
    amenities: data.amenities || [],
  };
}

export interface UpdateMeetingRoomData {
  name?: string;
  capacity?: number;
  type?: 'PHYSICAL' | 'VIRTUAL';
  location?: string;
  status?: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';
  image?: string;
  meetingUrl?: string;
  platform?: string;
  amenities?: string[];
}

export async function updateMeetingRoom(id: string, data: UpdateMeetingRoomData): Promise<MeetingRoom | null> {
  // Check if room exists
  const existingRooms = await query<MeetingRoomRow[]>('SELECT * FROM meeting_rooms WHERE id = ?', [id]);
  if (existingRooms.length === 0) return null;
  
  // Build update query dynamically
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.capacity !== undefined) {
    updates.push('capacity = ?');
    values.push(data.capacity);
  }
  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
  }
  if (data.location !== undefined) {
    updates.push('location = ?');
    values.push(data.location);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }
  if (data.image !== undefined) {
    updates.push('image = ?');
    values.push(data.image);
  }
  if (data.meetingUrl !== undefined) {
    updates.push('meeting_url = ?');
    values.push(data.meetingUrl || null);
  }
  if (data.platform !== undefined) {
    updates.push('platform = ?');
    values.push(data.platform || null);
  }
  
  if (updates.length > 0) {
    values.push(id);
    await query(`UPDATE meeting_rooms SET ${updates.join(', ')} WHERE id = ?`, values);
  }
  
  // Update amenities if provided
  if (data.amenities !== undefined) {
    // Remove existing amenities
    await query('DELETE FROM room_amenities WHERE room_id = ?', [id]);
    
    // Add new amenities
    for (const amenity of data.amenities) {
      const amenityId = `amenity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await query(
        'INSERT INTO room_amenities (id, room_id, amenity) VALUES (?, ?, ?)',
        [amenityId, id, amenity]
      );
    }
  }
  
  // Fetch and return updated room
  return findMeetingRoomById(id);
}

export async function deleteMeetingRoom(id: string): Promise<boolean> {
  // Check if room exists
  const existingRooms = await query<MeetingRoomRow[]>('SELECT * FROM meeting_rooms WHERE id = ?', [id]);
  if (existingRooms.length === 0) return false;
  
  // Delete amenities first (foreign key constraint)
  await query('DELETE FROM room_amenities WHERE room_id = ?', [id]);
  
  // Delete any bookings for this room
  await query('DELETE FROM booking_participants WHERE booking_id IN (SELECT id FROM bookings WHERE room_id = ?)', [id]);
  await query('DELETE FROM bookings WHERE room_id = ?', [id]);
  
  // Delete the room
  await query('DELETE FROM meeting_rooms WHERE id = ?', [id]);
  
  return true;
}

// Booking Repository
export interface BookingRow {
  id: string;
  room_id: string;
  title: string;
  organizer_id: string;
  start_time: string;
  end_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

export interface BookingParticipantRow {
  id: string;
  booking_id: string;
  user_id: string;
}

export async function findAllBookings(): Promise<Booking[]> {
  const bookings = await query<BookingRow[]>('SELECT * FROM bookings');
  const participants = await query<BookingParticipantRow[]>('SELECT * FROM booking_participants');
  
  return bookings.map(booking => ({
    id: booking.id,
    roomId: booking.room_id,
    title: booking.title,
    organizerId: booking.organizer_id,
    startTime: booking.start_time,
    endTime: booking.end_time,
    status: booking.status,
    participants: participants
      .filter(p => p.booking_id === booking.id)
      .map(p => p.user_id),
  }));
}

export async function findBookingsByRoomId(roomId: string): Promise<Booking[]> {
  const bookings = await query<BookingRow[]>(
    'SELECT * FROM bookings WHERE room_id = ?',
    [roomId]
  );
  const participants = await query<BookingParticipantRow[]>('SELECT * FROM booking_participants');
  
  return bookings.map(booking => ({
    id: booking.id,
    roomId: booking.room_id,
    title: booking.title,
    organizerId: booking.organizer_id,
    startTime: booking.start_time,
    endTime: booking.end_time,
    status: booking.status,
    participants: participants
      .filter(p => p.booking_id === booking.id)
      .map(p => p.user_id),
  }));
}

export interface CreateBookingData {
  roomId: string;
  title: string;
  organizerId: string;
  startTime: string;
  endTime: string;
  participants?: string[];
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

/**
 * Check if a booking conflicts with existing bookings for the same room.
 * Two bookings conflict if they overlap in time for the same room.
 * Only considers non-cancelled bookings.
 * 
 * @param roomId - The room to check
 * @param startTime - Start time of the proposed booking
 * @param endTime - End time of the proposed booking
 * @param excludeBookingId - Optional booking ID to exclude (for updates)
 * @returns true if there is a conflict, false otherwise
 */
export async function hasBookingConflict(
  roomId: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<boolean> {
  // Query for overlapping bookings:
  // Two time ranges [A_start, A_end] and [B_start, B_end] overlap if:
  // A_start < B_end AND A_end > B_start
  const sql = `
    SELECT COUNT(*) as count FROM bookings 
    WHERE room_id = ? 
    AND status != 'CANCELLED'
    AND start_time < ?
    AND end_time > ?
    ${excludeBookingId ? 'AND id != ?' : ''}
  `;
  
  const params = excludeBookingId 
    ? [roomId, endTime, startTime, excludeBookingId]
    : [roomId, endTime, startTime];
  
  const result = await query<{ count: number }[]>(sql, params);
  return result[0].count > 0;
}

/**
 * Find all conflicting bookings for a given time range and room.
 * 
 * @param roomId - The room to check
 * @param startTime - Start time of the proposed booking
 * @param endTime - End time of the proposed booking
 * @param excludeBookingId - Optional booking ID to exclude (for updates)
 * @returns Array of conflicting bookings
 */
export async function findConflictingBookings(
  roomId: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<Booking[]> {
  const sql = `
    SELECT * FROM bookings 
    WHERE room_id = ? 
    AND status != 'CANCELLED'
    AND start_time < ?
    AND end_time > ?
    ${excludeBookingId ? 'AND id != ?' : ''}
  `;
  
  const params = excludeBookingId 
    ? [roomId, endTime, startTime, excludeBookingId]
    : [roomId, endTime, startTime];
  
  const bookings = await query<BookingRow[]>(sql, params);
  const participants = await query<BookingParticipantRow[]>('SELECT * FROM booking_participants');
  
  return bookings.map(booking => ({
    id: booking.id,
    roomId: booking.room_id,
    title: booking.title,
    organizerId: booking.organizer_id,
    startTime: booking.start_time,
    endTime: booking.end_time,
    status: booking.status,
    participants: participants
      .filter(p => p.booking_id === booking.id)
      .map(p => p.user_id),
  }));
}

export async function createBooking(data: CreateBookingData): Promise<Booking> {
  const id = `booking-${Date.now()}`;
  const status = data.status || 'PENDING';
  
  await query(
    `INSERT INTO bookings (id, room_id, title, organizer_id, start_time, end_time, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.roomId, data.title, data.organizerId, data.startTime, data.endTime, status]
  );
  
  // Insert participants if provided
  if (data.participants && data.participants.length > 0) {
    for (const userId of data.participants) {
      const participantId = `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await query(
        'INSERT INTO booking_participants (id, booking_id, user_id) VALUES (?, ?, ?)',
        [participantId, id, userId]
      );
    }
  }
  
  return {
    id,
    roomId: data.roomId,
    title: data.title,
    organizerId: data.organizerId,
    startTime: data.startTime,
    endTime: data.endTime,
    status,
    participants: data.participants || [],
  };
}

export interface UpdateBookingData {
  title?: string;
  startTime?: string;
  endTime?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  participants?: string[];
}

export async function updateBooking(id: string, data: UpdateBookingData): Promise<Booking | null> {
  // First check if booking exists
  const existingBookings = await query<BookingRow[]>('SELECT * FROM bookings WHERE id = ?', [id]);
  if (existingBookings.length === 0) return null;
  
  const existing = existingBookings[0];
  
  // Build update query dynamically
  const updates: string[] = [];
  const values: (string | undefined)[] = [];
  
  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.startTime !== undefined) {
    updates.push('start_time = ?');
    values.push(data.startTime);
  }
  if (data.endTime !== undefined) {
    updates.push('end_time = ?');
    values.push(data.endTime);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }
  
  if (updates.length > 0) {
    values.push(id);
    await query(`UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`, values);
  }
  
  // Update participants if provided
  if (data.participants !== undefined) {
    // Remove existing participants
    await query('DELETE FROM booking_participants WHERE booking_id = ?', [id]);
    
    // Add new participants
    for (const userId of data.participants) {
      const participantId = `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await query(
        'INSERT INTO booking_participants (id, booking_id, user_id) VALUES (?, ?, ?)',
        [participantId, id, userId]
      );
    }
  }
  
  // Fetch updated booking
  const updatedBookings = await query<BookingRow[]>('SELECT * FROM bookings WHERE id = ?', [id]);
  const participants = await query<BookingParticipantRow[]>(
    'SELECT * FROM booking_participants WHERE booking_id = ?',
    [id]
  );
  
  const booking = updatedBookings[0];
  return {
    id: booking.id,
    roomId: booking.room_id,
    title: booking.title,
    organizerId: booking.organizer_id,
    startTime: booking.start_time,
    endTime: booking.end_time,
    status: booking.status,
    participants: participants.map(p => p.user_id),
  };
}

export default {
  findAllMeetingRooms,
  findMeetingRoomById,
  createMeetingRoom,
  updateMeetingRoom,
  deleteMeetingRoom,
  findAllBookings,
  findBookingsByRoomId,
  createBooking,
  updateBooking,
  hasBookingConflict,
  findConflictingBookings,
};
