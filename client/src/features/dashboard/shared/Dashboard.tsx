import React, { useState } from 'react';
import { User, UserRole } from '../../../../../shared/types';
import { Button } from '../../../components/ui/Button';
import {
  LogOut,
  LayoutDashboard,
  Settings,
  Bell,
  Search,
  Briefcase,
  MessageSquare,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Building,
  Menu,
  FolderOpen
} from 'lucide-react';

// Import Feature Modules from admin
import { Overview, ResourceManagement } from '../admin';

// Import from migrated feature modules
import { ProjectModule, KanbanBoard, ProjectProvider } from '../../projects';
import { WorkflowDesigner, TaskSettings } from '../../projects/admin';
import { DepartmentManager, UserManager, UserTableWidget } from '../../organization/admin';
import { OrgChart } from '../../organization/shared';
import { MeetingAdmin } from '../../workspace/admin';
import { EmployeeListPage } from '../../employees/pages';
import { AccountSettings } from '../../auth';
import { ForumPage } from '../../forum/pages/ForumPage';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
  badgeColor?: string;
  children?: MenuItem[];
  roles?: UserRole[];
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
    children: [
      { id: 'overview', label: 'Tổng quan hệ thống', roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { id: 'resources', label: 'Tài nguyên & Hiệu suất', roles: [UserRole.ADMIN] },
    ]
  },
  {
    id: 'project-management',
    label: 'Quản lý Dự án & Việc',
    icon: FolderOpen,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
    children: [
      { id: 'pm-projects', label: 'Dự án (Projects)', roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { id: 'pm-board', label: 'Bảng công việc (Kanban)', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { id: 'pm-workflows', label: 'Thiết kế Quy trình', roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { id: 'pm-settings', label: 'Cấu hình (Loại/Nhãn)', roles: [UserRole.ADMIN] },
    ]
  },
  {
    id: 'organization',
    label: 'Quản trị Tổ chức',
    icon: Building,
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    children: [
      { id: 'org-chart', label: 'Sơ đồ tổ chức', roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { id: 'departments', label: 'Danh sách Phòng ban', roles: [UserRole.ADMIN] },
      { id: 'employees', label: 'Quản lý Nhân viên', roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { id: 'users', label: 'Danh sách Nhân sự', roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { id: 'roles', label: 'Phân quyền (Roles)', roles: [UserRole.ADMIN] },
    ]
  },
  {
    id: 'workspace',
    label: 'Tiện ích Văn phòng',
    icon: Briefcase,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
    children: [
      { id: 'meeting-admin', label: 'Quản trị Phòng họp', roles: [UserRole.ADMIN] },
    ]
  },
  {
    id: 'communication',
    label: 'Quản trị Giao tiếp',
    icon: MessageSquare,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
    children: [
      { id: 'forum', label: 'Diễn đàn', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { id: 'chat-config', label: 'Cấu hình Chat', roles: [UserRole.ADMIN] },
      { id: 'forum-config', label: 'Cấu hình Diễn đàn', roles: [UserRole.ADMIN] },
    ]
  },
  {
    id: 'moderation',
    label: 'Kiểm duyệt & An toàn',
    icon: ShieldAlert,
    badge: 3,
    badgeColor: 'bg-red-500',
    roles: [UserRole.ADMIN],
    children: [
      { id: 'mod-reports', label: 'Báo cáo vi phạm', roles: [UserRole.ADMIN] },
      { id: 'mod-audit', label: 'Audit Logs', roles: [UserRole.ADMIN] },
    ]
  },
  {
    id: 'system',
    label: 'Hệ thống',
    icon: Settings,
    children: [
      { id: 'account-settings', label: 'Cài đặt tài khoản', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { id: 'integrations', label: 'Tích hợp API', roles: [UserRole.ADMIN] },
      { id: 'general-settings', label: 'Cài đặt chung', roles: [UserRole.ADMIN] },
    ]
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState<string>('overview');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard', 'organization', 'project-management']);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getBreadcrumb = () => {
    for (const group of MENU_ITEMS) {
      if (group.id === activeMenu) return group.label;
      if (group.children) {
        const child = group.children.find(c => c.id === activeMenu);
        if (child) return `${group.label} / ${child.label}`;
      }
    }
    return 'Dashboard';
  };

  // Content Renderer Switch
  const renderContent = () => {
    switch (activeMenu) {
      case 'overview': return (
        <>
          <Overview />
          <div className="mt-8">
            <UserTableWidget />
          </div>
        </>
      );
      case 'resources': return <ResourceManagement />;
      case 'pm-projects': return <ProjectModule />;
      case 'pm-board': return <KanbanBoard />;
      case 'pm-workflows': return <WorkflowDesigner />;
      case 'pm-settings': return <TaskSettings />;
      case 'departments': return <DepartmentManager />;
      case 'org-chart': return <OrgChart />;
      case 'employees': return <EmployeeListPage />;
      case 'users': return <UserManager />;
      case 'meeting-admin': return <MeetingAdmin />;
      case 'forum': return <ForumPage />;
      case 'account-settings': return <AccountSettings userId={user.id} userEmail={user.email} userName={user.name} />;
      default: return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fadeIn">
          <div className="bg-slate-100 p-6 rounded-full mb-4">
            <Briefcase size={48} className="text-slate-300" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Tính năng đang phát triển</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            Module <span className="font-medium text-slate-800">{getBreadcrumb()}</span> đang được xây dựng. Vui lòng quay lại sau.
          </p>
          <Button className="mt-6" onClick={() => setActiveMenu('overview')}>
            Quay về Dashboard
          </Button>
        </div>
      );
    }
  }


  return (
    <ProjectProvider>
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out shadow-xl
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0
        `}
      >
        <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl text-white tracking-tight">
            <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center">N</div>
            <span>NEXUS <span className="text-slate-500 font-normal text-sm ml-1">ADMIN</span></span>
          </div>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)] custom-scrollbar">
          <div className="mb-6">
            <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
            {/* Sidebar Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
              {MENU_ITEMS.filter(item => !item.roles || item.roles.includes(user.role)).map((item) => (
                <div key={item.id} className="mb-2">
                  {item.children ? (
                    // Menu Item with Submenu
                    <div>
                      <button
                        onClick={() => toggleMenu(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${expandedMenus.includes(item.id) || activeMenu === item.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon && <item.icon size={20} className={expandedMenus.includes(item.id) || activeMenu === item.id ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />}
                          <span className="font-medium text-sm">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-brand-500'} text-white`}>
                              {item.badge}
                            </span>
                          )}
                          {expandedMenus.includes(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      </button>

                      {/* Submenu */}
                      {expandedMenus.includes(item.id) && (
                        <div className="mt-1 ml-4 space-y-0.5 border-l border-slate-800 pl-2">
                          {item.children.filter(sub => !sub.roles || sub.roles.includes(user.role)).map((subItem) => (
                            <button
                              key={subItem.id}
                              onClick={() => setActiveMenu(subItem.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm ${activeMenu === subItem.id
                                ? 'bg-brand-600/10 text-brand-400 font-medium'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                                }`}
                            >
                              {subItem.label}
                              {subItem.badge && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${subItem.badgeColor || 'bg-slate-700'} text-white`}>
                                  {subItem.badge}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Single Menu Item
                    <button
                      onClick={() => setActiveMenu(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${activeMenu === item.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                      {item.icon && <item.icon size={20} className={activeMenu === item.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />}
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.badge && (
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-brand-500'} text-white`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-2">Storage Usage</p>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>750GB</span>
                <span>1TB</span>
              </div>
            </div>
          </div>
        </div>
      </aside>


      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 mr-4"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex text-sm font-medium text-slate-500">
              <span className="text-slate-400 mr-2">Hệ thống</span> / <span className="text-slate-800 ml-2">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-md text-sm focus:ring-2 focus:ring-brand-500 w-64 transition-all"
                placeholder="Tìm kiếm (Ctrl + K)"
              />
              <Search size={16} className="absolute left-3 top-2 text-slate-400" />
            </div>

            <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-blue-50 rounded-full relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
              <div className="relative group">
                <button className="flex items-center gap-2">
                  <img className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-brand-200 transition-all" src={user.avatarUrl} alt={user.name} />
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
                </button>
                {/* Dropdown would go here */}
              </div>
              <Button variant="ghost" onClick={onLogout} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
    </ProjectProvider>
  );
};
