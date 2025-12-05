import { useState } from 'react';
import { 
  Check, 
  Clock, 
  AlertCircle, 
  Lock,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { 
  ProjectPhase, 
  PhaseType, 
  PhaseStatus,
  PHASE_ORDER 
} from '../../../../../shared/types';

interface PhaseTrackerProps {
  phases: ProjectPhase[];
  onTransition: () => Promise<void>;
  onBlock: (phaseId: string, reason: string) => Promise<void>;
  onUnblock: (phaseId: string) => Promise<void>;
  canTransition: boolean;
  missingRequirements: string[];
  isManager?: boolean;
  loading?: boolean;
}

const PHASE_INFO: Record<PhaseType, { name: string; description: string; icon: string }> = {
  KICKOFF: {
    name: 'Kick-off',
    description: 'Khởi động dự án',
    icon: '🚀',
  },
  TECHNICAL_PLANNING: {
    name: 'Technical Planning',
    description: 'Lập kế hoạch kỹ thuật',
    icon: '📋',
  },
  DEVELOPMENT: {
    name: 'Development',
    description: 'Phát triển tính năng',
    icon: '💻',
  },
  INTERNAL_TESTING: {
    name: 'Internal Testing',
    description: 'Kiểm thử nội bộ',
    icon: '🧪',
  },
  UAT: {
    name: 'UAT',
    description: 'User Acceptance Testing',
    icon: '✅',
  },
  GO_LIVE: {
    name: 'Go Live',
    description: 'Triển khai production',
    icon: '🎉',
  },
};


const getStatusStyles = (status: PhaseStatus) => {
  switch (status) {
    case 'COMPLETED':
      return {
        bg: 'bg-green-500',
        border: 'border-green-500',
        text: 'text-green-700',
        icon: <Check size={16} className="text-white" />,
      };
    case 'IN_PROGRESS':
      return {
        bg: 'bg-brand-500',
        border: 'border-brand-500',
        text: 'text-brand-700',
        icon: <Play size={16} className="text-white" />,
      };
    case 'BLOCKED':
      return {
        bg: 'bg-red-500',
        border: 'border-red-500',
        text: 'text-red-700',
        icon: <Pause size={16} className="text-white" />,
      };
    default:
      return {
        bg: 'bg-slate-200',
        border: 'border-slate-300',
        text: 'text-slate-500',
        icon: <Clock size={16} className="text-slate-400" />,
      };
  }
};

export const PhaseTracker = ({
  phases,
  onTransition,
  onBlock,
  onUnblock,
  canTransition,
  missingRequirements,
  isManager = false,
  loading = false,
}: PhaseTrackerProps) => {
  const [showBlockModal, setShowBlockModal] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Sort phases by position
  const sortedPhases = [...phases].sort((a, b) => a.position - b.position);
  const currentPhase = sortedPhases.find(p => p.status === 'IN_PROGRESS');
  const completedCount = sortedPhases.filter(p => p.status === 'COMPLETED').length;
  const progressPercent = Math.round((completedCount / PHASE_ORDER.length) * 100);

  const handleTransition = async () => {
    setTransitioning(true);
    try {
      await onTransition();
    } finally {
      setTransitioning(false);
    }
  };

  const handleBlock = async (phaseId: string) => {
    if (!blockReason.trim()) return;
    await onBlock(phaseId, blockReason);
    setShowBlockModal(null);
    setBlockReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tiến độ dự án</h3>
            <p className="text-sm text-slate-500">
              {currentPhase 
                ? `Đang ở giai đoạn: ${PHASE_INFO[currentPhase.phaseType].name}`
                : 'Chưa bắt đầu'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{progressPercent}%</div>
            <div className="text-xs text-slate-500">{completedCount}/{PHASE_ORDER.length} phases</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              progressPercent === 100 ? 'bg-green-500' : 'bg-brand-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Transition Button */}
        {isManager && currentPhase && currentPhase.phaseType !== 'GO_LIVE' && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              {canTransition ? (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check size={14} /> Sẵn sàng chuyển sang giai đoạn tiếp theo
                </p>
              ) : (
                <div>
                  <p className="text-sm text-amber-600 flex items-center gap-1 mb-1">
                    <AlertCircle size={14} /> Chưa đủ điều kiện chuyển phase
                  </p>
                  <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                    {missingRequirements.slice(0, 5).map((req, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>{req}</span>
                        {req.includes('SITEMAP') || req.includes('SRS') || req.includes('DESIGN') ? (
                          <span className="text-amber-600 font-semibold">(Xem tab Tài nguyên)</span>
                        ) : null}
                      </li>
                    ))}
                    {missingRequirements.length > 5 && (
                      <li>...và {missingRequirements.length - 5} yêu cầu khác</li>
                    )}
                  </ul>
                  {(missingRequirements.some(r => r.includes('SITEMAP') || r.includes('SRS') || r.includes('DESIGN'))) && (
                    <p className="text-xs text-amber-600 mt-2 font-medium">
                      💡 Một số yêu cầu liên quan đến tài nguyên. Vui lòng kiểm tra tab "Tài nguyên" để upload và duyệt.
                    </p>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={handleTransition}
              disabled={!canTransition || transitioning}
              className="flex items-center gap-2"
            >
              {transitioning ? 'Đang chuyển...' : 'Chuyển Phase'}
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>


      {/* Phase Timeline */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-900 mb-6">Timeline các giai đoạn</h4>
        
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200" />
          
          <div className="space-y-6">
            {sortedPhases.map((phase, index) => {
              const info = PHASE_INFO[phase.phaseType];
              const styles = getStatusStyles(phase.status);
              const isLast = index === sortedPhases.length - 1;
              
              return (
                <div key={phase.id} className="relative flex items-start gap-4">
                  {/* Status Circle */}
                  <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${styles.bg} border-4 border-white shadow-md`}>
                    {phase.status === 'PENDING' ? (
                      <span className="text-lg">{info.icon}</span>
                    ) : (
                      styles.icon
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className={`flex-1 pb-6 ${!isLast ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className={`font-semibold ${styles.text}`}>
                          {info.name}
                        </h5>
                        <p className="text-sm text-slate-500">{info.description}</p>
                        
                        {/* Status Badge */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            phase.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            phase.status === 'IN_PROGRESS' ? 'bg-brand-100 text-brand-700' :
                            phase.status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {phase.status === 'COMPLETED' && <Check size={12} />}
                            {phase.status === 'IN_PROGRESS' && <Play size={12} />}
                            {phase.status === 'BLOCKED' && <Lock size={12} />}
                            {phase.status === 'PENDING' && <Clock size={12} />}
                            {phase.status}
                          </span>
                          
                          {phase.startedAt && (
                            <span className="text-xs text-slate-400">
                              Bắt đầu: {new Date(phase.startedAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                          {phase.completedAt && (
                            <span className="text-xs text-slate-400">
                              Hoàn thành: {new Date(phase.completedAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                        
                        {/* Blocked Reason */}
                        {phase.status === 'BLOCKED' && phase.blockedReason && (
                          <div className="mt-2 p-2 bg-red-50 rounded-lg text-sm text-red-600">
                            <strong>Lý do block:</strong> {phase.blockedReason}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      {isManager && phase.status === 'IN_PROGRESS' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBlockModal(phase.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Lock size={14} className="mr-1" /> Block
                          </Button>
                        </div>
                      )}
                      
                      {isManager && phase.status === 'BLOCKED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUnblock(phase.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          Unblock
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Block Phase</h3>
            <p className="text-sm text-slate-500 mb-4">
              Nhập lý do block phase này. Phase sẽ không thể tiến hành cho đến khi được unblock.
            </p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Lý do block..."
              className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowBlockModal(null)}>
                Hủy
              </Button>
              <Button
                onClick={() => handleBlock(showBlockModal)}
                disabled={!blockReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Block Phase
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaseTracker;
