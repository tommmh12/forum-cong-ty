import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { X, Upload, MapPin, Video, Users, Monitor, Wifi, Coffee, Loader2 } from 'lucide-react';
import { MeetingRoom } from '../../../../../shared/types';
import { CreateMeetingRoomData } from '../../../hooks/useMeetingRooms';

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (room: CreateMeetingRoomData | MeetingRoom) => void;
    initialData?: MeetingRoom | null;
    isSaving?: boolean;
}

export const RoomModal = ({ isOpen, onClose, onSave, initialData, isSaving = false }: RoomModalProps) => {
    const [formData, setFormData] = useState<Partial<MeetingRoom>>({
        name: '',
        capacity: 10,
        type: 'PHYSICAL',
        location: '',
        status: 'AVAILABLE',
        amenities: [],
        image: '',
        platform: 'Zoom',
        meetingUrl: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                capacity: 10,
                type: 'PHYSICAL',
                location: '',
                status: 'AVAILABLE',
                amenities: [],
                image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400', // Default image
                platform: 'Zoom',
                meetingUrl: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (field: keyof MeetingRoom, value: string | number | string[]) => {
        setFormData((prev: Partial<MeetingRoom>) => ({ ...prev, [field]: value }));
    };

    const toggleAmenity = (amenity: string) => {
        setFormData((prev: Partial<MeetingRoom>) => {
            const current = prev.amenities || [];
            return {
                ...prev,
                amenities: current.includes(amenity)
                    ? current.filter((a: string) => a !== amenity)
                    : [...current, amenity]
            };
        });
    };

    const handleSubmit = () => {
        if (!formData.name || isSaving) return;
        
        if (initialData) {
            // Editing existing room - include id
            onSave({
                ...formData,
                id: initialData.id,
            } as MeetingRoom);
        } else {
            // Creating new room - send as CreateMeetingRoomData
            onSave({
                name: formData.name!,
                capacity: formData.capacity!,
                type: formData.type!,
                location: formData.location,
                status: formData.status,
                image: formData.image,
                meetingUrl: formData.meetingUrl,
                platform: formData.platform,
                amenities: formData.amenities,
            });
        }
    };

    const AMENITIES_OPTIONS = [
        { id: 'TV', label: 'Màn hình TV', icon: Monitor },
        { id: 'Whiteboard', label: 'Bảng trắng', icon: Users },
        { id: 'Video Conf', label: 'Video Conference', icon: Video },
        { id: 'Wifi', label: 'Wifi tốc độ cao', icon: Wifi },
        { id: 'Coffee', label: 'Trà & Cà phê', icon: Coffee },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">
                        {initialData ? 'Cập nhật phòng họp' : 'Thêm phòng họp mới'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tên phòng <span className="text-red-500">*</span></label>
                            <input
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="VD: Phòng họp Galaxy..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Loại phòng</label>
                            <select
                                value={formData.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                            >
                                <option value="PHYSICAL">Phòng vật lý</option>
                                <option value="VIRTUAL">Phòng họp Online</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Sức chứa (người)</label>
                            <input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>

                        {formData.type === 'PHYSICAL' ? (
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Vị trí</label>
                                <div className="relative">
                                    <input
                                        value={formData.location}
                                        onChange={(e) => handleChange('location', e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="VD: Tầng 12, Khu A..."
                                    />
                                    <MapPin size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nền tảng</label>
                                    <select
                                        value={formData.platform}
                                        onChange={(e) => handleChange('platform', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                                    >
                                        <option value="Zoom">Zoom</option>
                                        <option value="Google Meet">Google Meet</option>
                                        <option value="Microsoft Teams">Microsoft Teams</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Link họp cố định</label>
                                    <input
                                        value={formData.meetingUrl}
                                        onChange={(e) => handleChange('meetingUrl', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                            </>
                        )}

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Tiện ích</label>
                            <div className="flex flex-wrap gap-2">
                                {AMENITIES_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => toggleAmenity(opt.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${formData.amenities?.includes(opt.id)
                                                ? 'bg-brand-50 border-brand-200 text-brand-700 font-medium'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <opt.icon size={16} /> {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Hình ảnh</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-brand-300 transition-all cursor-pointer">
                                <Upload size={24} className="mb-2" />
                                <span className="text-xs">Kéo thả ảnh hoặc click để tải lên</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>Hủy bỏ</Button>
                    <Button onClick={handleSubmit} disabled={isSaving || !formData.name}>
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            'Lưu thông tin'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
