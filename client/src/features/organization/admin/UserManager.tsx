import React, { useState, useEffect } from 'react';
import { EmployeeProfile, LinkedAccount } from '../../../../../shared/types';
import { useUsers } from '../../../hooks';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../../../components/ui';
import { Plus, Edit2, Trash2, ArrowLeft, Mail, Phone, Clock, Shield, Link as LinkIcon, CheckCircle2, Save, Key } from 'lucide-react';

export const UserManager = () => {
    const { users: apiUsers, loading, error, refetch } = useUsers();
    const [view, setView] = useState<'list' | 'detail' | 'form'>('list');
    const [users, setUsers] = useState<EmployeeProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<EmployeeProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (apiUsers) {
            setUsers(apiUsers);
        }
    }, [apiUsers]);

    const handleViewDetail = (user: EmployeeProfile) => {
        setSelectedUser(user);
        setView('detail');
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setIsEditing(false);
        setView('form');
    };

    const handleEdit = (user: EmployeeProfile) => {
        setSelectedUser(user);
        setIsEditing(true);
        setView('form');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa nhân sự này không?')) {
            setUsers(users.filter(u => u.id !== id));
            if (selectedUser?.id === id) setView('list');
        }
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Đã lưu thông tin nhân sự thành công!');
        setView('list');
    };

    if (loading) return <LoadingSpinner text="Đang tải danh sách nhân sự..." />;
    if (error) return <ErrorMessage message={error} onRetry={refetch} />;


    const UserListView = () => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
            {users.length === 0 ? (
                <EmptyState title="Chưa có nhân sự" message="Bắt đầu bằng cách thêm nhân sự mới." />
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nhân viên</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã NV / Vị trí</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vai trò</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewDetail(u)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="h-10 w-10 rounded-full object-cover border" src={u.avatarUrl} alt="" />
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-slate-900">{u.fullName}</div>
                                                <div className="text-sm text-slate-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900 font-mono">{u.employeeId}</div>
                                        <div className="text-xs text-slate-500">{u.position}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                                            u.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            u.role === 'Manager' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                                        }`}>{u.role}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            u.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleEdit(u)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDelete(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );


    const UserProfileView = ({ user }: { user: EmployeeProfile }) => (
        <div className="animate-fadeIn">
            <div className="mb-6 flex items-center justify-between">
                <Button variant="outline" onClick={() => setView('list')} className="p-2 h-10 w-10"><ArrowLeft size={18}/></Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleDelete(user.id)} className="text-red-600 hover:bg-red-50 border-red-200">
                        <Trash2 size={16} className="mr-2"/> Xóa
                    </Button>
                    <Button onClick={() => handleEdit(user)}><Edit2 size={16} className="mr-2"/> Chỉnh sửa</Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
                        <img src={user.avatarUrl} alt={user.fullName} className="w-32 h-32 rounded-full border-4 border-slate-100 object-cover mx-auto mb-4"/>
                        <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
                        <p className="text-slate-500 text-sm mb-4">{user.position} • {user.department}</p>
                        <div className="flex justify-center gap-2">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{user.role}</span>
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full font-mono">{user.employeeId}</span>
                        </div>
                        <div className="mt-6 pt-6 border-t space-y-3 text-left">
                            <div className="flex items-center text-sm text-slate-600"><Mail size={16} className="mr-3 text-slate-400"/> {user.email}</div>
                            <div className="flex items-center text-sm text-slate-600"><Phone size={16} className="mr-3 text-slate-400"/> {user.phone}</div>
                            <div className="flex items-center text-sm text-slate-600"><Clock size={16} className="mr-3 text-slate-400"/> Gia nhập: {user.joinDate}</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center"><Shield size={18} className="mr-2 text-brand-600"/> Bảo mật</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between"><span className="text-slate-600">2FA</span><span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">Đã bật</span></div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h3 className="font-bold text-slate-900 text-lg flex items-center mb-4"><LinkIcon size={20} className="mr-2 text-slate-500"/> Tài khoản liên kết</h3>
                        <div className="space-y-4">
                            {user.linkedAccounts?.map((acc: LinkedAccount, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50">
                                    <div>
                                        <div className="font-semibold text-slate-900 capitalize">{acc.provider}</div>
                                        <div className="text-xs text-slate-500">{acc.email}</div>
                                    </div>
                                    {acc.connected && <CheckCircle2 size={16} className="text-green-600"/>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );


    const UserForm = () => (
        <div className="animate-fadeIn max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="outline" onClick={() => setView('list')} className="p-2 h-10 w-10"><ArrowLeft size={18} /></Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}</h1>
                    <p className="text-slate-500 text-sm">Điền đầy đủ thông tin hồ sơ.</p>
                </div>
            </div>
            <form onSubmit={handleSaveUser} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-8 space-y-8">
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4 pb-2 border-b">Thông tin cá nhân</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Họ và tên" defaultValue={selectedUser?.fullName} required />
                            <Input label="Email" type="email" defaultValue={selectedUser?.email} required />
                            <Input label="Số điện thoại" defaultValue={selectedUser?.phone} />
                            <Input label="Mã nhân viên" defaultValue={selectedUser?.employeeId} />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4 pb-2 border-b">Thông tin công việc</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Chức danh" defaultValue={selectedUser?.position} />
                            <Input label="Ngày gia nhập" type="date" />
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Vai trò</label>
                                <select className="w-full bg-slate-50 border rounded-md p-2.5 text-sm" defaultValue={selectedUser?.role}>
                                    <option value="Employee">Employee</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    {!isEditing && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                            <Key size={18} className="text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-blue-800">Mật khẩu mặc định</p>
                                <p className="text-xs text-blue-600 mt-1">Mật khẩu sẽ được gửi đến email.</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-slate-50 px-8 py-4 border-t flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setView('list')}>Hủy</Button>
                    <Button type="submit"><Save size={18} className="mr-2" /> {isEditing ? 'Lưu' : 'Tạo'}</Button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="w-full h-full">
            {view === 'list' && (
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Danh sách Nhân sự</h1>
                        <p className="text-slate-500 mt-1">Quản lý hồ sơ nhân viên và tài khoản hệ thống.</p>
                    </div>
                    <Button onClick={handleCreate}><Plus size={18} className="mr-2"/> Thêm nhân sự</Button>
                </div>
            )}
            {view === 'list' && <UserListView />}
            {view === 'detail' && selectedUser && <UserProfileView user={selectedUser} />}
            {view === 'form' && <UserForm />}
        </div>
    );
};

// Compact Table used in Dashboard Overview
export const UserTableWidget = () => {
    const { users, loading, error } = useUsers();
    
    if (loading) return <LoadingSpinner size="sm" />;
    if (error) return <ErrorMessage message={error} />;
    
    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-full">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900">Nhân sự mới gia nhập</h3>
                <Button variant="ghost" className="text-xs h-8">Xem tất cả</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nhân viên</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phòng ban</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {users.slice(0, 5).map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <img className="h-8 w-8 rounded-full object-cover border" src={u.avatarUrl} alt="" />
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-slate-900">{u.fullName}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                        u.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>{u.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
