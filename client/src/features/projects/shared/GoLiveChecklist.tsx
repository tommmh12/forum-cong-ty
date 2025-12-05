import { Check, AlertCircle, Shield, Server, FileText, TestTube } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  isCompleted: boolean;
  category: 'INFRASTRUCTURE' | 'SECURITY' | 'CONTENT' | 'TESTING';
}

interface GoLiveChecklistProps {
  checklist: ChecklistItem[];
  readiness: { ready: boolean; blockers: string[]; completedItems: number; totalItems: number };
  onGoLive?: () => Promise<void>;
  loading?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  INFRASTRUCTURE: <Server size={16} />,
  SECURITY: <Shield size={16} />,
  CONTENT: <FileText size={16} />,
  TESTING: <TestTube size={16} />,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  INFRASTRUCTURE: { bg: 'bg-blue-100', text: 'text-blue-600' },
  SECURITY: { bg: 'bg-red-100', text: 'text-red-600' },
  CONTENT: { bg: 'bg-purple-100', text: 'text-purple-600' },
  TESTING: { bg: 'bg-green-100', text: 'text-green-600' },
};

export const GoLiveChecklist = ({ checklist, readiness, onGoLive, loading = false }: GoLiveChecklistProps) => {
  const progressPercent = Math.round((readiness.completedItems / readiness.totalItems) * 100);

  return (
    <div className="space-y-6">
      {/* Readiness Status */}
      <div className={`p-6 rounded-xl border ${readiness.ready ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-bold ${readiness.ready ? 'text-green-900' : 'text-amber-900'}`}>
              {readiness.ready ? '✓ Ready for Go-Live' : '⚠ Not Ready for Go-Live'}
            </h3>
            <p className={`text-sm ${readiness.ready ? 'text-green-600' : 'text-amber-600'}`}>
              {readiness.completedItems} of {readiness.totalItems} items completed ({progressPercent}%)
            </p>
          </div>
          {readiness.ready && onGoLive && (
            <Button onClick={onGoLive} disabled={loading} className="bg-green-600 hover:bg-green-700">
              🚀 Go Live
            </Button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 w-full bg-white/50 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${readiness.ready ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${progressPercent}%` }} />
        </div>
        
        {/* Blockers */}
        {readiness.blockers.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-amber-800 mb-2">Blockers:</p>
            <ul className="text-sm text-amber-700 list-disc list-inside">
              {readiness.blockers.map((blocker, i) => <li key={i}>{blocker}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Deployment Checklist</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {checklist.map(item => (
            <div key={item.id} className="p-4 flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                {item.isCompleted ? <Check size={18} /> : <AlertCircle size={18} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${item.isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>{item.name}</h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${CATEGORY_COLORS[item.category].bg} ${CATEGORY_COLORS[item.category].text}`}>
                    {CATEGORY_ICONS[item.category]} {item.category}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoLiveChecklist;
