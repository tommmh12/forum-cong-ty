export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  type: 'PHYSICAL' | 'VIRTUAL';
  location: string;
  status: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';
  amenities: string[];
  image?: string;
  meetingUrl?: string;
  platform?: string;
}

export interface Booking {
  id: string;
  roomId: string;
  title: string;
  organizerId: string;
  startTime: string;
  endTime: string;
  participants: string[];
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  meetingUrl?: string;
}
