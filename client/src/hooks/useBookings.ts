import { useState, useEffect, useCallback } from 'react';
import { get, post, put } from '../services/api';
import { Booking } from '../../../shared/types';
import { useApiError } from './useApiError';

export interface CreateBookingData {
  roomId: string;
  title: string;
  organizerId: string;
  startTime: string;
  endTime: string;
  participants?: string[];
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

export interface UpdateBookingData {
  title?: string;
  startTime?: string;
  endTime?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  participants?: string[];
}

interface UseBookingsResult {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createBooking: (data: CreateBookingData) => Promise<Booking>;
  updateBooking: (id: string, data: UpdateBookingData) => Promise<Booking>;
  fetchRoomBookings: (roomId: string) => Promise<Booking[]>;
}

export function useBookings(): UseBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const data = await get<Booking[]>('/bookings');
      setBookings(data);
    } catch (err) {
      handleError(err, fetchBookings);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  const createBooking = useCallback(async (data: CreateBookingData): Promise<Booking> => {
    try {
      const booking = await post<Booking>('/bookings', data);
      setBookings(prev => [...prev, booking]);
      return booking;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const updateBooking = useCallback(async (id: string, data: UpdateBookingData): Promise<Booking> => {
    try {
      const booking = await put<Booking>(`/bookings/${id}`, data);
      setBookings(prev => prev.map(b => b.id === id ? booking : b));
      return booking;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const fetchRoomBookings = useCallback(async (roomId: string): Promise<Booking[]> => {
    try {
      const roomBookings = await get<Booking[]>(`/meeting-rooms/${roomId}/bookings`);
      return roomBookings;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { 
    bookings, 
    loading, 
    error: userMessage, 
    refetch: fetchBookings,
    createBooking,
    updateBooking,
    fetchRoomBookings,
  };
}

export default useBookings;
