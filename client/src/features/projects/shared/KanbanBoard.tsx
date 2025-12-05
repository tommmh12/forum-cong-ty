import React, { useState, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { Kanban, List, MoreHorizontal, Link2, Filter, Plus, RefreshCw } from 'lucide-react';
import { WebTask, TaskCategory, TaskColumn } from '../../../../../shared/types';
import { useProjectContext } from '../context/ProjectContext';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailModal } from './TaskDetailModal';

type GroupBy = 'column' | 'category';

const CATEGORY_COLORS: Record<TaskCategory, { bg: string; text: string; border: string }> = {
  FRONTEND: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  BACKEND: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  DESIGN: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
  DEVOPS: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  QA: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
};

const CATEGORY_INFO: Record<TaskCategory, { name: string; color: string }> = {
  FRONTEND: { name: 'Frontend', color: 'border-blue-500' },
  BACKEND: { name: 'Backend', color: 'border-green-500' },
  DESIGN: { name: 'Design', color: 'border-pink-500' },
  DEVOPS: { name: 'DevOps', color: 'border-purple-500' },
  QA: { name: 'QA', color: 'border-amber-500' },
};

const COLUMN_COLORS: Record<string, string> = {
  'Backlog': 'border-slate-300',
  'To Do': 'border-slate-400',
  'In Progress': 'border-blue-500',
  'Review': 'border-purple-500',
  'Done': 'border-green-500',
};

