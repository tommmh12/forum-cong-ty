import React, { useState } from 'react';
import { Project } from '../../../../../shared/types/project.types';
import { TechStackCategory, ResourceType, PHASE_ORDER } from '../../../../../shared/types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Plus, MoreHorizontal, Building, Clock, DollarSign, Check, ArrowLeft, FileText, Image, Link as LinkIcon, Code, Database, Server, Globe, Layers } from 'lucide-react';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { ProjectDetailView } from './ProjectDetailView';
import { useProjectContext, CreateProjectInput } from '../context/ProjectContext';
import { useUsers, useWorkflows } from '../../../hooks';

// Resource checklist items
const RESOURCE_CHECKLIST: { type: ResourceType; label: string; icon: React.ReactNode }[] = [
    { type: 'SITEMAP', label: 'Sitemap', icon: <Layers size={16} /> },
    { type: 'SRS', label: 'Tài liệu yêu cầu (SRS)', icon: <FileText size={16} /> },
    { type: 'WIREFRAME', label: 'Wireframe', icon: <Layers size={16} /> },
    { type: 'MOCKUP', label: 'Design mockup', icon: <Image size={16} /> },
    { type: 'FIGMA_LINK', label: 'Figma link', icon: <LinkIcon size={16} /> },
    { type: 'ASSET', label: 'Assets (logo, images)', icon: <Image size={16} /> },
    { type: 'CREDENTIAL', label: 'Credentials', icon: <FileText size={16} /> },
];

// Tech stack categories
const TECH_CATEGORIES: { value: TechStackCategory; label: string; icon: React.ReactNode }[] = [
    { value: 'LANGUAGE', label: 'Ngôn ngữ', icon: <Code size={16} /> },
    { value: 'FRAMEWORK', label: 'Framework', icon: <Layers size={16} /> },
    { value: 'DATABASE', label: 'Database', icon: <Database size={16} /> },
    { value: 'HOSTING', label: 'Hosting', icon: <Server size={16} /> },
    { value: 'OTHER', label: 'Khác', icon: <Globe size={16} /> },
];

// Phase display info
const PHASE_DISPLAY: Record<string, { label: string; color: string }> = {
    REQUIREMENTS: { label: 'Yêu cầu', color: 'bg-purple-100 text-purple-700' },
    DESIGN: { label: 'Thiết kế', color: 'bg-pink-100 text-pink-700' },
    DEVELOPMENT: { label: 'Phát triển', color: 'bg-blue-100 text-blue-700' },
    TESTING: { label: 'Testing', color: 'bg-orange-100 text-orange-700' },
    UAT: { label: 'UAT', color: 'bg-amber-100 text-amber-700' },
    DEPLOYMENT: { label: 'Triển khai', color: 'bg-green-100 text-green-700' },
};

interface CreateProjectFormProps {
    onCancel: () => void;
    onSave: (data: CreateProjectInput) => Promise<void>;
}

