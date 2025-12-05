import { useState, useRef, useCallback } from 'react';
import { useDepartments, useUsers } from '../../../hooks';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner, ErrorMessage } from '../../../components/ui';
import { Users, Download, Building2, ChevronDown, Target, Wallet, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Department, EmployeeProfile } from '../../../../../shared/types';

interface OrgNodeProps {
    dept: Department;
    departments: Department[];
    users: EmployeeProfile[];
    level: number;
}

const OrgNode = ({ dept, departments, users, level }: OrgNodeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const children = departments.filter(d => d.parentDeptId === dept.id);
    const deptMembers = users.filter(u => u.department === dept.name);
    const memberCount = deptMembers.length;
    
    // Màu sắc theo level
    const levelColors = [
        'border-brand-500 bg-brand-50',      // Level 0 - BOD
        'border-blue-500 bg-blue-50',         // Level 1
        'border-emerald-500 bg-emerald-50',   // Level 2
        'border-purple-500 bg-purple-50',     // Level 3
    ];
    const colorClass = levelColors[Math.min(level, levelColors.length - 1)];

    // KPI status color
    const kpiColor = dept.kpiStatus === 'On Track' 
        ? 'bg-green-100 text-green-700' 
        : dept.kpiStatus === 'At Risk' 
            ? 'bg-yellow-100 text-yellow-700' 
            : 'bg-red-100 text-red-700';

    return (
        <div className="flex flex-col items-center">
            {/* Node */}
            <div 
                className={`bg-white p-4 rounded-xl shadow-md border-2 ${colorClass} w-72 relative z-10 hover:shadow-xl transition-all cursor-pointer group`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex items-start gap-3">
                    <img 
                        src={dept.managerAvatar} 
                        alt={dept.managerName} 
                        className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                            {dept.code}
                        </span>
                        <p className="font-bold text-slate-900 text-sm leading-tight mt-1" title={dept.name}>
                            {dept.name}
                        </p>
                        <p className="text-xs text-slate-500">{dept.managerName}</p>
                    </div>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full flex items-center gap-1">
                        <Users size={12}/> {memberCount} nhân sự
                    </span>
                    {children.length > 0 && (
                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <Building2 size={12}/> {children.length} phòng ban con
                        </span>
                    )}
                </div>

                {/* Tooltip chi tiết khi hover - hiển thị phía trên */}
                {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 animate-fadeIn">
                        {/* Header */}
                        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                            <img 
                                src={dept.managerAvatar} 
                                alt={dept.managerName} 
                                className="w-14 h-14 rounded-full border-2 border-brand-100" 
                            />
                            <div className="flex-1">
                                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                                    {dept.code}
                                </span>
                                <h4 className="font-bold text-slate-900 mt-1">{dept.name}</h4>
                                <p className="text-sm text-slate-500">Trưởng phòng: {dept.managerName}</p>
                            </div>
                        </div>

                        {/* Mô tả */}
                        {dept.description && (
                            <p className="text-sm text-slate-600 mt-3 line-clamp-2">{dept.description}</p>
                        )}

                        {/* Thông tin chi tiết */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="bg-slate-50 rounded-lg p-2">
                                <div className="flex items-center gap-1 text-slate-500 text-xs mb-1">
                                    <Users size={12}/> Nhân sự
                                </div>
                                <p className="font-bold text-slate-900">{memberCount} người</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2">
                                <div className="flex items-center gap-1 text-slate-500 text-xs mb-1">
                                    <Wallet size={12}/> Ngân sách
                                </div>
                                <p className="font-bold text-slate-900 text-sm">{dept.budget || '---'}</p>
                            </div>
                        </div>

                        {/* KPI Status */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Target size={12}/> Trạng thái KPI
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpiColor}`}>
                                {dept.kpiStatus}
                            </span>
                        </div>

                        {/* Danh sách nhân viên (tối đa 3) */}
                        {deptMembers.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500 mb-2">Nhân viên:</p>
                                <div className="space-y-2">
                                    {deptMembers.slice(0, 3).map(member => (
                                        <div key={member.id} className="flex items-center gap-2 text-sm">
                                            <img src={member.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-slate-900 truncate text-xs">{member.fullName}</p>
                                                <p className="text-slate-400 text-[10px] truncate">{member.position}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {deptMembers.length > 3 && (
                                        <p className="text-xs text-brand-600">+{deptMembers.length - 3} người khác</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Arrow pointing down */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2">
                            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Connector và Children */}
            {children.length > 0 && (
                <>
                    {/* Đường dọc xuống */}
                    <div className="w-0.5 h-8 bg-slate-300"></div>
                    
                    {/* Icon mở rộng */}
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center mb-2">
                        <ChevronDown size={14} className="text-slate-500" />
                    </div>

                    {/* Container children */}
                    <div className="relative">
                        {/* Đường ngang nối các children */}
                        {children.length > 1 && (
                            <div 
                                className="absolute top-0 h-0.5 bg-slate-300"
                                style={{
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: `calc(${(children.length - 1) * 320}px)`,
                                }}
                            />
                        )}
                        
                        {/* Children nodes */}
                        <div className="flex gap-8">
                            {children.map(child => (
                                <div key={child.id} className="relative pt-8">
                                    {/* Đường dọc từ đường ngang xuống node */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-slate-300"></div>
                                    <OrgNode 
                                        dept={child} 
                                        departments={departments} 
                                        users={users}
                                        level={level + 1}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export const OrgChart = () => {
    const { departments, loading: deptLoading, error: deptError, refetch: refetchDepts } = useDepartments();
    const { users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();

    // Zoom và Pan state
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const loading = deptLoading || usersLoading;
    const error = deptError || usersError;

    const handleRefetch = () => {
        refetchDepts();
        refetchUsers();
    };

    // Zoom handlers
    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 2));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.4));
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    // Mouse wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setScale(prev => Math.min(Math.max(prev + delta, 0.4), 2));
        }
    }, []);

    // Pan handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) { // Left click
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (loading) return <LoadingSpinner text="Đang tải sơ đồ tổ chức..." />;
    if (error) return <ErrorMessage message={error} onRetry={handleRefetch} />;

    // Tìm root node (BOD hoặc node không có parent)
    const rootDept = departments.find(d => d.id === 'bod') || departments.find(d => !d.parentDeptId);

    // Tính tổng số nhân sự
    const totalMembers = users.length;
    const totalDepts = departments.length;

    return (
        <div className="animate-fadeIn h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sơ đồ Tổ chức</h1>
                    <p className="text-slate-500 mt-1">
                        Cấu trúc phân cấp với {totalDepts} phòng ban và {totalMembers} nhân sự.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download size={18} className="mr-2"/> Xuất PDF
                    </Button>
                </div>
            </div>

            <div 
                ref={containerRef}
                className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border overflow-hidden relative shadow-inner select-none"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 bg-white rounded-lg shadow-md border border-slate-200 p-1">
                    <button 
                        onClick={handleZoomIn}
                        className="p-2 hover:bg-slate-100 rounded transition-colors"
                        title="Phóng to"
                    >
                        <ZoomIn size={18} className="text-slate-600" />
                    </button>
                    <div className="text-center text-xs text-slate-500 py-1 border-y border-slate-100">
                        {Math.round(scale * 100)}%
                    </div>
                    <button 
                        onClick={handleZoomOut}
                        className="p-2 hover:bg-slate-100 rounded transition-colors"
                        title="Thu nhỏ"
                    >
                        <ZoomOut size={18} className="text-slate-600" />
                    </button>
                    <button 
                        onClick={handleReset}
                        className="p-2 hover:bg-slate-100 rounded transition-colors border-t border-slate-100"
                        title="Đặt lại"
                    >
                        <Maximize2 size={18} className="text-slate-600" />
                    </button>
                </div>

                {/* Hint */}
                <div className="absolute bottom-4 left-4 z-20 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded">
                    Kéo để di chuyển • Ctrl + Scroll để zoom
                </div>

                {/* Chart Content */}
                <div 
                    className="min-w-max p-10 pt-16"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: 'center top',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    }}
                >
                    <div className="flex justify-center pb-20">
                        {rootDept ? (
                            <OrgNode 
                                dept={rootDept} 
                                departments={departments} 
                                users={users}
                                level={0}
                            />
                        ) : (
                            <div className="text-center text-slate-500 py-20">
                                <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Chưa có dữ liệu sơ đồ tổ chức</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
