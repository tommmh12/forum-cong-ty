import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { X, Edit2, Trash2, Save, Calendar, User, Tag, AlertTriangle, CheckSquare, MessageSquare, Clock, Link2 } from 'lucide-react';
import { useUsers } from '../../../hooks';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { TaskType } from '../../../../../shared/types/project.types';
import { TaskCategory, UserRole } from '../../../../../shared/types';
import { WebTask } from '../../../../../shared/types/web-project.types';
import { useProjectContext } from '../context/ProjectContext';
import { useAuthContext } from '../../auth/context/AuthContext';

interface TaskDetailModalProps {
    task: WebTask;
    isOpen: boolean;
    onClose: () => void;
}

const PRIORITY_COLORS = {
    LOW: 'bg-green-100 text-green-700 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    URGENT: 'bg-red-100 text-red-700 border-red-200',
};

const TYPE_COLORS = {
    FEATURE: 'bg-blue-100 text-blue-700',
    BUG: 'bg-red-100 text-red-700',
    IMPROVEMENT: 'bg-purple-100 text-purple-700',
    RESEARCH: 'bg-teal-100 text-teal-700',
};

const CATEGORY_COLORS: Record<TaskCategory, string> = {
    FRONTEND: 'bg-blue-50 text-blue-600 border-blue-200',
    BACKEND: 'bg-green-50 text-green-600 border-green-200',
    DESIGN: 'bg-pink-50 text-pink-600 border-pink-200',
    DEVOPS: 'bg-purple-50 text-purple-600 border-purple-200',
    QA: 'bg-amber-50 text-amber-600 border-amber-200',
};

