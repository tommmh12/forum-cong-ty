import { useState } from 'react';
import {
  Server,
  Globe,
  Shield,
  Clock,
  Check,
  AlertCircle,
  Upload,
  RotateCcw,
  ExternalLink,
  History,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import {
  ProjectEnvironment,
  DeploymentRecord,
  EnvironmentType,
  DeploymentStatus,
} from '../../../../../shared/types';

interface EnvironmentManagerProps {
  environments: ProjectEnvironment[];
  onDeploy: (envId: string, data: DeployData) => Promise<void>;
  onRollback: (envId: string, deploymentId: string) => Promise<void>;
  onUpdateEnv: (envId: string, data: { url?: string; sslEnabled?: boolean }) => Promise<void>;
  deploymentReadiness: {
    local: { ready: boolean; blockers: string[] };
    staging: { ready: boolean; blockers: string[] };
    production: { ready: boolean; blockers: string[] };
  };
  currentUserId: string;
  isManager?: boolean;
  loading?: boolean;
}

interface DeployData {
  version: string;
  commitHash?: string;
  notes?: string;
}

const ENV_INFO: Record<EnvironmentType, { name: string; icon: React.ReactNode; color: string }> = {
  LOCAL: {
    name: 'Local Development',
    icon: <Server size={20} />,
    color: 'slate',
  },
  STAGING: {
    name: 'Staging',
    icon: <Globe size={20} />,
    color: 'amber',
  },
  PRODUCTION: {
    name: 'Production',
    icon: <Shield size={20} />,
    color: 'green',
  },
};


const getStatusBadge = (status: DeploymentStatus) => {
  switch (status) {
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <Check size={12} /> Success
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertCircle size={12} /> Failed
        </span>
      );
    case 'ROLLBACK':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <RotateCcw size={12} /> Rollback
        </span>
      );
  }
};

