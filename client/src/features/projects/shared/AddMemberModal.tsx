import { useState, useEffect } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useUsers } from '../../../hooks';
import { EmployeeProfile } from '../../../../shared/types';

interface AddMemberModalProps {
  projectId: string;
  existingMemberIds: string[];
  onAdd: (userId: string, role: 'MANAGER' | 'LEADER' | 'MEMBER' | 'VIEWER') => Promise<void>;
  onClose: () => void;
}

type MemberRole = 'MANAGER' | 'LEADER' | 'MEMBER' | 'VIEWER';

const ROLE_LABELS: Record<MemberRole, string> = {
  MANAGER: 'Quản lý',
  LEADER: 'Trưởng nhóm',
  MEMBER: 'Thành viên',
  VIEWER: 'Người xem',
};

const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  MANAGER: 'Toàn quyền quản lý dự án',
  LEADER: 'Quản lý tasks và thành viên',
  MEMBER: 'Xem và cập nhật tasks được giao',
  VIEWER: 'Chỉ xem, không chỉnh sửa',
};

export const AddMemberModal = ({
  projectId,
  existingMemberIds,
  onAdd,
  onClose,
}: AddMemberModalProps) => {
  const { users, loading: usersLoading } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRole>('MEMBER');
  const [adding, setAdding] = useState(false);

  // Filter out existing members
  const availableUsers = users.filter(
    user => !existingMemberIds.includes(user.id)
  );

  // Filter by search query
  const filteredUsers = availableUsers.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedUserId) return;
    
    setAdding(true);
    try {
      await onAdd(selectedUserId, selectedRole);
      onClose();
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Thêm thành viên</h2>
            <p className="text-sm text-slate-500 mt-1">Chọn người dùng để thêm vào dự án</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc chức vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
            />
          </div>

          {/* User List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {usersLoading ? (
              <div className="text-center py-8 text-slate-500">Đang tải...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {searchQuery ? 'Không tìm thấy người dùng' : 'Tất cả người dùng đã là thành viên'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedUserId === user.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatarUrl || 'https://via.placeholder.com/40'}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate">{user.fullName}</h4>
                      <p className="text-sm text-slate-500 truncate">{user.position}</p>
                      <p className="text-xs text-slate-400 truncate">{user.department}</p>
                    </div>
                    {selectedUserId === user.id && (
                      <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Role Selection */}
          {selectedUserId && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Vai trò trong dự án</h3>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(ROLE_LABELS) as MemberRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedRole === role
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 text-sm">{ROLE_LABELS[role]}</div>
                    <div className="text-xs text-slate-500 mt-1">{ROLE_DESCRIPTIONS[role]}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedUserId || adding}
            className="flex items-center gap-2"
          >
            {adding ? (
              'Đang thêm...'
            ) : (
              <>
                <UserPlus size={16} />
                Thêm thành viên
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

