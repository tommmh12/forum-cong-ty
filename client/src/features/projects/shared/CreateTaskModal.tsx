import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import { useUsers } from '../../../hooks';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { TaskType } from '../../../../../shared/types/project.types';
import { TaskCategory } from '../../../../../shared/types';
import { useProjectContext } from '../context/ProjectContext';

interface CreateTaskModalProps {
    projectId?: string;
    isOpen?: boolean;
    onClose: () => void;
    onSave?: (data: any) => Promise<void>;
    preselectedColumnId?: string;
}

export const CreateTaskModal = ({ 
    projectId, 
    isOpen = true, 
    onClose, 
    onSave,
    preselectedColumnId 
}: CreateTaskModalProps) => {
    const projectContext = useProjectContext();
    const { users, loading: usersLoading } = useUsers();
    
    // Use provided onSave or fallback to context
    const createTaskFn = onSave || projectContext?.createTask;
    if (!createTaskFn) {
        throw new Error('createTask function is not available. Please ensure ProjectProvider is set up correctly.');
    }
    const columns = projectContext.columns || [];
    const selectedProject = projectContext.selectedProject;

    const [title, setTitle] = useState('');
    const [type, setType] = useState<TaskType>('FEATURE');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
    const [category, setCategory] = useState<TaskCategory>('FRONTEND');
    const [columnId, setColumnId] = useState('');

    // Update columnId when columns load or preselectedColumnId changes
    useEffect(() => {
        if (preselectedColumnId) {
            setColumnId(preselectedColumnId);
        } else if (columns.length > 0 && !columnId) {
            setColumnId(columns[0].id);
        }
    }, [columns, preselectedColumnId, columnId]);
    const [assigneeId, setAssigneeId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');
    const [commitReference, setCommitReference] = useState('');
    const [checklist, setChecklist] = useState<{ id: string, text: string }[]>([]);
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddChecklist = () => {
        if (newChecklistItem.trim()) {
            setChecklist([...checklist, { id: Date.now().toString(), text: newChecklistItem }]);
            setNewChecklistItem('');
        }
    };

    const handleRemoveChecklist = (id: string) => {
        setChecklist(checklist.filter(item => item.id !== id));
    };

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async () => {
        if (!title || !columnId) {
            setError('Vui lòng nhập tiêu đề và chọn cột');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const taskData = {
                columnId,
                title,
                type,
                priority,
                category,
                assigneeId: assigneeId || undefined,
                dueDate: dueDate || undefined,
                description: description || undefined,
                tags: tags.length > 0 ? tags : undefined,
                checklist: checklist.length > 0 ? checklist.map(item => ({ title: item.text })) : undefined,
            };
            
            if (onSave) {
                await onSave(taskData);
            } else if (createTaskFn) {
                await createTaskFn(taskData);
            } else {
                throw new Error('Cannot create task: no createTask function available');
            }
            
            // Reset form and close modal
            setTitle('');
            setType('FEATURE');
            setPriority('MEDIUM');
            setCategory('FRONTEND');
            setAssigneeId('');
            setDueDate('');
            setDescription('');
            setCommitReference('');
            setChecklist([]);
            setTags([]);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tạo task');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Tạo công việc mới</h2>
                        {selectedProject && (
                            <p className="text-sm text-slate-500 mt-0.5">
                                Dự án: {selectedProject.name}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold mb-1">Tiêu đề *</label>
                        <input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" 
                            placeholder="Nhập tiêu đề task..."
                            autoFocus 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase mb-1 text-slate-600">Cột / Trạng thái *</label>
                            <select 
                                value={columnId} 
                                onChange={(e) => setColumnId(e.target.value)} 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                {columns.map(col => (
                                    <option key={col.id} value={col.id}>{col.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase mb-1 text-slate-600">Loại</label>
                            <select 
                                value={type} 
                                onChange={(e) => setType(e.target.value as TaskType)} 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="FEATURE">Feature</option>
                                <option value="BUG">Bug</option>
                                <option value="IMPROVEMENT">Improvement</option>
                                <option value="RESEARCH">Research</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase mb-1 text-slate-600">Ưu tiên</label>
                            <select 
                                value={priority} 
                                onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')} 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase mb-1 text-slate-600">Category</label>
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value as TaskCategory)} 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="FRONTEND">Frontend</option>
                                <option value="BACKEND">Backend</option>
                                <option value="DESIGN">Design</option>
                                <option value="DEVOPS">DevOps</option>
                                <option value="QA">QA</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase mb-1 text-slate-600">Người thực hiện</label>
                            {usersLoading ? (
                                <div className="w-full px-3 py-2 border rounded-lg bg-slate-50 flex items-center justify-center">
                                    <LoadingSpinner size="sm" />
                                </div>
                            ) : (
                                <select 
                                    value={assigneeId} 
                                    onChange={(e) => setAssigneeId(e.target.value)} 
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                >
                                    <option value="">-- Chưa gán --</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.fullName}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase mb-1 text-slate-600">Hạn chót</label>
                            <input 
                                type="date" 
                                value={dueDate} 
                                onChange={(e) => setDueDate(e.target.value)} 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Mô tả</label>
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            className="w-full px-3 py-2 border rounded-lg min-h-[100px] focus:ring-2 focus:ring-brand-500 outline-none" 
                            placeholder="Mô tả chi tiết công việc..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {tags.map(tag => (
                                <span 
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-medium"
                                >
                                    {tag}
                                    <button 
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-brand-900"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                value={newTag} 
                                onChange={(e) => setNewTag(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} 
                                className="flex-1 px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                                placeholder="Nhập tag và nhấn Enter..."
                            />
                            <Button variant="outline" onClick={handleAddTag} className="py-1.5 px-3 h-auto text-xs">
                                <Plus size={14} className="mr-1" /> Thêm
                            </Button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Checklist ({checklist.length})</label>
                        <div className="space-y-2 mb-3">
                            {checklist.map(item => (
                                <div key={item.id} className="flex items-center gap-2 group">
                                    <input type="checkbox" disabled className="w-4 h-4 rounded" />
                                    <span className="text-sm flex-1">{item.text}</span>
                                    <button 
                                        onClick={() => handleRemoveChecklist(item.id)} 
                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                value={newChecklistItem} 
                                onChange={(e) => setNewChecklistItem(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()} 
                                className="flex-1 px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                                placeholder="Thêm mục checklist..."
                            />
                            <Button variant="outline" onClick={handleAddChecklist} className="py-1.5 px-3 h-auto text-xs">
                                <Plus size={14} className="mr-1" /> Thêm
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit} disabled={!title || !columnId || isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner size="sm" />
                                <span className="ml-2">Đang tạo...</span>
                            </>
                        ) : (
                            'Tạo task'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
