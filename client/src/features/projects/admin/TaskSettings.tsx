import React, { useState } from 'react';
import { Tag, Edit2, Plus } from 'lucide-react';

export const TaskSettings = () => {
    const [priorities] = useState([
        { id: '1', name: 'Critical (Khẩn cấp)', color: 'bg-red-600', slaHours: 4 },
        { id: '2', name: 'High (Cao)', color: 'bg-orange-500', slaHours: 24 },
        { id: '3', name: 'Medium (Trung bình)', color: 'bg-blue-500', slaHours: 48 },
    ]);

    const [tags] = useState([
        { id: '1', name: 'Marketing', color: 'bg-pink-100 text-pink-800' },
        { id: '2', name: 'Backend', color: 'bg-indigo-100 text-indigo-800' },
        { id: '3', name: 'Urgent', color: 'bg-red-100 text-red-800' },
    ]);

    return (
        <div className="animate-fadeIn space-y-8">
            <div>
                 <h1 className="text-2xl font-bold text-slate-900 mb-6">Cấu hình chung</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Priorities */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">Độ ưu tiên & SLA</h3>
                        <button className="text-brand-600 text-xs font-semibold hover:underline">Thêm mới</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {priorities.map((p) => (
                            <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${p.color}`}></div>
                                    <div>
                                        <div className="font-medium text-slate-900">{p.name}</div>
                                        <div className="text-xs text-slate-500">SLA: {p.slaHours} giờ</div>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600"><Edit2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tags */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900">Nhãn dán (Tags)</h3>
                        <button className="text-brand-600 text-xs font-semibold hover:underline">Quản lý</button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {tags.map((tag) => (
                            <span key={tag.id} className={`${tag.color} px-3 py-1.5 rounded-full text-sm font-medium flex items-center`}>
                                <Tag size={14} className="mr-2 opacity-50" />
                                {tag.name}
                            </span>
                        ))}
                        <button className="px-3 py-1.5 rounded-full border border-slate-300 border-dashed text-slate-500 text-sm font-medium hover:text-brand-600 flex items-center">
                            <Plus size={14} className="mr-1" /> Thêm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
