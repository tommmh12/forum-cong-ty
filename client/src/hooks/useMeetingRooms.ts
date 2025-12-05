import { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../services/api';
import { MeetingRoom } from '../../../shared/types';
import { useApiError } from './useApiError';

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

interface UseMeetingRoomsResult {
  rooms: MeetingRoom[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchRoomById: (id: string) => Promise<MeetingRoom>;
  createRoom: (data: CreateMeetingRoomData) => Promise<MeetingRoom>;
  updateRoom: (id: string, data: UpdateMeetingRoomData) => Promise<MeetingRoom>;
  deleteRoom: (id: string) => Promise<void>;
}

/**
 * Hook for fetching and managing meeting rooms data
 * Implements:
 * - fetchRooms from GET /api/meeting-rooms (Requirements 7.1)
 * - fetchRoomById from GET /api/meeting-rooms/:id (Requirements 7.2)
 * - createRoom from POST /api/meeting-rooms
 * - updateRoom from PUT /api/meeting-rooms/:id
 * - deleteRoom from DELETE /api/meeting-rooms/:id
 */
export function useMeetingRooms(): UseMeetingRoomsResult {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  /**
   * Fetch all meeting rooms
   * GET /api/meeting-rooms
   */
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const data = await get<MeetingRoom[]>('/meeting-rooms');
      setRooms(data);
    } catch (err) {
      handleError(err, fetchRooms);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  /**
   * Fetch a single meeting room by ID
   * GET /api/meeting-rooms/:id
   */
  const fetchRoomById = useCallback(async (id: string): Promise<MeetingRoom> => {
    try {
      const room = await get<MeetingRoom>(`/meeting-rooms/${id}`);
      return room;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  /**
   * Create a new meeting room
   * POST /api/meeting-rooms
   */
  const createRoom = useCallback(async (data: CreateMeetingRoomData): Promise<MeetingRoom> => {
    try {
      const room = await post<MeetingRoom>('/meeting-rooms', data);
      setRooms(prev => [...prev, room]);
      return room;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  /**
   * Update an existing meeting room
   * PUT /api/meeting-rooms/:id
   */
  const updateRoom = useCallback(async (id: string, data: UpdateMeetingRoomData): Promise<MeetingRoom> => {
    try {
      const room = await put<MeetingRoom>(`/meeting-rooms/${id}`, data);
      setRooms(prev => prev.map(r => r.id === id ? room : r));
      return room;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  /**
   * Delete a meeting room
   * DELETE /api/meeting-rooms/:id
   */
  const deleteRoom = useCallback(async (id: string): Promise<void> => {
    try {
      await del(`/meeting-rooms/${id}`);
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { 
    rooms, 
    loading, 
    error: userMessage, 
    refetch: fetchRooms, 
    fetchRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
  };
}

export default useMeetingRooms;