export const KanbanBoard: React.FC = () => {
  const {
    tasks,
    columns,
    tasksLoading,
    tasksError,
    selectedProject,
    selectedProjectId,
    projects,
    selectProject,
    fetchTasks,
    moveTask,
  } = useProjectContext();

  const [groupBy, setGroupBy] = useState<GroupBy>('column');
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'ALL'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [preselectedColumnId, setPreselectedColumnId] = useState<string | undefined>();
  const [selectedTask, setSelectedTask] = useState<WebTask | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleTaskClick = (task: WebTask) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
  };

  // Filter tasks by category
  const filteredTasks = useMemo(() => {
    if (filterCategory === 'ALL') return tasks;
    return tasks.filter(t => t.category === filterCategory);
  }, [tasks, filterCategory]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'column') {
      const grouped: Record<string, WebTask[]> = {};
      columns.forEach(col => {
        grouped[col.id] = filteredTasks.filter(t => t.columnId === col.id);
      });
      return grouped;
    } else {
      const grouped: Record<TaskCategory, WebTask[]> = {
        FRONTEND: [], BACKEND: [], DESIGN: [], DEVOPS: [], QA: [],
      };
      filteredTasks.forEach(t => {
        if (t.category && grouped[t.category]) {
          grouped[t.category].push(t);
        }
      });
      return grouped;
    }
  }, [filteredTasks, groupBy, columns]);

  const getColumnColor = (colName: string) => {
    return COLUMN_COLORS[colName] || 'border-slate-300';
  };

  const handleAddTaskToColumn = (columnId: string) => {
    setPreselectedColumnId(columnId);
    setIsCreateModalOpen(true);
  };

  const handleAddTask = () => {
    setPreselectedColumnId(columns[0]?.id);
    setIsCreateModalOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      try {
        await moveTask(taskId, { columnId: targetColumnId });
      } catch (error) {
        console.error('Failed to move task:', error);
      }
    }
  };

  const renderTaskCard = (task: WebTask) => {
    const categoryColor = task.category ? CATEGORY_COLORS[task.category] : CATEGORY_COLORS.FRONTEND;
    const hasDependencies = task.dependencies && task.dependencies.length > 0;

    return (
      <div 
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onClick={() => handleTaskClick(task)}
        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-300 cursor-pointer transition-all"
      >
        <div className="flex justify-between items-start mb-2">
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}`}>
            {task.category || 'FRONTEND'}
          </span>
          <button className="text-slate-400 hover:text-slate-600" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal size={14}/>
          </button>
        </div>
        <h4 className="text-sm font-semibold text-slate-800 mb-2 leading-snug">{task.title}</h4>
        <p className="text-xs text-slate-500 mb-3">{task.code}</p>
        
        {/* Dependencies indicator */}
        {hasDependencies && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
            <Link2 size={12} />
            <span>{task.dependencies?.length} dependencies</span>
          </div>
        )}
        
        {/* Commit reference */}
        {task.commitReference && (
          <div className="text-xs text-slate-400 mb-2">
            <code className="bg-slate-100 px-1 rounded">{task.commitReference}</code>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          {task.assigneeAvatar ? (
            <img src={task.assigneeAvatar} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
              {task.assigneeName?.charAt(0) || '?'}
            </div>
          )}
          <div className={`w-2 h-2 rounded-full ${
            task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-red-500' : 
            task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
          }`}></div>
        </div>
      </div>
    );
  };

  // Show loading state
  if (tasksLoading && tasks.length === 0) {
    return (
      <div className="animate-fadeIn h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bảng công việc</h1>
            <p className="text-slate-500 mt-1">Đang tải dữ liệu...</p>
          </div>
        </div>
        <LoadingSpinner size="lg" text="Đang tải bảng công việc..." />
      </div>
    );
  }

  // Show error state
  if (tasksError) {
    return (
      <div className="animate-fadeIn h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bảng công việc</h1>
          </div>
        </div>
        <ErrorMessage message={tasksError} onRetry={fetchTasks} />
      </div>
    );
  }

  // Show empty state when no project selected
  if (!selectedProjectId) {
    return (
      <div className="animate-fadeIn h-full flex flex-col items-center justify-center text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
          <Kanban size={48} className="text-slate-300" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Chưa chọn dự án</h2>
        <p className="text-slate-500 mt-2 max-w-md">
          Vui lòng chọn một dự án để xem bảng công việc.
        </p>
        {projects.length > 0 && (
          <select 
            className="mt-4 px-4 py-2 border border-slate-200 rounded-lg text-sm"
            onChange={(e) => selectProject(e.target.value)}
            value=""
          >
            <option value="">-- Chọn dự án --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fadeIn h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bảng công việc</h1>
          <p className="text-slate-500 mt-1">
            {selectedProject ? (
              <>
                Dự án: <span className="font-medium text-slate-700">{selectedProject.name}</span>
                <span className="mx-2">•</span>
                <span className="text-slate-400">{tasks.length} tasks</span>
              </>
            ) : (
              'Theo dõi trạng thái công việc thời gian thực.'
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Project Selector */}
          <select 
            value={selectedProjectId || ''} 
            onChange={(e) => selectProject(e.target.value || null)}
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Refresh Button */}
          <button 
            onClick={fetchTasks}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
            title="Refresh"
          >
            <RefreshCw size={16} className={tasksLoading ? 'animate-spin' : ''} />
          </button>

          {/* Filter by category */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value as TaskCategory | 'ALL')}
              className="text-sm border border-slate-200 rounded-md px-2 py-1.5"
            >
              <option value="ALL">All Categories</option>
              <option value="FRONTEND">Frontend</option>
              <option value="BACKEND">Backend</option>
              <option value="DESIGN">Design</option>
              <option value="DEVOPS">DevOps</option>
              <option value="QA">QA</option>
            </select>
          </div>
          
          {/* Group by toggle */}
          <div className="flex bg-white border border-slate-200 rounded-md p-1">
            <button 
              className={`px-3 py-1.5 rounded text-xs font-medium ${groupBy === 'column' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
              onClick={() => setGroupBy('column')}
            >
              By Status
            </button>
            <button 
              className={`px-3 py-1.5 rounded text-xs font-medium ${groupBy === 'category' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
              onClick={() => setGroupBy('category')}
            >
              By Category
            </button>
          </div>
          
          <div className="flex bg-white border border-slate-200 rounded-md p-1">
            <button className="p-1.5 rounded bg-slate-100 text-slate-900 shadow-sm"><Kanban size={18}/></button>
            <button className="p-1.5 rounded text-slate-400 hover:bg-slate-50"><List size={18}/></button>
          </div>
          <Button onClick={handleAddTask}>
            <Plus size={16} className="mr-1" /> Task mới
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 min-w-[1000px] h-full pb-4">
          {groupBy === 'column' ? (
            // Group by column/status
            columns.map(col => (
              <div 
                key={col.id} 
                className="flex-1 min-w-[280px] bg-slate-100/50 rounded-xl flex flex-col max-h-[calc(100vh-200px)]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className={`p-4 border-t-4 ${getColumnColor(col.name)} bg-slate-100 rounded-t-xl flex justify-between items-center`}>
                  <h3 className="font-bold text-slate-700 text-sm">{col.name}</h3>
                  <span className="bg-white text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {(groupedTasks as Record<string, WebTask[]>)[col.id]?.length || 0}
                  </span>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                  {((groupedTasks as Record<string, WebTask[]>)[col.id] || []).map(renderTaskCard)}
                  <button 
                    className="w-full py-2 text-slate-500 text-sm font-medium hover:bg-slate-200 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 transition-colors"
                    onClick={() => handleAddTaskToColumn(col.id)}
                  >
                    + Thêm thẻ
                  </button>
                </div>
              </div>
            ))
          ) : (
            // Group by category
            (Object.keys(CATEGORY_INFO) as TaskCategory[]).map(cat => (
              <div key={cat} className="flex-1 min-w-[280px] bg-slate-100/50 rounded-xl flex flex-col max-h-[calc(100vh-200px)]">
                <div className={`p-4 border-t-4 ${CATEGORY_INFO[cat].color} bg-slate-100 rounded-t-xl flex justify-between items-center`}>
                  <h3 className="font-bold text-slate-700 text-sm">{CATEGORY_INFO[cat].name}</h3>
                  <span className="bg-white text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {(groupedTasks as Record<TaskCategory, WebTask[]>)[cat]?.length || 0}
                  </span>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                  {((groupedTasks as Record<TaskCategory, WebTask[]>)[cat] || []).map(renderTaskCard)}
                  <button 
                    className="w-full py-2 text-slate-500 text-sm font-medium hover:bg-slate-200 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 transition-colors"
                    onClick={handleAddTask}
                  >
                    + Thêm thẻ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setPreselectedColumnId(undefined);
          }}
          preselectedColumnId={preselectedColumnId}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
        />
      )}
    </div>
  );
};
