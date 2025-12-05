import React, { useState, useEffect } from 'react';
import { Department, EmployeeProfile, Project } from '../../../../../shared/types';
import { useDepartments, useUsers, useProjects } from '../../../hooks';
import { DepartmentFormData } from '../../../hooks/useDepartments';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../../../components/ui';
import { Plus, Building, Users, Target, ArrowLeft, Edit2, TrendingUp, Award, Trash2, X, Search, Check } from 'lucide-react';

// Form Modal Component
interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => Promise<void>;
  initialData?: Department;
  departments: Department[];
  users: EmployeeProfile[];
  isLoading?: boolean;
}

const DepartmentFormModal = ({ isOpen, onClose, onSubmit, initialData, departments, users, isLoading }: DepartmentFormModalProps) => {
  const [formData, setFormData] = useState<DepartmentFormData>({
    code: '',
    name: '',
    managerName: '',
    managerAvatar: '',
    description: '',
    kpiStatus: 'On Track',
    parentDeptId: '',
  });
  
  const [managerSearch, setManagerSearch] = useState('');
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [selectedManager, setSelectedManager] = useState<EmployeeProfile | null>(null);

  // Lọc danh sách nhân viên theo tìm kiếm
  const getFilteredUsers = (): EmployeeProfile[] => {
    const userList = users || [];
    if (!managerSearch.trim()) return userList;
    const search = managerSearch.toLowerCase();
    return userList.filter(u => 
      u.fullName.toLowerCase().includes(search) || 
      u.employeeId?.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search)
    );
  };
  const filteredUsers = getFilteredUsers();

  // Sync form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        managerName: initialData.managerName || '',
        managerAvatar: initialData.managerAvatar || '',
        description: initialData.description || '',
        kpiStatus: initialData.kpiStatus || 'On Track',
        parentDeptId: initialData.parentDeptId || '',
      });
      // Tìm manager hiện tại
      const currentManager = users.find(u => u.fullName === initialData.managerName);
      setSelectedManager(currentManager || null);
      setManagerSearch('');
    } else {
      setFormData({
        code: '',
        name: '',
        managerName: '',
        managerAvatar: '',
        description: '',
        kpiStatus: 'On Track',
        parentDeptId: '',
      });
      setSelectedManager(null);
      setManagerSearch('');
    }
  }, [initialData, isOpen, users]);

  const handleSelectManager = (user: EmployeeProfile) => {
    setSelectedManager(user);
    setFormData(prev => ({
      ...prev,
      managerName: user.fullName,
      managerAvatar: user.avatarUrl,
    }));
    setShowManagerDropdown(false);
    setManagerSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã phòng ban *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 uppercase"
                placeholder="VD: TECH"
                maxLength={10}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên phòng ban *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="VD: Khối Công Nghệ"
              />
            </div>
          </div>

          {/* Trưởng phòng - Dropdown với tìm kiếm */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Trưởng phòng *</label>
            
            {/* Selected Manager Display */}
            {selectedManager ? (
              <div 
                className="flex items-center gap-3 p-3 border border-slate-300 rounded-lg cursor-pointer hover:border-brand-400"
                onClick={() => setShowManagerDropdown(!showManagerDropdown)}
              >
                <img src={selectedManager.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{selectedManager.fullName}</p>
                  <p className="text-xs text-slate-500">{selectedManager.employeeId} • {selectedManager.position}</p>
                </div>
                <X 
                  size={18} 
                  className="text-slate-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedManager(null);
                    setFormData(prev => ({ ...prev, managerName: '', managerAvatar: '' }));
                  }}
                />
              </div>
            ) : (
              <div 
                className="relative"
                onClick={() => setShowManagerDropdown(true)}
              >
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={managerSearch}
                  onChange={e => {
                    setManagerSearch(e.target.value);
                    setShowManagerDropdown(true);
                  }}
                  onFocus={() => setShowManagerDropdown(true)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Tìm theo tên hoặc mã nhân viên..."
                />
              </div>
            )}

            {/* Dropdown List */}
            {showManagerDropdown && !selectedManager && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  (filteredUsers as EmployeeProfile[]).map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                      onClick={() => handleSelectManager(emp)}
                    >
                      <img src={emp.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{emp.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{emp.employeeId} • {emp.position}</p>
                      </div>
                      {selectedManager && (selectedManager as EmployeeProfile).id === emp.id && (
                        <Check size={16} className="text-brand-600" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    Không tìm thấy nhân viên
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái KPI</label>
            <select
              value={formData.kpiStatus}
              onChange={e => setFormData(prev => ({ ...prev, kpiStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Behind">Behind</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phòng ban cha</label>
            <select
              value={formData.parentDeptId}
              onChange={e => setFormData(prev => ({ ...prev, parentDeptId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="">-- Không có --</option>
              {departments.filter(d => d.id !== initialData?.id).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="Mô tả về phòng ban..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading || !formData.managerName} className="flex-1">
              {isLoading ? 'Đang xử lý...' : (initialData ? 'Cập nhật' : 'Thêm mới')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  departmentName: string;
  isLoading?: boolean;
}

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, departmentName, isLoading }: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Xác nhận xóa</h3>
        <p className="text-slate-600 mb-6">
          Bạn có chắc chắn muốn xóa phòng ban <span className="font-semibold">"{departmentName}"</span>? 
          Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
          <Button 
            variant="outline" 
            onClick={onConfirm} 
            disabled={isLoading}
            className="flex-1 !bg-red-600 !text-white !border-red-600 hover:!bg-red-700"
          >
            {isLoading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </div>
      </div>
    </div>
  );
};


// Department Detail View
interface DepartmentDetailViewProps {
    department: Department;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    users: EmployeeProfile[];
    projects: Project[];
}

const DepartmentDetailView = ({ department, onBack, onEdit, onDelete, users, projects }: DepartmentDetailViewProps) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'projects'>('overview');
    
    // Lọc nhân viên thuộc phòng ban này
    const deptMembers = users.filter(u => u.department === department.name);
    
    // Số nhân sự thực tế từ database
    const actualMemberCount = deptMembers.length;
    
    const deptProjects = projects;

    return (
        <div className="animate-fadeIn">
            <div className="mb-8">
                <Button variant="outline" onClick={onBack} className="mb-4 text-xs h-8 px-2">
                    <ArrowLeft size={16} className="mr-1"/> Quay lại danh sách
                </Button>
                
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Building size={120} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-20 h-20 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100 shadow-sm">
                            <Building size={40} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{department.name}</h1>
                                    <p className="text-slate-500 max-w-2xl">{department.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={onEdit}>
                                        <Edit2 size={16} className="mr-2"/> Chỉnh sửa
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={onDelete}
                                        className="!text-red-600 !border-red-200 hover:!bg-red-50"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-6 mt-6">
                                <div className="flex items-center gap-3">
                                    <img src={department.managerAvatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt=""/>
                                    <div>
                                        <p className="text-xs text-slate-500">Trưởng phòng</p>
                                        <p className="font-semibold text-slate-900">{department.managerName}</p>
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-slate-200"></div>
                                <div>
                                    <p className="text-xs text-slate-500">Ngân sách (Năm)</p>
                                    <p className="font-semibold text-slate-900">{department.budget}</p>
                                </div>
                                <div className="w-px h-10 bg-slate-200"></div>
                                <div>
                                    <p className="text-xs text-slate-500">Trạng thái KPI</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${
                                        department.kpiStatus === 'On Track' ? 'bg-green-100 text-green-700' :
                                        department.kpiStatus === 'At Risk' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        <Target size={12} />
                                        {department.kpiStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex border-b border-slate-200 mb-6">
                {[
                    { id: 'overview', label: 'Tổng quan' },
                    { id: 'members', label: `Nhân sự (${actualMemberCount})` }, 
                    { id: 'projects', label: `Dự án (${deptProjects.length})` }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                                <TrendingUp size={20} className="mr-2 text-brand-600"/> Hiệu suất KPI
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">Hoàn thành dự án</span>
                                        <span className="font-bold text-slate-900">85%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">Tuyển dụng</span>
                                        <span className="font-bold text-slate-900">60%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">Đào tạo nội bộ</span>
                                        <span className="font-bold text-slate-900">40%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                                <Award size={20} className="mr-2 text-brand-600"/> Thành tích nổi bật (Q4/2024)
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0"></div>
                                    Hoàn thành vượt mức chỉ tiêu doanh số 110%.
                                </li>
                                <li className="flex gap-3 text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0"></div>
                                    Triển khai thành công hệ thống CRM mới.
                                </li>
                                <li className="flex gap-3 text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0"></div>
                                    Được bình chọn là "Phòng ban tiêu biểu" tháng 10.
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nhân viên</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vị trí</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {deptMembers.length > 0 ? deptMembers.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                                            <img src={u.avatarUrl} className="w-8 h-8 rounded-full" alt=""/>
                                            <div>
                                                <div className="font-medium text-slate-900">{u.fullName}</div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{u.position}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {u.status}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            Chưa có dữ liệu chi tiết nhân sự cho phòng ban này.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'projects' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                        {deptProjects.length > 0 ? deptProjects.map(p => (
                             <div key={p.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-brand-300 transition-colors">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{p.key}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>{p.status}</span>
                                </div>
                                <h4 className="font-bold text-slate-900 mb-2">{p.name}</h4>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                                    <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${p.progress}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>PM: {p.managerId}</span>
                                    <span>Deadline: {p.endDate}</span>
                                </div>
                             </div>
                        )) : (
                            <div className="col-span-2 text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                                Không có dự án nào đang hoạt động.
                            </div>
                        )}
                     </div>
                )}
            </div>
        </div>
    );
};


// Main Component
export const DepartmentManager = () => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { 
        departments, 
        loading: deptLoading, 
        error: deptError, 
        refetch: refetchDepts,
        createDepartment,
        updateDepartment,
        deleteDepartment,
    } = useDepartments();
    const { users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();
    const { projects, loading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjects();

    const loading = deptLoading || usersLoading || projectsLoading;
    const error = deptError || usersError || projectsError;

    // Helper: đếm số nhân viên thực tế thuộc phòng ban
    const getMemberCount = (deptName: string) => {
        return users.filter(u => u.department === deptName).length;
    };

    const handleRefetch = () => {
        refetchDepts();
        refetchUsers();
        refetchProjects();
    };

    const handleViewDetail = (dept: Department) => {
        setSelectedDept(dept);
        setView('detail');
    };

    const handleBack = () => {
        setSelectedDept(null);
        setView('list');
    };

    const handleOpenCreate = () => {
        setEditingDept(undefined);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (dept: Department) => {
        setEditingDept(dept);
        setIsFormOpen(true);
    };

    const handleOpenDelete = (dept: Department) => {
        setSelectedDept(dept);
        setIsDeleteOpen(true);
    };

    const handleFormSubmit = async (data: DepartmentFormData) => {
        setIsSubmitting(true);
        try {
            if (editingDept) {
                const updated = await updateDepartment(editingDept.id, data);
                if (selectedDept?.id === editingDept.id) {
                    setSelectedDept(updated);
                }
            } else {
                await createDepartment(data);
            }
            setIsFormOpen(false);
            setEditingDept(undefined);
        } catch (err) {
            console.error('Error saving department:', err);
            alert('Có lỗi xảy ra khi lưu phòng ban');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDept) return;
        setIsSubmitting(true);
        try {
            await deleteDepartment(selectedDept.id);
            setIsDeleteOpen(false);
            setSelectedDept(null);
            setView('list');
        } catch (err) {
            console.error('Error deleting department:', err);
            alert('Có lỗi xảy ra khi xóa phòng ban');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner text="Đang tải danh sách phòng ban..." />;
    if (error) return <ErrorMessage message={error} onRetry={handleRefetch} />;

    if (view === 'detail' && selectedDept) {
        return (
            <>
                <DepartmentDetailView 
                    department={selectedDept} 
                    onBack={handleBack} 
                    onEdit={() => handleOpenEdit(selectedDept)}
                    onDelete={() => handleOpenDelete(selectedDept)}
                    users={users} 
                    projects={projects} 
                />
                <DepartmentFormModal
                    isOpen={isFormOpen}
                    onClose={() => { setIsFormOpen(false); setEditingDept(undefined); }}
                    onSubmit={handleFormSubmit}
                    initialData={editingDept}
                    departments={departments}
                    users={users}
                    isLoading={isSubmitting}
                />
                <DeleteConfirmModal
                    isOpen={isDeleteOpen}
                    onClose={() => setIsDeleteOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    departmentName={selectedDept.name}
                    isLoading={isSubmitting}
                />
            </>
        );
    }

    const topLevelDepartments = departments.filter(d => !d.parentDeptId || d.parentDeptId === 'bod');

    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Danh sách Phòng ban</h1>
                    <p className="text-slate-500 mt-1">Quản lý cơ cấu tổ chức và thông tin các khối phòng ban.</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <Plus size={18} className="mr-2"/> Thêm phòng ban
                </Button>
            </div>

            {topLevelDepartments.length === 0 ? (
                <EmptyState title="Chưa có phòng ban" message="Bắt đầu bằng cách thêm phòng ban mới." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {topLevelDepartments.map(dept => (
                        <div key={dept.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                            <div className="p-6 cursor-pointer" onClick={() => handleViewDetail(dept)}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-slate-50 rounded-lg text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                        <Building size={24} />
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(dept); }}
                                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded"
                                        >
                                            <Edit2 size={16}/>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenDelete(dept); }}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-2">{dept.name}</h3>
                                <p className="text-sm text-slate-500 mb-6 line-clamp-2 min-h-[40px]">{dept.description}</p>

                                <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <img src={dept.managerAvatar} alt={dept.managerName} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <p className="text-xs text-slate-500">Trưởng phòng</p>
                                        <p className="text-sm font-bold text-slate-900">{dept.managerName}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                    <div>
                                        <div className="flex items-center text-slate-500 mb-1">
                                            <Users size={14} className="mr-1.5"/> <span className="text-xs">Nhân sự</span>
                                        </div>
                                        <span className="font-semibold text-slate-800">{getMemberCount(dept.name)}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center text-slate-500 mb-1">
                                            <Target size={14} className="mr-1.5"/> <span className="text-xs">KPI Status</span>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            dept.kpiStatus === 'On Track' ? 'bg-green-100 text-green-700' :
                                            dept.kpiStatus === 'At Risk' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>{dept.kpiStatus}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 rounded-b-xl flex justify-between items-center text-xs">
                                <span className="text-slate-500">Budget: <span className="font-medium text-slate-700">{dept.budget}</span></span>
                                <button 
                                    className="text-brand-600 font-medium hover:underline" 
                                    onClick={() => handleViewDetail(dept)}
                                >
                                    Chi tiết
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <DepartmentFormModal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingDept(undefined); }}
                onSubmit={handleFormSubmit}
                initialData={editingDept}
                departments={departments}
                users={users}
                isLoading={isSubmitting}
            />
            <DeleteConfirmModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                departmentName={selectedDept?.name || ''}
                isLoading={isSubmitting}
            />
        </div>
    );
};