const CreateProjectForm = ({ onCancel, onSave }: CreateProjectFormProps) => {
    const { users, loading: usersLoading } = useUsers();
    const { workflows, loading: workflowsLoading } = useWorkflows();
    
    // Form state
    const [name, setName] = useState('');
    const [projectKey, setProjectKey] = useState('');
    const [description, setDescription] = useState('');
    const [managerId, setManagerId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [workflowId, setWorkflowId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [resourceChecklist, setResourceChecklist] = useState<Record<ResourceType, boolean>>({
        SITEMAP: false,
        SRS: false,
        WIREFRAME: false,
        MOCKUP: false,
        FIGMA_LINK: false,
        ASSET: false,
        CREDENTIAL: false,
    });
    const [techStack, setTechStack] = useState<{ category: TechStackCategory; name: string; version: string }[]>([]);
    const [newTech, setNewTech] = useState({ category: 'LANGUAGE' as TechStackCategory, name: '', version: '' });

    const handleResourceToggle = (type: ResourceType) => {
        setResourceChecklist(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const handleAddTech = () => {
        if (newTech.name.trim()) {
            setTechStack(prev => [...prev, { ...newTech }]);
            setNewTech({ category: 'LANGUAGE', name: '', version: '' });
        }
    };

    const handleRemoveTech = (index: number) => {
        setTechStack(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!name || !projectKey) {
            setError('Vui lòng nhập tên dự án và mã dự án');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSave({
                key: projectKey,
                name,
                managerId: managerId || undefined,
                status: 'PLANNING',
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                budget: budget || undefined,
                description: description || undefined,
                workflowId: workflowId || undefined,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tạo dự án');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fadeIn max-w-4xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="outline" onClick={onCancel} className="p-2 h-10 w-10"><ArrowLeft size={18} /></Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Khởi tạo Dự án Web mới</h1>
                    <p className="text-slate-500 text-sm">Điền thông tin chi tiết để tạo hồ sơ dự án.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 space-y-8">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Section 1: Basic Info */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-600 flex items-center justify-center text-sm">1</div>
                            Thông tin cơ bản
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
                            <Input 
                                label="Tên dự án *" 
                                placeholder="Ví dụ: Website công ty ABC" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required 
                            />
                            <Input 
                                label="Mã dự án (Prefix) *" 
                                placeholder="Ví dụ: WEB-2024" 
                                value={projectKey}
                                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                                required
                            />
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Mô tả dự án</label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none min-h-[100px]" 
                                    placeholder="Mô tả mục tiêu và phạm vi dự án..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Quy trình làm việc (Workflow)</label>
                                {workflowsLoading ? (
                                    <div className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 flex items-center justify-center">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                ) : (
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={workflowId}
                                        onChange={(e) => setWorkflowId(e.target.value)}
                                    >
                                        <option value="">Chọn workflow (tùy chọn)</option>
                                        {workflows.map(wf => (
                                            <option key={wf.id} value={wf.id}>
                                                {wf.name} {wf.isDefault && '(Mặc định)'}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-xs text-slate-500 mt-1">
                                    Workflow sẽ xác định các bước và giai đoạn của dự án. Để trống sẽ dùng workflow mặc định.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100"></div>

                    {/* Section 2: Details & Resources */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-600 flex items-center justify-center text-sm">2</div>
                            Phạm vi & Tài nguyên
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Quản lý dự án (PM)</label>
                                {usersLoading ? (
                                    <div className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 flex items-center justify-center">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                ) : (
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={managerId}
                                        onChange={(e) => setManagerId(e.target.value)}
                                    >
                                        <option value="">Chọn người quản lý...</option>
                                        {users.filter(u => u.role === 'Manager' || u.role === 'Admin').map(u => (
                                            <option key={u.id} value={u.id}>{u.fullName}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Độ ưu tiên</label>
                                <div className="flex gap-4">
                                    {['Low', 'Medium', 'High', 'Critical'].map(p => (
                                        <label key={p} className="flex items-center cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="priority" 
                                                value={p.toUpperCase()}
                                                checked={priority === p.toUpperCase()}
                                                onChange={(e) => setPriority(e.target.value)}
                                                className="mr-2 text-brand-600 focus:ring-brand-500" 
                                            />
                                            <span className="text-sm text-slate-700">{p}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Input 
                                label="Ngày bắt đầu" 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <Input 
                                label="Ngày kết thúc (Dự kiến)" 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />

                            <Input 
                                label="Ngân sách dự kiến" 
                                placeholder="Ví dụ: 200,000,000 VNĐ" 
                                icon={<DollarSign size={16} />} 
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100"></div>

                    {/* Section 3: Resource Checklist */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-600 flex items-center justify-center text-sm">3</div>
                            Checklist tài nguyên
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 pl-10">Đánh dấu các tài nguyên đã có sẵn cho dự án</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-10">
                            {RESOURCE_CHECKLIST.map(item => (
                                <label 
                                    key={item.type} 
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                        resourceChecklist[item.type] 
                                            ? 'bg-green-50 border-green-200 text-green-700' 
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={resourceChecklist[item.type]}
                                        onChange={() => handleResourceToggle(item.type)}
                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                    />
                                    <span className="text-slate-400">{item.icon}</span>
                                    <span className="text-sm font-medium">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-100"></div>

                    {/* Section 4: Tech Stack Selection */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-600 flex items-center justify-center text-sm">4</div>
                            Tech Stack
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 pl-10">Chọn công nghệ sử dụng cho dự án</p>
                        
                        {/* Add new tech */}
                        <div className="flex gap-3 mb-4 pl-10">
                            <select 
                                value={newTech.category}
                                onChange={(e) => setNewTech(prev => ({ ...prev, category: e.target.value as TechStackCategory }))}
                                className="bg-slate-50 border border-slate-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                {TECH_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                            <input 
                                type="text"
                                placeholder="Tên công nghệ"
                                value={newTech.name}
                                onChange={(e) => setNewTech(prev => ({ ...prev, name: e.target.value }))}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                            <input 
                                type="text"
                                placeholder="Version"
                                value={newTech.version}
                                onChange={(e) => setNewTech(prev => ({ ...prev, version: e.target.value }))}
                                className="w-24 bg-slate-50 border border-slate-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                            <Button variant="outline" onClick={handleAddTech}>
                                <Plus size={16} />
                            </Button>
                        </div>

                        {/* Tech stack list */}
                        {techStack.length > 0 && (
                            <div className="flex flex-wrap gap-2 pl-10">
                                {techStack.map((tech, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm"
                                    >
                                        {TECH_CATEGORIES.find(c => c.value === tech.category)?.icon}
                                        <span className="font-medium">{tech.name}</span>
                                        {tech.version && <span className="text-brand-500">v{tech.version}</span>}
                                        <button 
                                            onClick={() => handleRemoveTech(index)}
                                            className="ml-1 text-brand-400 hover:text-brand-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>Hủy bỏ</Button>
                    <Button onClick={handleSubmit} disabled={!name || !projectKey || isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner size="sm" />
                                <span className="ml-2">Đang tạo...</span>
                            </>
                        ) : (
                            <>
                                <Check size={18} className="mr-2" /> Tạo dự án
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};


export const ProjectModule = () => {
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    
    const { 
        projects, 
        projectsLoading, 
        projectsError, 
        fetchProjects,
        createProject,
        selectProject,
    } = useProjectContext();

    const handleCreateClick = () => setView('create');
    const handleCancelCreate = () => setView('list');
    
    const handleSaveProject = async (data: CreateProjectInput) => {
        const newProject = await createProject(data);
        // Select the newly created project
        selectProject(newProject.id);
        setView('list');
    };

    const handleProjectClick = (p: Project) => {
        setSelectedProject(p);
        selectProject(p.id);
        setView('detail');
    };

    const handleBackToList = () => {
        setSelectedProject(null);
        setView('list');
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700';
            case 'ACTIVE': return 'bg-blue-100 text-blue-700';
            case 'PLANNING': return 'bg-yellow-100 text-yellow-700';
            case 'ON_HOLD': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (view === 'create') {
        return <CreateProjectForm onCancel={handleCancelCreate} onSave={handleSaveProject} />;
    }
    
    if (view === 'detail' && selectedProject) {
        return <ProjectDetailView project={selectedProject} onBack={handleBackToList} />;
    }

    if (projectsLoading) {
        return <LoadingSpinner size="lg" text="Đang tải danh sách dự án..." />;
    }

    if (projectsError) {
        return <ErrorMessage message={projectsError} onRetry={fetchProjects} />;
    }

    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Danh sách Dự án</h1>
                    <p className="text-slate-500 mt-1">Quản lý và theo dõi tiến độ các dự án đang hoạt động.</p>
                </div>
                <Button onClick={handleCreateClick}><Plus size={18} className="mr-2" /> Tạo dự án mới</Button>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-16">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Chưa có dự án nào</h3>
                    <p className="text-slate-500 mb-4">Bắt đầu bằng việc tạo dự án đầu tiên của bạn.</p>
                    <Button onClick={handleCreateClick}>
                        <Plus size={18} className="mr-2" /> Tạo dự án mới
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((p) => (
                        <div 
                            key={p.id} 
                            onClick={() => handleProjectClick(p)} 
                            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-brand-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusColor(p.status)}`}>
                                    {p.status}
                                </span>
                                <button 
                                    className="text-slate-400 hover:text-slate-600"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">
                                {p.name}
                            </h3>
                            <p className="text-sm text-slate-500 mb-2 flex items-center gap-1">
                                <Building size={12} /> {p.key}
                            </p>

                            {/* Phase Status */}
                            {(p as any).currentPhase && (
                                <div className="mb-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${PHASE_DISPLAY[(p as any).currentPhase]?.color || 'bg-slate-100 text-slate-600'}`}>
                                        <Layers size={10} />
                                        {PHASE_DISPLAY[(p as any).currentPhase]?.label || (p as any).currentPhase}
                                    </span>
                                </div>
                            )}

                            <div className="mb-4">
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-slate-500">Tiến độ</span>
                                    <span className="font-semibold text-slate-700">{p.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-1000 ${p.status === 'COMPLETED' ? 'bg-green-500' : 'bg-brand-600'}`}
                                        style={{ width: `${p.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <div className="flex -space-x-2">
                                    {/* Mock Members */}
                                    <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-600 font-bold">A</div>
                                    <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-600 font-bold">B</div>
                                </div>
                                <div className="flex items-center text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                    <Clock size={12} className="mr-1" /> {p.endDate || 'Chưa đặt'}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Project Card Placeholder */}
                    <div 
                        onClick={handleCreateClick} 
                        className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 transition-all cursor-pointer h-full min-h-[220px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-white">
                            <Plus size={24} />
                        </div>
                        <span className="font-medium">Thêm dự án mới</span>
                    </div>
                </div>
            )}
        </div>
    );
};
