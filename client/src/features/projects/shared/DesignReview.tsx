import { useState } from 'react';
import {
  Image,
  Check,
  X,
  MessageSquare,
  Lock,
  ExternalLink,
  Eye,
  Clock,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import {
  DesignReview as DesignReviewType,
  DesignReviewStatus,
  ProjectResource,
} from '../../../../../shared/types';

interface DesignReviewProps {
  reviews: { review: DesignReviewType; resource: ProjectResource | null }[];
  onApprove: (reviewId: string, comments?: string) => Promise<void>;
  onReject: (reviewId: string, comments: string) => Promise<void>;
  onRequestChanges: (reviewId: string, comments: string) => Promise<void>;
  onCreateReview: (resourceId: string) => Promise<void>;
  canReview?: boolean;
  loading?: boolean;
}

const STATUS_STYLES: Record<DesignReviewStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock size={14} /> },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: <Check size={14} /> },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: <X size={14} /> },
  CHANGE_REQUESTED: { bg: 'bg-purple-100', text: 'text-purple-700', icon: <MessageSquare size={14} /> },
};

export const DesignReview = ({
  reviews,
  onApprove,
  onReject,
  onRequestChanges,
  onCreateReview,
  canReview = false,
  loading = false,
}: DesignReviewProps) => {
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'changes' | null>(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleAction = async () => {
    if (!selectedReview || !actionType) return;
    
    setProcessing(true);
    try {
      switch (actionType) {
        case 'approve':
          await onApprove(selectedReview, comments || undefined);
          break;
        case 'reject':
          if (!comments.trim()) return;
          await onReject(selectedReview, comments);
          break;
        case 'changes':
          if (!comments.trim()) return;
          await onRequestChanges(selectedReview, comments);
          break;
      }
      setSelectedReview(null);
      setActionType(null);
      setComments('');
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (reviewId: string, type: 'approve' | 'reject' | 'changes') => {
    setSelectedReview(reviewId);
    setActionType(type);
    setComments('');
  };


  // Stats
  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.review.status === 'PENDING').length,
    approved: reviews.filter(r => r.review.status === 'APPROVED').length,
    rejected: reviews.filter(r => r.review.status === 'REJECTED').length,
    changeRequested: reviews.filter(r => r.review.status === 'CHANGE_REQUESTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-500">Total Reviews</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
          <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
          <div className="text-xs text-amber-600">Pending</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
          <div className="text-xs text-green-600">Approved</div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
          <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
          <div className="text-xs text-red-600">Rejected</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
          <div className="text-2xl font-bold text-purple-700">{stats.changeRequested}</div>
          <div className="text-xs text-purple-600">Changes Requested</div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Design Reviews</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Image size={48} className="mx-auto mb-3 opacity-50" />
              <p>No design reviews yet</p>
            </div>
          ) : (
            reviews.map(({ review, resource }) => {
              const statusStyle = STATUS_STYLES[review.status];
              
              return (
                <div key={review.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Preview Thumbnail */}
                      <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {resource?.url ? (
                          <img 
                            src={resource.url} 
                            alt={resource.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image size={24} className="text-slate-400" />
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {resource?.name || 'Unknown Resource'}
                        </h4>
                        <p className="text-sm text-slate-500 mb-2">
                          {resource?.type || 'Design'} • Version {resource?.version || 1}
                        </p>
                        
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.icon}
                          {review.status.replace('_', ' ')}
                        </span>
                        
                        {/* Version Lock Indicator */}
                        {review.versionLocked && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-500">
                            <Lock size={12} /> Locked at v{review.versionLocked}
                          </span>
                        )}
                        
                        {/* Comments */}
                        {review.comments && (
                          <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                            {review.comments}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {resource?.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-slate-600"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                      
                      {canReview && (review.status === 'PENDING' || review.status === 'CHANGE_REQUESTED') && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionModal(review.id, 'approve')}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionModal(review.id, 'changes')}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            <MessageSquare size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionModal(review.id, 'reject')}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>


      {/* Action Modal */}
      {selectedReview && actionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {actionType === 'approve' && 'Approve Design'}
              {actionType === 'reject' && 'Reject Design'}
              {actionType === 'changes' && 'Request Changes'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Comments {actionType !== 'approve' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    actionType === 'approve' 
                      ? 'Optional feedback...' 
                      : 'Please provide detailed feedback...'
                  }
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                  rows={4}
                />
              </div>
              
              {actionType === 'approve' && (
                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  <Lock size={14} className="inline mr-1" />
                  Approving will lock the current version of this design.
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedReview(null);
                  setActionType(null);
                  setComments('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={processing || (actionType !== 'approve' && !comments.trim())}
                className={
                  actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-purple-600 hover:bg-purple-700'
                }
              >
                {processing ? 'Processing...' : 
                  actionType === 'approve' ? 'Approve' :
                  actionType === 'reject' ? 'Reject' :
                  'Request Changes'
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignReview;
