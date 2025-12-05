import { useState } from 'react';
import { MessageSquare, Check, Clock, FileSignature, Plus, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { UATFeedback, UATFeedbackStatus, ProjectSignoff, SignoffType } from '../../../../../shared/types';

interface UATModuleProps {
  feedback: UATFeedback[];
  signoffs: ProjectSignoff[];
  stagingUrl?: string;
  status: {
    totalFeedback: number;
    pendingFeedback: number;
    addressedFeedback: number;
    hasUATSignoff: boolean;
    canSignoff: boolean;
  };
  onAddFeedback: (data: { featureName?: string; pageUrl?: string; feedbackText: string }) => Promise<void>;
  onUpdateFeedbackStatus: (feedbackId: string, status: UATFeedbackStatus) => Promise<void>;
  onCreateSignoff: (data: { signoffType: SignoffType; approverName: string; approverEmail?: string; signatureData?: string; notes?: string }) => Promise<void>;
  loading?: boolean;
}

const STATUS_STYLES: Record<UATFeedbackStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock size={12} /> },
  ADDRESSED: { bg: 'bg-green-100', text: 'text-green-700', icon: <Check size={12} /> },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: <MessageSquare size={12} /> },
};

export const UATModule = ({ feedback, signoffs, stagingUrl, status, onAddFeedback, onUpdateFeedbackStatus, onCreateSignoff, loading = false }: UATModuleProps) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState({ featureName: '', pageUrl: '', feedbackText: '' });
  const [signoffData, setSignoffData] = useState({ approverName: '', approverEmail: '', notes: '' });
  const [processing, setProcessing] = useState(false);

  const handleAddFeedback = async () => {
    if (!newFeedback.feedbackText.trim()) return;
    setProcessing(true);
    try {
      await onAddFeedback(newFeedback);
      setShowFeedbackModal(false);
      setNewFeedback({ featureName: '', pageUrl: '', feedbackText: '' });
    } finally {
      setProcessing(false);
    }
  };

  const handleSignoff = async () => {
    if (!signoffData.approverName.trim()) return;
    setProcessing(true);
    try {
      await onCreateSignoff({ signoffType: 'UAT', ...signoffData });
      setShowSignoffModal(false);
      setSignoffData({ approverName: '', approverEmail: '', notes: '' });
    } finally {
      setProcessing(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Staging URL */}
      {stagingUrl && (
        <div className="bg-brand-50 p-4 rounded-xl border border-brand-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-brand-900">Staging Environment</h4>
              <p className="text-sm text-brand-600">Test the application before sign-off</p>
            </div>
            <a href={stagingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
              <ExternalLink size={16} /> Open Staging
            </a>
          </div>
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <div className="text-2xl font-bold text-slate-900">{status.totalFeedback}</div>
          <div className="text-xs text-slate-500">Total Feedback</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
          <div className="text-2xl font-bold text-amber-700">{status.pendingFeedback}</div>
          <div className="text-xs text-amber-600">Pending</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-700">{status.addressedFeedback}</div>
          <div className="text-xs text-green-600">Addressed</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${status.hasUATSignoff ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-2xl font-bold">{status.hasUATSignoff ? '✓' : '—'}</div>
          <div className="text-xs">{status.hasUATSignoff ? 'Signed Off' : 'Pending Sign-off'}</div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900">UAT Feedback</h3>
          <Button size="sm" onClick={() => setShowFeedbackModal(true)}>
            <Plus size={14} className="mr-1" /> Add Feedback
          </Button>
        </div>
        <div className="divide-y divide-slate-100">
          {feedback.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
              <p>No feedback yet</p>
            </div>
          ) : (
            feedback.map(item => (
              <div key={item.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {item.featureName && <span className="text-xs font-medium text-brand-600 mb-1 block">{item.featureName}</span>}
                    <p className="text-slate-900">{item.feedbackText}</p>
                    {item.pageUrl && <a href={item.pageUrl} className="text-xs text-brand-500 hover:underline">{item.pageUrl}</a>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[item.status].bg} ${STATUS_STYLES[item.status].text}`}>
                        {STATUS_STYLES[item.status].icon} {item.status}
                      </span>
                      <span className="text-xs text-slate-400">by {item.providedBy}</span>
                    </div>
                  </div>
                  {item.status === 'PENDING' && (
                    <Button size="sm" variant="outline" onClick={() => onUpdateFeedbackStatus(item.id, 'ADDRESSED')} className="text-green-600">
                      <Check size={14} className="mr-1" /> Mark Addressed
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sign-off Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">UAT Sign-off</h3>
            <p className="text-sm text-slate-500">Request client approval to proceed to production</p>
          </div>
          <Button onClick={() => setShowSignoffModal(true)} disabled={!status.canSignoff || status.hasUATSignoff}>
            <FileSignature size={16} className="mr-2" /> Request Sign-off
          </Button>
        </div>
        {!status.canSignoff && !status.hasUATSignoff && (
          <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
            All feedback must be addressed before requesting sign-off
          </div>
        )}
        {signoffs.filter(s => s.signoffType === 'UAT').map(signoff => (
          <div key={signoff.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <Check size={20} /> <span className="font-medium">Signed off by {signoff.approverName}</span>
            </div>
            <p className="text-sm text-green-600 mt-1">{new Date(signoff.signedAt).toLocaleString('vi-VN')}</p>
            {signoff.notes && <p className="text-sm text-slate-600 mt-2">{signoff.notes}</p>}
          </div>
        ))}
      </div>


      {/* Add Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add UAT Feedback</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Feature Name</label>
                <input type="text" value={newFeedback.featureName} onChange={(e) => setNewFeedback({ ...newFeedback, featureName: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm" placeholder="e.g., Login Page" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Page URL</label>
                <input type="text" value={newFeedback.pageUrl} onChange={(e) => setNewFeedback({ ...newFeedback, pageUrl: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm" placeholder="https://staging.example.com/login" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Feedback *</label>
                <textarea value={newFeedback.feedbackText} onChange={(e) => setNewFeedback({ ...newFeedback, feedbackText: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none" rows={4} placeholder="Describe your feedback..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
              <Button onClick={handleAddFeedback} disabled={processing || !newFeedback.feedbackText.trim()}>
                {processing ? 'Adding...' : 'Add Feedback'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sign-off Modal */}
      {showSignoffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">UAT Sign-off</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Approver Name *</label>
                <input type="text" value={signoffData.approverName} onChange={(e) => setSignoffData({ ...signoffData, approverName: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Approver Email</label>
                <input type="email" value={signoffData.approverEmail} onChange={(e) => setSignoffData({ ...signoffData, approverEmail: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={signoffData.notes} onChange={(e) => setSignoffData({ ...signoffData, notes: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none" rows={3} placeholder="Any additional notes..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowSignoffModal(false)}>Cancel</Button>
              <Button onClick={handleSignoff} disabled={processing || !signoffData.approverName.trim()}>
                {processing ? 'Processing...' : 'Confirm Sign-off'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UATModule;
