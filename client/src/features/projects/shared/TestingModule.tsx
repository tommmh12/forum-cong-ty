import { useState } from 'react';
import { Bug, AlertTriangle, CheckCircle, Clock, Plus, Filter } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { BugReport, BugSeverity, BugStatus, EnvironmentType } from '../../../../../shared/types';

interface TestingModuleProps {
  bugs: BugReport[];
  stats: {
    bugs: { total: number; open: number; inProgress: number; resolved: number; critical: number; high: number };
    resolutionRate: number;
    criticalBugCount: number;
  };
  onCreateBug: (data: CreateBugData) => Promise<void>;
  onUpdateStatus: (bugId: string, status: BugStatus) => Promise<void>;
  onAssign: (bugId: string, assignedTo: string) => Promise<void>;
  users?: { id: string; fullName: string }[];
  loading?: boolean;
}

interface CreateBugData {
  title: string;
  description?: string;
  severity: BugSeverity;
  environment: EnvironmentType;
  reproductionSteps: string;
}

const SEVERITY_STYLES: Record<BugSeverity, { bg: string; text: string }> = {
  LOW: { bg: 'bg-slate-100', text: 'text-slate-600' },
  MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-700' },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-700' },
};

const STATUS_STYLES: Record<BugStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  OPEN: { bg: 'bg-red-100', text: 'text-red-700', icon: <Bug size={12} /> },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock size={12} /> },
  RESOLVED: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} /> },
  CLOSED: { bg: 'bg-slate-100', text: 'text-slate-600', icon: <CheckCircle size={12} /> },
  WONT_FIX: { bg: 'bg-slate-100', text: 'text-slate-500', icon: <AlertTriangle size={12} /> },
};

export const TestingModule = ({ bugs, stats, onCreateBug, onUpdateStatus, onAssign, users = [], loading = false }: TestingModuleProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<BugSeverity | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<BugStatus | 'ALL'>('ALL');
  const [newBug, setNewBug] = useState<CreateBugData>({
    title: '', description: '', severity: 'MEDIUM', environment: 'STAGING', reproductionSteps: '',
  });
  const [creating, setCreating] = useState(false);

  const filteredBugs = bugs.filter(bug => {
    if (filterSeverity !== 'ALL' && bug.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && bug.status !== filterStatus) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!newBug.title.trim() || !newBug.reproductionSteps.trim()) return;
    setCreating(true);
    try {
      await onCreateBug(newBug);
      setShowCreateModal(false);
      setNewBug({ title: '', description: '', severity: 'MEDIUM', environment: 'STAGING', reproductionSteps: '' });
    } finally {
      setCreating(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Bug size={20} className="text-slate-400" />
            <span className="text-sm text-slate-500">Total Bugs</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.bugs.total}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-red-500" />
            <span className="text-sm text-red-600">Critical</span>
          </div>
          <div className="text-2xl font-bold text-red-700">{stats.criticalBugCount}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-blue-500" />
            <span className="text-sm text-blue-600">In Progress</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">{stats.bugs.inProgress}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-500" />
            <span className="text-sm text-green-600">Resolution Rate</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{stats.resolutionRate}%</div>
        </div>
      </div>

      {/* Bug List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900">Bug Reports</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as any)} className="text-sm border rounded px-2 py-1">
                <option value="ALL">All Severity</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="text-sm border rounded px-2 py-1">
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} className="mr-1" /> Report Bug
            </Button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredBugs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bug size={48} className="mx-auto mb-3 opacity-50" />
              <p>No bugs found</p>
            </div>
          ) : (
            filteredBugs.map(bug => (
              <div key={bug.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{bug.title}</h4>
                    <p className="text-sm text-slate-500 mt-1">{bug.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[bug.severity].bg} ${SEVERITY_STYLES[bug.severity].text}`}>
                        {bug.severity}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[bug.status].bg} ${STATUS_STYLES[bug.status].text}`}>
                        {STATUS_STYLES[bug.status].icon} {bug.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">{bug.environment}</span>
                    </div>
                  </div>
                  <select
                    value={bug.status}
                    onChange={(e) => onUpdateStatus(bug.id, e.target.value as BugStatus)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                    <option value="WONT_FIX">Won't Fix</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>


      {/* Create Bug Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Report Bug</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newBug.title}
                  onChange={(e) => setNewBug({ ...newBug, title: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                  placeholder="Brief description of the bug"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Severity *</label>
                  <select
                    value={newBug.severity}
                    onChange={(e) => setNewBug({ ...newBug, severity: e.target.value as BugSeverity })}
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Environment *</label>
                  <select
                    value={newBug.environment}
                    onChange={(e) => setNewBug({ ...newBug, environment: e.target.value as EnvironmentType })}
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="LOCAL">Local</option>
                    <option value="STAGING">Staging</option>
                    <option value="PRODUCTION">Production</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newBug.description}
                  onChange={(e) => setNewBug({ ...newBug, description: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none"
                  rows={2}
                  placeholder="Additional details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reproduction Steps *</label>
                <textarea
                  value={newBug.reproductionSteps}
                  onChange={(e) => setNewBug({ ...newBug, reproductionSteps: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none"
                  rows={4}
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !newBug.title.trim() || !newBug.reproductionSteps.trim()}>
                {creating ? 'Creating...' : 'Create Bug'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestingModule;
