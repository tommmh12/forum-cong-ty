import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { GitBranch, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useWorkflows, Workflow } from '../../../hooks';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';

export const WorkflowDesigner = () => {
    const { workflows, loading, error, createWorkflow, updateWorkflow, deleteWorkflow, refresh } = useWorkflows();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState<{ name: string; description: string; steps: string[] }>({
        name: '',
        description: '',
        steps: ['To Do', 'In Progress', 'Done'],
    });
    const [newStep, setNewStep] = useState('');

    const handleEdit = (workflow: Workflow) => {
        setEditingId(workflow.id);
        setFormData({
            name: workflow.name,
            description: workflow.description || '',
            steps: [...workflow.steps],
        });
    };

    const handleSave = async (id?: string) => {
        try {
            if (id) {
                await updateWorkflow(id, formData);
            } else {
                await createWorkflow(formData);
                setShowCreateModal(false);
                setFormData({ name: '', description: '', steps: ['To Do', 'In Progress', 'Done'] });
            }
            setEditingId(null);
        } catch (error) {
            console.error('Error saving workflow:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc muốn xóa workflow này?')) {
            try {
                await deleteWorkflow(id);
            } catch (error) {
                console.error('Error deleting workflow:', error);
            }
        }
    };

    const addStep = () => {
        if (newStep.trim()) {
            setFormData({ ...formData, steps: [...formData.steps, newStep.trim()] });
            setNewStep('');
        }
    };

    const removeStep = (index: number) => {
        setFormData({ ...formData, steps: formData.steps.filter((_, i) => i !== index) });
    };

    if (loading) {
        return <LoadingSpinner size="lg" text="Đang tải workflows..." />;
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={refresh} />;
    }

    return (
        <div className="animate-fadeIn space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div>
                   <h1 className="text-2xl font-bold text-slate-900">Thiết kế Quy trình (Workflows)</h1>
                   <p className="text-slate-500 mt-1">Định nghĩa các luồng làm việc tự động cho từng phòng ban.</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} className="mr-2" /> Tạo quy trình
                </Button>
            </div>

            <div className="grid gap-6">
                {workflows.map((wf) => (
                    <div key={wf.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        {editingId === wf.id ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tên workflow</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Các bước</label>
                                    <div className="space-y-2">
                                        {formData.steps.map((step, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={step}
                                                    onChange={(e) => {
                                                        const newSteps = [...formData.steps];
                                                        newSteps[idx] = e.target.value;
                                                        setFormData({ ...formData, steps: newSteps });
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                                />
                                                <button
                                                    onClick={() => removeStep(idx)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newStep}
                                                onChange={(e) => setNewStep(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addStep()}
                                                placeholder="Thêm bước mới..."
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                            />
                                            <Button size="sm" onClick={addStep}>
                                                <Plus size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setEditingId(null)}>
                                        Hủy
                                    </Button>
                                    <Button onClick={() => handleSave(wf.id)}>
                                        <Save size={16} className="mr-2" /> Lưu
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                            <GitBranch size={20} className="text-brand-600"/> {wf.name}
                                            {wf.isDefault && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                                    Mặc định
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">{wf.description || 'Không có mô tả'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(wf)}>
                                            <Edit2 size={14} className="mr-1" /> Chỉnh sửa
                                        </Button>
                                        {!wf.isDefault && (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleDelete(wf.id)}
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                <Trash2 size={14} className="mr-1" /> Xóa
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Visualizer */}
                                <div className="relative">
                                   <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 transform -translate-y-1/2"></div>
                                   <div className="flex justify-between items-center gap-2">
                                        {wf.steps.map((step, idx) => (
                                            <div key={idx} className="flex-1 bg-white p-3 rounded-lg border border-slate-300 shadow-sm text-center">
                                                <div className="text-sm font-semibold text-slate-700">{step}</div>
                                            </div>
                                        ))}
                                   </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Tạo workflow mới</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên workflow</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                    placeholder="Ví dụ: Quy trình Marketing"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                    rows={2}
                                    placeholder="Mô tả ngắn về workflow này..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Các bước</label>
                                <div className="space-y-2">
                                    {formData.steps.map((step, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={step}
                                                onChange={(e) => {
                                                    const newSteps = [...formData.steps];
                                                    newSteps[idx] = e.target.value;
                                                    setFormData({ ...formData, steps: newSteps });
                                                }}
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                            />
                                            <button
                                                onClick={() => removeStep(idx)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newStep}
                                            onChange={(e) => setNewStep(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addStep()}
                                            placeholder="Thêm bước mới..."
                                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                        />
                                        <Button size="sm" onClick={addStep}>
                                            <Plus size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => {
                                setShowCreateModal(false);
                                setFormData({ name: '', description: '', steps: ['To Do', 'In Progress', 'Done'] });
                            }}>
                                Hủy
                            </Button>
                            <Button onClick={() => handleSave()} disabled={!formData.name || formData.steps.length === 0}>
                                <Save size={16} className="mr-2" /> Tạo workflow
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