export const EnvironmentManager = ({
  environments,
  onDeploy,
  onRollback,
  onUpdateEnv,
  deploymentReadiness,
  currentUserId,
  isManager = false,
  loading = false,
}: EnvironmentManagerProps) => {
  const [showDeployModal, setShowDeployModal] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null);
  const [deployData, setDeployData] = useState<DeployData>({ version: '', commitHash: '', notes: '' });
  const [deploying, setDeploying] = useState(false);

  // Sort environments by type order
  const sortedEnvs = [...environments].sort((a, b) => {
    const order: EnvironmentType[] = ['LOCAL', 'STAGING', 'PRODUCTION'];
    return order.indexOf(a.envType) - order.indexOf(b.envType);
  });

  const handleDeploy = async (envId: string) => {
    if (!deployData.version.trim()) return;
    setDeploying(true);
    try {
      await onDeploy(envId, deployData);
      setShowDeployModal(null);
      setDeployData({ version: '', commitHash: '', notes: '' });
    } finally {
      setDeploying(false);
    }
  };

  const handleRollback = async (envId: string, deploymentId: string) => {
    if (confirm('Bạn có chắc muốn rollback về version này?')) {
      await onRollback(envId, deploymentId);
    }
  };

  const getReadiness = (envType: EnvironmentType) => {
    return deploymentReadiness[envType.toLowerCase() as keyof typeof deploymentReadiness];
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedEnvs.map((env) => {
          const info = ENV_INFO[env.envType];
          const readiness = getReadiness(env.envType);
          const colorClass = info.color;

          return (
            <div
              key={env.id}
              className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${colorClass}-100 text-${colorClass}-600`}>
                    {info.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{info.name}</h4>
                    <p className="text-xs text-slate-500">
                      {env.currentVersion ? `v${env.currentVersion}` : 'Not deployed'}
                    </p>
                  </div>
                </div>
                {env.sslEnabled && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Shield size={12} /> SSL
                  </span>
                )}
              </div>

              {/* URL */}
              {env.url && (
                <a
                  href={env.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 mb-3"
                >
                  <ExternalLink size={14} />
                  {env.url}
                </a>
              )}

              {/* Last Deployment */}
              {env.lastDeployedAt && (
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                  <Clock size={12} />
                  Last deployed: {new Date(env.lastDeployedAt).toLocaleString('vi-VN')}
                </div>
              )}

              {/* Readiness Status */}
              {!readiness.ready && readiness.blockers.length > 0 && (
                <div className="mb-4 p-2 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium mb-1">Blockers:</p>
                  <ul className="text-xs text-amber-600 list-disc list-inside">
                    {readiness.blockers.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowDeployModal(env.id)}
                  disabled={!readiness.ready || loading}
                  className="flex-1"
                >
                  <Upload size={14} className="mr-1" /> Deploy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistoryModal(env.id)}
                >
                  <History size={14} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>


      {/* Deployment History Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-900 mb-4">Recent Deployments</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Environment</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Version</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Commit</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Deployed At</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEnvs.flatMap((env) =>
                (env.deploymentHistory || []).slice(0, 3).map((dep) => (
                  <tr key={dep.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-medium">{ENV_INFO[env.envType].name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <code className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                        v{dep.version}
                      </code>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(dep.status)}</td>
                    <td className="py-3 px-4">
                      {dep.commitHash ? (
                        <code className="text-xs text-slate-500">{dep.commitHash.slice(0, 7)}</code>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(dep.deployedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      {dep.status === 'SUCCESS' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRollback(env.id, dep.id)}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <RotateCcw size={14} className="mr-1" /> Rollback
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
              {sortedEnvs.every((env) => !env.deploymentHistory?.length) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No deployments yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Deploy to Environment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Version <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deployData.version}
                  onChange={(e) => setDeployData({ ...deployData, version: e.target.value })}
                  placeholder="e.g., 1.0.0"
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Commit Hash
                </label>
                <input
                  type="text"
                  value={deployData.commitHash}
                  onChange={(e) => setDeployData({ ...deployData, commitHash: e.target.value })}
                  placeholder="e.g., abc1234"
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={deployData.notes}
                  onChange={(e) => setDeployData({ ...deployData, notes: e.target.value })}
                  placeholder="Deployment notes..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowDeployModal(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleDeploy(showDeployModal)}
                disabled={!deployData.version.trim() || deploying}
              >
                {deploying ? 'Deploying...' : 'Deploy'}
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Deployment History - {ENV_INFO[sortedEnvs.find(e => e.id === showHistoryModal)?.envType || 'LOCAL'].name}
            </h3>
            
            <div className="overflow-y-auto flex-1">
              {(() => {
                const env = sortedEnvs.find(e => e.id === showHistoryModal);
                const history = env?.deploymentHistory || [];
                
                if (history.length === 0) {
                  return (
                    <div className="py-8 text-center text-slate-400">
                      No deployment history
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {history.map((dep) => (
                      <div
                        key={dep.id}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <code className="px-2 py-1 bg-slate-100 rounded font-medium">
                              v{dep.version}
                            </code>
                            {getStatusBadge(dep.status)}
                          </div>
                          {dep.status === 'SUCCESS' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                handleRollback(showHistoryModal, dep.id);
                                setShowHistoryModal(null);
                              }}
                            >
                              <RotateCcw size={14} className="mr-1" /> Rollback
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-sm text-slate-500 space-y-1">
                          <p>
                            <Clock size={12} className="inline mr-1" />
                            {new Date(dep.deployedAt).toLocaleString('vi-VN')}
                          </p>
                          {dep.commitHash && (
                            <p>
                              Commit: <code className="text-xs">{dep.commitHash}</code>
                            </p>
                          )}
                          {dep.notes && (
                            <p className="text-slate-600 mt-2">{dep.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            
            <div className="flex justify-end mt-4 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowHistoryModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentManager;
