import React from 'react';
import { Users, Activity, HardDrive, AlertTriangle, Server, UserCog } from 'lucide-react';

export const Overview = () => {
  return (
    <div className="animate-fadeIn">
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h1>
            <p className="text-slate-500 mt-1">Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-sm font-medium">Tổng nhân sự</span>
                <div className="p-2 bg-blue-50 text-brand-600 rounded-lg">
                <Users size={20} />
                </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">1,248</div>
            <div className="text-xs text-green-600 font-medium flex items-center">
                +12% so với tháng trước
            </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-sm font-medium">Server Uptime</span>
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <Activity size={20} />
                </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">99.98%</div>
            <div className="text-xs text-slate-500 font-medium">
                Ổn định trong 30 ngày qua
            </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-sm font-medium">Lưu trữ (Storage)</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <HardDrive size={20} />
                </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">4.2 TB</div>
            <div className="text-xs text-slate-500 font-medium">
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                </div>
            </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-sm font-medium">Báo cáo chờ duyệt</span>
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <AlertTriangle size={20} />
                </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">3</div>
            <div className="text-xs text-red-600 font-medium cursor-pointer hover:underline">
                Xử lý ngay
            </div>
            </div>
        </div>

        {/* System Health / Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                    <Server size={18} className="mr-2 text-slate-400" />
                    Trạng thái Service
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm font-medium text-slate-700">Database Cluster</span>
                        </div>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm font-medium text-slate-700">API Gateway</span>
                        </div>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-sm font-medium text-slate-700">Email Service</span>
                        </div>
                        <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">High Latency</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm font-medium text-slate-700">Storage S3</span>
                        </div>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Healthy</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Hoạt động gần đây</h3>
                <div className="flow-root">
                    <ul className="-mb-8">
                        {[1, 2, 3].map((item, itemIdx) => (
                            <li key={itemIdx}>
                                <div className="relative pb-8">
                                    {itemIdx !== 2 ? (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true"></span>
                                    ) : null}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center ring-4 ring-white">
                                                <UserCog size={14} className="text-blue-600" />
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                            <div>
                                                <p className="text-sm text-slate-500">Admin <span className="font-medium text-slate-900">Minh Đức</span> đã cấp quyền truy cập cho <span className="font-medium text-slate-900">User #2938</span></p>
                                            </div>
                                            <div className="text-right text-xs whitespace-nowrap text-slate-400">
                                                {item}h ago
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    </div>
  );
};
