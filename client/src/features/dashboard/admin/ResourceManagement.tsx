import React from 'react';
import { Clock, Download, Cpu, Activity, Wifi, AlertTriangle, ArrowDownRight, ArrowUpRight, Server, Database } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

const ServerNode = ({ name, ip, cpu, ram, status, role }: { name: string, ip: string, cpu: number, ram: number, status: 'online' | 'warning' | 'error', role: string }) => {
    return (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${role === 'Database' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {role === 'Database' ? <Database size={18} /> : <Server size={18} />}
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{name}</h4>
                        <p className="text-xs text-slate-500 font-mono">{ip}</p>
                    </div>
                </div>
                <div className={`h-2.5 w-2.5 rounded-full ${
                    status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 
                    status === 'warning' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                }`}></div>
            </div>

            <div className="space-y-3 mt-4">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 flex items-center gap-1"><Cpu size={12}/> CPU</span>
                        <span className={`font-medium ${cpu > 80 ? 'text-red-600' : 'text-slate-700'}`}>{cpu}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${cpu > 80 ? 'bg-red-500' : cpu > 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                            style={{ width: `${cpu}%` }}
                        ></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 flex items-center gap-1"><Activity size={12}/> RAM</span>
                        <span className={`font-medium ${ram > 80 ? 'text-red-600' : 'text-slate-700'}`}>{ram}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div 
                             className={`h-1.5 rounded-full transition-all duration-500 ${ram > 80 ? 'bg-red-500' : ram > 60 ? 'bg-purple-500' : 'bg-green-500'}`} 
                             style={{ width: `${ram}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const ResourceManagement = () => {
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tài nguyên & Hiệu suất</h1>
                    <p className="text-slate-500 mt-1">Giám sát hạ tầng máy chủ và trạng thái dịch vụ thời gian thực</p>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" className="text-xs"><Clock size={14} className="mr-2"/> 24 giờ qua</Button>
                     <Button variant="primary" className="text-xs"><Download size={14} className="mr-2"/> Xuất báo cáo</Button>
                </div>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Cpu size={18} /></div>
                        <span className="text-sm font-medium text-slate-500">Avg CPU Load</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">42%</div>
                    <div className="text-xs text-green-600 flex items-center mt-1"><ArrowDownRight size={14} className="mr-1"/> Giảm 5% so với hôm qua</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-sky-50 text-sky-600 rounded-lg"><Activity size={18} /></div>
                        <span className="text-sm font-medium text-slate-500">RAM Available</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">128 GB</div>
                    <div className="text-xs text-slate-400 mt-1">Tổng: 256 GB (Cluster)</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Wifi size={18} /></div>
                        <span className="text-sm font-medium text-slate-500">Network Traffic</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">1.2 GB/s</div>
                    <div className="text-xs text-green-600 flex items-center mt-1"><ArrowUpRight size={14} className="mr-1"/> Peak lúc 10:00 AM</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle size={18} /></div>
                        <span className="text-sm font-medium text-slate-500">Error Rate (5xx)</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">0.02%</div>
                    <div className="text-xs text-slate-400 mt-1">Ngưỡng cảnh báo: 1.0%</div>
                </div>
            </div>

            {/* Server Fleet Grid */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Server size={20} className="text-slate-400"/> Server Fleet Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <ServerNode name="App Server 01" role="Web" ip="10.0.1.12" cpu={45} ram={60} status="online" />
                    <ServerNode name="App Server 02" role="Web" ip="10.0.1.13" cpu={38} ram={55} status="online" />
                    <ServerNode name="App Server 03" role="Web" ip="10.0.1.14" cpu={92} ram={85} status="warning" />
                    <ServerNode name="DB Master" role="Database" ip="10.0.2.10" cpu={65} ram={78} status="online" />
                    <ServerNode name="DB Slave 01" role="Database" ip="10.0.2.11" cpu={20} ram={40} status="online" />
                    <ServerNode name="Redis Cache" role="Database" ip="10.0.3.05" cpu={15} ram={90} status="online" />
                    <ServerNode name="Media Process" role="Web" ip="10.0.4.22" cpu={10} ram={20} status="online" />
                    <ServerNode name="Search Node" role="Web" ip="10.0.5.01" cpu={55} ram={60} status="online" />
                </div>
            </div>


            {/* Bottom Panel: Storage & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Storage Distribution */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
                        <span>Lưu trữ (Storage)</span>
                        <span className="text-xs font-normal text-slate-500">4.2TB / 10TB</span>
                     </h3>
                     
                     <div className="relative pt-2 pb-6 flex justify-center">
                        {/* CSS Visualization for Pie Chart representation */}
                        <div className="w-48 h-48 rounded-full border-[16px] border-slate-100 border-t-brand-500 border-r-purple-500 border-b-emerald-500 border-l-amber-500 rotate-45"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-slate-800">42%</span>
                            <span className="text-xs text-slate-400">Đã sử dụng</span>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-brand-500"></div> Documents</div>
                            <span className="font-medium text-slate-700">1.8 TB</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-500"></div> Media/Assets</div>
                            <span className="font-medium text-slate-700">1.2 TB</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500"></div> Database</div>
                            <span className="font-medium text-slate-700">800 GB</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500"></div> Logs/Backup</div>
                            <span className="font-medium text-slate-700">400 GB</span>
                        </div>
                     </div>
                </div>

                {/* System Alerts Table */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-900">Cảnh báo hệ thống (System Alerts)</h3>
                        <Button variant="ghost" className="text-xs h-8">Xem tất cả</Button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {[
                            { type: 'High Load', msg: 'App Server 03 CPU vượt quá 90%', time: '10 phút trước', severity: 'high' },
                            { type: 'Latency', msg: 'API Gateway phản hồi chậm > 2000ms', time: '32 phút trước', severity: 'medium' },
                            { type: 'Storage', msg: 'Ổ đĩa /var/log đầy 85%', time: '2 giờ trước', severity: 'low' },
                            { type: 'Security', msg: 'Phát hiện đăng nhập bất thường IP 192.168.x.x', time: '5 giờ trước', severity: 'medium' },
                            { type: 'Backup', msg: 'Backup Database thành công', time: '1 ngày trước', severity: 'info' },
                        ].map((alert, idx) => (
                            <div key={idx} className="px-6 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                                <div className={`mt-0.5 min-w-[8px] h-2 rounded-full ${
                                    alert.severity === 'high' ? 'bg-red-500' : 
                                    alert.severity === 'medium' ? 'bg-orange-500' :
                                    alert.severity === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                                }`}></div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-0.5">
                                        <span className={`text-xs font-bold uppercase ${
                                            alert.severity === 'high' ? 'text-red-700' : 'text-slate-700'
                                        }`}>{alert.type}</span>
                                        <span className="text-xs text-slate-400">{alert.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{alert.msg}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