export const TaskDetailModal = ({ task, isOpen, onClose }: TaskDetailModalProps) => {
    const { updateTask, deleteTask, columns } = useProjectContext();
    const { user: currentUser } = useAuthContext();
    const { users, loading: usersLoading } = useUsers();

    // Check if user can edit/delete (Admin or Manager only)
    const canEdit = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER;

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Edit form state
    const [title, setTitle] = useState(task.title);
    const [type, setType] = useState<TaskType>(task.type);
    const [priority, setPriority] = useState(task.priority);
    const [category, setCategory] = useState<TaskCategory>(task.category || 'FRONTEND');
    const [columnId, setColumnId] = useState(task.columnId);
    const [assigneeId, setAssigneeId] = useState(task.assigneeId || '');
    const [dueDate, setDueDate] = useState(task.dueDate || '');
    const [description, setDescription] = useState(task.description || '');

    // Reset form when task changes
    useEffect(() => {
        setTitle(task.title);
        setType(task.type);
        setPriority(task.priority);
        setCategory(task.category || 'FRONTEND');
        setColumnId(task.columnId);
        setAssigneeId(task.assigneeId || '');
        setDueDate(task.dueDate || '');
        setDescription(task.description || '');
        setIsEditing(false);
        setError(null);
    }, [task]);

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Tiêu đề không được để trống');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await updateTask(task.id, {
                title,
                type,
                priority,
                category,
                columnId,
                assigneeId: assigneeId || null,
                dueDate: dueDate || null,
                description: description || null,
            });
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể cập nhật task');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            await deleteTask(task.id);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể xóa task');
            setIsDeleting(false);
        }
    };

    const handleCancel = () => {
        // Reset to original values
        setTitle(task.title);
        setType(task.type);
        setPriority(task.priority);
        setCategory(task.category || 'FRONTEND');
        setColumnId(task.columnId);
        setAssigneeId(task.assigneeId || '');
        setDueDate(task.dueDate || '');
        setDescription(task.description || '');
        setIsEditing(false);
        setError(null);
    };

    const getColumnName = (colId: string) => {
        return columns.find(c => c.id === colId)?.name || 'Unknown';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${TYPE_COLORS[task.type]}`}>
                                {task.type}
                            </span>
                            <span className="text-sm text-slate-500 font-mono">{task.code}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded border ${CATEGORY_COLORS[task.category || 'FRONTEND']}`}>
                                {task.category || 'FRONTEND'}
                            </span>
                        </div>
                        {isEditing ? (
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-xl font-bold w-full px-2 py-1 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
                                autoFocus
                            />
                        ) : (
                            <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
                        )}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-4">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-6">
                        {/* Main Content - 2 columns */}
                        <div className="col-span-2 space-y-6">
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Mô tả</label>
                                {isEditing ? (
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg min-h-[150px] focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="Mô tả chi tiết công việc..."
                                    />
                                ) : (
                                    <div className="bg-slate-50 rounded-lg p-4 min-h-[100px]">
                                        {task.description ? (
                                            <p className="text-slate-700 whitespace-pre-wrap">{task.description}</p>
                                        ) : (
                                            <p className="text-slate-400 italic">Chưa có mô tả</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Checklist */}
                            {task.checklist && task.checklist.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <CheckSquare size={16} />
                                        Checklist ({task.checklist.filter(c => c.isCompleted).length}/{task.checklist.length})
                                    </label>
                                    <div className="space-y-2">
                                        {task.checklist.map((item) => (
                                            <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={item.isCompleted} 
                                                    disabled={!isEditing}
                                                    className="w-4 h-4 rounded text-brand-600"
                                                />
                                                <span className={item.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}>
                                                    {item.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Comments */}
                            {task.comments && task.comments.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <MessageSquare size={16} />
                                        Bình luận ({task.comments.length})
                                    </label>
                                    <div className="space-y-3">
                                        {task.comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                                                {comment.userAvatar ? (
                                                    <img src={comment.userAvatar} alt="" className="w-8 h-8 rounded-full" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold">
                                                        {comment.userName?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-slate-800">{comment.userName}</span>
                                                        <span className="text-xs text-slate-400">{comment.timestamp}</span>
                                                    </div>
                                                    <p className="text-slate-600 text-sm">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dependencies */}
                            {task.dependencies && task.dependencies.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <Link2 size={16} />
                                        Dependencies ({task.dependencies.length})
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {task.dependencies.map((depId) => (
                                            <span key={depId} className="px-2 py-1 bg-slate-100 rounded text-sm text-slate-600">
                                                {depId}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar - 1 column */}
                        <div className="space-y-4">
                            {/* Status/Column */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Trạng thái</label>
                                {isEditing ? (
                                    <select
                                        value={columnId}
                                        onChange={(e) => setColumnId(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    >
                                        {columns.map(col => (
                                            <option key={col.id} value={col.id}>{col.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium">
                                        {getColumnName(task.columnId)}
                                    </div>
                                )}
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ưu tiên</label>
                                {isEditing ? (
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                ) : (
                                    <div className={`px-3 py-2 rounded-lg text-sm font-medium border ${PRIORITY_COLORS[task.priority]}`}>
                                        {task.priority}
                                    </div>
                                )}
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Loại</label>
                                {isEditing ? (
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as TaskType)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    >
                                        <option value="FEATURE">Feature</option>
                                        <option value="BUG">Bug</option>
                                        <option value="IMPROVEMENT">Improvement</option>
                                        <option value="RESEARCH">Research</option>
                                    </select>
                                ) : (
                                    <div className={`px-3 py-2 rounded-lg text-sm font-medium ${TYPE_COLORS[task.type]}`}>
                                        {task.type}
                                    </div>
                                )}
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                                {isEditing ? (
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as TaskCategory)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    >
                                        <option value="FRONTEND">Frontend</option>
                                        <option value="BACKEND">Backend</option>
                                        <option value="DESIGN">Design</option>
                                        <option value="DEVOPS">DevOps</option>
                                        <option value="QA">QA</option>
                                    </select>
                                ) : (
                                    <div className={`px-3 py-2 rounded-lg text-sm font-medium border ${CATEGORY_COLORS[task.category || 'FRONTEND']}`}>
                                        {task.category || 'FRONTEND'}
                                    </div>
                                )}
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                    <User size={12} />
                                    Người thực hiện
                                </label>
                                {isEditing ? (
                                    usersLoading ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <select
                                            value={assigneeId}
                                            onChange={(e) => setAssigneeId(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                        >
                                            <option value="">-- Chưa gán --</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.fullName}</option>
                                            ))}
                                        </select>
                                    )
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                                        {task.assigneeAvatar ? (
                                            <img src={task.assigneeAvatar} alt="" className="w-6 h-6 rounded-full" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                                                {task.assigneeName?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <span className="text-sm">{task.assigneeName || 'Chưa gán'}</span>
                                    </div>
                                )}
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                    <Calendar size={12} />
                                    Hạn chót
                                </label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    />
                                ) : (
                                    <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm flex items-center gap-2">
                                        <Clock size={14} className="text-slate-400" />
                                        {task.dueDate || 'Chưa đặt'}
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                        <Tag size={12} />
                                        Tags
                                    </label>
                                    <div className="flex flex-wrap gap-1">
                                        {task.tags.map((tag, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Attachments */}
                            {task.attachments > 0 && (
                                <div className="text-xs text-slate-500">
                                    📎 {task.attachments} tệp đính kèm
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-slate-50 rounded-b-xl flex justify-between items-center">
                    <div>
                        {/* Delete button - only for Admin/Manager */}
                        {canEdit && !isEditing && (
                            <Button
                                variant="ghost"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                                <Trash2 size={16} className="mr-1" />
                                Xóa
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {isEditing ? (
                            <>
                                <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
                                    Hủy
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <LoadingSpinner size="sm" />
                                            <span className="ml-2">Đang lưu...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} className="mr-1" />
                                            Lưu thay đổi
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={onClose}>
                                    Đóng
                                </Button>
                                {/* Edit button - only for Admin/Manager */}
                                {canEdit && (
                                    <Button onClick={() => setIsEditing(true)}>
                                        <Edit2 size={16} className="mr-1" />
                                        Chỉnh sửa
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-xl">
                        <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle size={20} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa</h3>
                                    <p className="text-sm text-slate-500">Hành động này không thể hoàn tác</p>
                                </div>
                            </div>
                            <p className="text-slate-600 mb-6">
                                Bạn có chắc chắn muốn xóa task <strong>"{task.title}"</strong>?
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoadingSpinner size="sm" />
                                            <span className="ml-2">Đang xóa...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={16} className="mr-1" />
                                            Xóa task
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};



