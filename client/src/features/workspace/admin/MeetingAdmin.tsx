import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { Users, Clock, MapPin, Video, Plus, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useMeetingRooms, CreateMeetingRoomData, UpdateMeetingRoomData } from '../../../hooks/useMeetingRooms';
import { useBookings } from '../../../hooks/useBookings';
import { useUsers } from '../../../hooks/useUsers';
import { MeetingRoom } from '../../../../../shared/types';
import { RoomModal } from '../shared/RoomModal';

export const MeetingAdmin = () => {
    const [view, setView] = useState<'rooms' | 'schedule' | 'calendar'>('rooms');
    const { 
        rooms, 
        loading: roomsLoading, 
        error: roomsError, 
        refetch: refetchRooms,
        createRoom,
        updateRoom,
        deleteRoom,
    } = useMeetingRooms();
    const { bookings, loading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = useBookings();
    const { users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();
    
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loading = roomsLoading || bookingsLoading || usersLoading;
    const error = roomsError || bookingsError || usersError;

    const handleRetry = () => {
        if (roomsError) refetchRooms();
        if (bookingsError) refetchBookings();
        if (usersError) refetchUsers();
    };

    const getRoomStatus = (roomId: string) => {
        const now = new Date(); // Use actual current time
        const currentBooking = bookings.find(b =>
            b.roomId === roomId &&
            new Date(b.startTime) <= now &&
            new Date(b.endTime) >= now
        );
        return currentBooking ? 'BOOKED' : 'AVAILABLE';
    };

    const getCurrentBooking = (roomId: string) => {
        const now = new Date(); // Use actual current time
        return bookings.find(b =>
            b.roomId === roomId &&
            new Date(b.startTime) <= now &&
            new Date(b.endTime) >= now
        );
    };

    const getUpcomingBookings = (roomId: string) => {
        const now = new Date(); // Use actual current time
        return bookings
            .filter(b => b.roomId === roomId && new Date(b.startTime) > now)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    };

    // Calendar Helpers - Generate week days based on current week
    const getWeekDays = () => {
        const now = new Date();
        const currentDay = now.getDay();
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysFromMonday);
        monday.setHours(0, 0, 0, 0);
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((day, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            const dayNum = date.getDate().toString().padStart(2, '0');
            return `${day} ${dayNum}`;
        });
    };
    const weekDays = getWeekDays();
    const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00

    const getBookingsForSlot = (dayIndex: number, hour: number) => {
        // Calculate date based on current week
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Convert to Monday = 0
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysFromMonday);
        monday.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + dayIndex);
        const dateStr = targetDate.toISOString().split('T')[0];

        return bookings.filter(b => {
            const start = new Date(b.startTime);
            const bookingDate = start.toISOString().split('T')[0];
            const bookingHour = start.getHours();
            return bookingDate === dateStr && bookingHour === hour;
        });
    };

    const handleSaveRoom = async (roomData: CreateMeetingRoomData | MeetingRoom) => {
        setIsSaving(true);
        try {
            if (editingRoom) {
                // Update existing room
                const updateData: UpdateMeetingRoomData = {
                    name: roomData.name,
                    capacity: roomData.capacity,
                    type: roomData.type,
                    location: roomData.location,
                    status: roomData.status,
                    image: roomData.image,
                    meetingUrl: roomData.meetingUrl,
                    platform: roomData.platform,
                    amenities: roomData.amenities,
                };
                await updateRoom(editingRoom.id, updateData);
            } else {
                // Create new room
                const createData: CreateMeetingRoomData = {
                    name: roomData.name,
                    capacity: roomData.capacity,
                    type: roomData.type,
                    location: roomData.location,
                    status: roomData.status,
                    image: roomData.image,
                    meetingUrl: roomData.meetingUrl,
                    platform: roomData.platform,
                    amenities: roomData.amenities,
                };
                await createRoom(createData);
            }
            setEditingRoom(null);
            setIsRoomModalOpen(false);
        } catch (err) {
            console.error('Error saving room:', err);
            alert('Không thể lưu phòng họp. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (room: MeetingRoom) => {
        setEditingRoom(room);
        setIsRoomModalOpen(true);
    };

    const handleDeleteClick = async (roomId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
            try {
                await deleteRoom(roomId);
            } catch (err) {
                console.error('Error deleting room:', err);
                alert('Không thể xóa phòng họp. Vui lòng thử lại.');
            }
        }
    };

    if (loading) {
        return <LoadingSpinner size="lg" text="Đang tải dữ liệu phòng họp..." />;
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={handleRetry} />;
    }

    return (
        <div className="animate-fadeIn space-y-6">
            <RoomModal
                isOpen={isRoomModalOpen}
                onClose={() => { setIsRoomModalOpen(false); setEditingRoom(null); }}
                onSave={handleSaveRoom}
                initialData={editingRoom}
                isSaving={isSaving}
            />

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Quản trị Phòng họp</h2>
                    <p className="text-slate-500 text-sm">Quản lý danh sách phòng và lịch đặt chỗ.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white border border-slate-200 rounded-lg p-1 flex">
                        <button
                            onClick={() => setView('rooms')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'rooms' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Danh sách phòng
                        </button>
                        <button
                            onClick={() => setView('schedule')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'schedule' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Lịch đặt chỗ
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'calendar' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Lịch tuần
                        </button>
                    </div>
                    <Button onClick={() => setIsRoomModalOpen(true)}><Plus size={18} className="mr-2" /> Thêm phòng</Button>
                </div>
            </div>

            {view === 'rooms' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map((room) => {
                        const status = getRoomStatus(room.id);
                        const currentBooking = getCurrentBooking(room.id);
                        const upcoming = getUpcomingBookings(room.id);

                        return (
                            <div key={room.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
                                <div className="h-32 bg-slate-100 relative">
                                    <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-sm ${status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {status === 'AVAILABLE' ? 'Đang trống' : 'Đang họp'}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-3 left-3">
                                        <div className={`px-2 py-1 rounded-lg bg-white/90 backdrop-blur text-slate-700 shadow-sm flex items-center gap-1 text-xs font-semibold`}>
                                            {room.type === 'VIRTUAL' ? <Video size={14} /> : <MapPin size={14} />}
                                            {room.platform || (room.type === 'VIRTUAL' ? 'Online' : 'Vật lý')}
                                        </div>
                                    </div>

                                    {/* Admin Actions Overlay */}
                                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                        <Button size="sm" variant="outline" className="bg-white text-slate-700 border-white hover:bg-slate-100" onClick={() => handleEditClick(room)}>
                                            <Edit2 size={16} className="mr-2" /> Sửa
                                        </Button>
                                        <Button size="sm" variant="outline" className="bg-white text-red-600 border-white hover:bg-red-50" onClick={() => handleDeleteClick(room.id)}>
                                            <Trash2 size={16} className="mr-2" /> Xóa
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 leading-tight">{room.name}</h3>
                                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                                {room.location} • {room.capacity} chỗ
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3 flex-1">
                                        {currentBooking ? (
                                            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                                                <p className="text-xs font-bold text-red-800 uppercase mb-1">Đang diễn ra</p>
                                                <p className="text-sm font-semibold text-slate-900 truncate">{currentBooking.title}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                                                    <Clock size={12} />
                                                    <span>{new Date(currentBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(currentBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                                                <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                                                    <Clock size={16} /> Hiện đang trống
                                                </p>
                                            </div>
                                        )}

                                        {upcoming.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Sắp tới</p>
                                                <div className="space-y-2">
                                                    {upcoming.slice(0, 2).map(b => (
                                                        <div key={b.id} className="flex items-center gap-3 text-sm">
                                                            <span className="font-mono text-slate-500 text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                                                                {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className="text-slate-700 truncate flex-1">{b.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                                        {room.type === 'VIRTUAL' && room.meetingUrl ? (
                                            <Button className="flex-1 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => window.open(room.meetingUrl, '_blank')}>
                                                <Video size={14} className="mr-2" /> Tham gia ngay
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="flex-1 text-xs">Lịch chi tiết</Button>
                                        )}
                                        <Button variant="ghost" className="px-2" onClick={() => handleEditClick(room)}><MoreHorizontal size={16} /></Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {view === 'schedule' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">Lịch đặt phòng hôm nay ({new Date().toLocaleDateString('vi-VN')})</h3>
                        <div className="flex gap-2">
                            <input type="date" className="text-sm border border-slate-300 rounded-md px-2 py-1" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {bookings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map(booking => {
                            const room = rooms.find(r => r.id === booking.roomId);
                            const organizer = users.find(u => u.id === booking.organizerId);

                            return (
                                <div key={booking.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                                    <div className="flex flex-col items-center min-w-[80px]">
                                        <span className="text-lg font-bold text-slate-900">
                                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="w-1 h-12 rounded-full bg-brand-200"></div>

                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900">{booking.title}</h4>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-sm text-slate-600 flex items-center gap-1">
                                                <MapPin size={14} className="text-slate-400" /> {room?.name}
                                            </span>
                                            <span className="text-sm text-slate-600 flex items-center gap-1">
                                                <Users size={14} className="text-slate-400" /> {booking.participants.length} người
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {room?.type === 'VIRTUAL' && room.meetingUrl && (
                                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => window.open(room.meetingUrl, '_blank')}>
                                                <Video size={14} className="mr-1" /> Join
                                            </Button>
                                        )}
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-medium text-slate-900">{organizer?.fullName}</p>
                                            <p className="text-xs text-slate-500">Người tổ chức</p>
                                        </div>
                                        <img src={organizer?.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                                    </div>
                                </div>
                            );
                        })}
                        {bookings.length === 0 && (
                            <div className="p-8 text-center text-slate-500">Chưa có lịch đặt phòng nào.</div>
                        )}
                    </div>
                </div>
            )}

            {view === 'calendar' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-slate-900">{new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</h3>
                            <div className="flex gap-1">
                                <button className="p-1 hover:bg-slate-100 rounded"><Clock size={16} className="rotate-180" /></button>
                                <button className="p-1 hover:bg-slate-100 rounded"><Clock size={16} /></button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select className="text-sm border border-slate-300 rounded-md px-2 py-1">
                                <option>Tất cả phòng</option>
                                {rooms.map(r => <option key={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Header Row */}
                            <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
                                <div className="p-3 text-xs font-semibold text-slate-500 text-center border-r border-slate-200">Time</div>
                                {weekDays.map((day, i) => (
                                    <div key={i} className={`p-3 text-sm font-semibold text-slate-700 text-center border-r border-slate-200 ${i === 1 ? 'bg-blue-50 text-brand-600' : ''}`}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Time Slots */}
                            {timeSlots.map(hour => (
                                <div key={hour} className="grid grid-cols-8 border-b border-slate-100 h-24">
                                    <div className="p-2 text-xs text-slate-400 text-center border-r border-slate-200 relative">
                                        <span className="-top-2 relative">{hour}:00</span>
                                    </div>
                                    {weekDays.map((_, dayIndex) => {
                                        const slotBookings = getBookingsForSlot(dayIndex, hour);
                                        return (
                                            <div key={dayIndex} className="border-r border-slate-100 relative p-1 group hover:bg-slate-50 transition-colors">
                                                {slotBookings.map(b => (
                                                    <div key={b.id} className="absolute inset-x-1 top-1 bottom-1 bg-brand-100 border border-brand-200 rounded p-1.5 overflow-hidden cursor-pointer hover:bg-brand-200 transition-colors z-10">
                                                        <div className="text-xs font-bold text-brand-700 truncate">{b.title}</div>
                                                        <div className="text-[10px] text-brand-600 truncate">
                                                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
