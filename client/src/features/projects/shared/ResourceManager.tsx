import { useState } from 'react';
import { 
  FileText, 
  Image, 
  Link as LinkIcon, 
  Lock, 
  Upload, 
  Check, 
  X, 
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
  History,
  ZoomIn,
  Download
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { 
  ProjectResource, 
  ResourceType, 
  ResourceStatus,
  VALID_FILE_FORMATS 
} from '../../../../../shared/types';

interface ResourceManagerProps {
  projectId: string;
  resources: ProjectResource[];
  onUpload: (type: ResourceType, file: File | null, url?: string) => Promise<void>;
  onApprove: (resourceId: string) => Promise<void>;
  onReject: (resourceId: string) => Promise<void>;
  onDelete: (resourceId: string) => Promise<void>;
  isManager?: boolean;
  loading?: boolean;
}

const RESOURCE_TYPES: { type: ResourceType; label: string; icon: React.ReactNode; required: boolean }[] = [
  { type: 'SITEMAP', label: 'Sitemap', icon: <FileText size={18} />, required: true },
  { type: 'SRS', label: 'SRS/Feature List', icon: <FileText size={18} />, required: true },
  { type: 'WIREFRAME', label: 'Wireframe', icon: <Image size={18} />, required: false },
  { type: 'MOCKUP', label: 'Mockup', icon: <Image size={18} />, required: false },
  { type: 'FIGMA_LINK', label: 'Figma Link', icon: <LinkIcon size={18} />, required: false },
  { type: 'ASSET', label: 'Design Assets', icon: <Image size={18} />, required: false },
  { type: 'CREDENTIAL', label: 'Access Credentials', icon: <Lock size={18} />, required: false },
];

const getStatusColor = (status: ResourceStatus) => {
  switch (status) {
    case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
    case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  }
};

const getStatusIcon = (status: ResourceStatus) => {
  switch (status) {
    case 'APPROVED': return <Check size={14} />;
    case 'REJECTED': return <X size={14} />;
    default: return <AlertCircle size={14} />;
  }
};


export const ResourceManager = ({
  projectId,
  resources,
  onUpload,
  onApprove,
  onReject,
  onDelete,
  isManager = false,
  loading = false,
}: ResourceManagerProps) => {
  const [uploadingType, setUploadingType] = useState<ResourceType | null>(null);
  const [figmaUrl, setFigmaUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);

  const getResourceByType = (type: ResourceType) => {
    return resources.filter(r => r.type === type);
  };

  // Get all versions of a resource (grouped by name, sorted by version)
  const getResourceVersions = (resourceName: string, resourceType: ResourceType) => {
    return resources
      .filter(r => r.type === resourceType && r.name === resourceName)
      .sort((a, b) => b.version - a.version);
  };

  // Check if resource is an image type
  const isImageResource = (type: ResourceType) => {
    return ['MOCKUP', 'WIREFRAME', 'ASSET'].includes(type);
  };

  const handlePreview = (resource: ProjectResource) => {
    if (resource.url) {
      setPreviewUrl(resource.url);
      setPreviewName(resource.name);
    }
  };

  const hasApprovedResource = (type: ResourceType) => {
    return resources.some(r => r.type === type && r.status === 'APPROVED');
  };

  const handleFileUpload = async (type: ResourceType, file: File) => {
    setUploadingType(type);
    try {
      await onUpload(type, file);
    } finally {
      setUploadingType(null);
    }
  };

  const handleFigmaSubmit = async () => {
    if (!figmaUrl.trim()) return;
    setUploadingType('FIGMA_LINK');
    try {
      await onUpload('FIGMA_LINK', null, figmaUrl);
      setFigmaUrl('');
    } finally {
      setUploadingType(null);
    }
  };

  // Calculate completion stats
  const requiredTypes = RESOURCE_TYPES.filter(r => r.required).map(r => r.type);
  const completedRequired = requiredTypes.filter(type => hasApprovedResource(type)).length;
  const completionPercent = Math.round((completedRequired / requiredTypes.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tài nguyên dự án</h3>
            <p className="text-sm text-slate-500">Quản lý các tài liệu và tài nguyên đầu vào</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{completionPercent}%</div>
            <div className="text-xs text-slate-500">Tài nguyên bắt buộc</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              completionPercent === 100 ? 'bg-green-500' : 'bg-brand-600'
            }`}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        
        {completionPercent < 100 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-900 mb-1 flex items-center gap-1">
              <AlertCircle size={12} />
              Cần hoàn thành tài nguyên bắt buộc
            </p>
            <p className="text-xs text-amber-700">
              Các tài nguyên sau cần được duyệt trước khi có thể chuyển sang giai đoạn Development:
            </p>
            <ul className="text-xs text-amber-700 mt-1 list-disc list-inside">
              {requiredTypes.map(type => {
                const typeInfo = RESOURCE_TYPES.find(r => r.type === type);
                if (!typeInfo) return null;
                const isComplete = hasApprovedResource(type);
                return (
                  <li key={type} className={isComplete ? 'line-through text-amber-500' : ''}>
                    {typeInfo.label} {isComplete && '✓'}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>


      {/* Resource Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RESOURCE_TYPES.map(({ type, label, icon, required }) => {
          const typeResources = getResourceByType(type);
          const latestResource = typeResources[0];
          const isComplete = hasApprovedResource(type);
          const allowedFormats = VALID_FILE_FORMATS[type];

          return (
            <div 
              key={type}
              className={`bg-white p-4 rounded-xl border shadow-sm transition-all ${
                isComplete ? 'border-green-200 bg-green-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                    {icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">{label}</h4>
                      {required && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                          BẮT BUỘC
                        </span>
                      )}
                    </div>
                    {allowedFormats.length > 0 && (
                      <p className="text-xs text-slate-400">
                        {allowedFormats.join(', ').toUpperCase()}
                      </p>
                    )}
                  </div>
                </div>
                
                {isComplete && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    <Check size={12} /> Đã duyệt
                  </span>
                )}
              </div>

              {/* Resource List */}
              {typeResources.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {typeResources.map(resource => {
                    const versions = getResourceVersions(resource.name, type);
                    const hasMultipleVersions = versions.length > 1;
                    
                    return (
                      <div 
                        key={resource.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {/* Image Thumbnail for image resources */}
                          {isImageResource(type) && resource.url && (
                            <div 
                              className="w-10 h-10 rounded border border-slate-200 overflow-hidden cursor-pointer hover:border-brand-400 transition-colors flex-shrink-0"
                              onClick={() => handlePreview(resource)}
                              title="Click để xem preview"
                            >
                              <img 
                                src={resource.url} 
                                alt={resource.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback nếu không load được image
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(resource.status)}`}>
                            {getStatusIcon(resource.status)}
                            {resource.status}
                          </span>
                          <span className="truncate text-slate-700">{resource.name}</span>
                          <span className="text-xs text-slate-400">v{resource.version}</span>
                          
                          {hasMultipleVersions && (
                            <button
                              onClick={() => setShowVersionHistory(showVersionHistory === resource.id ? null : resource.id)}
                              className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1"
                              title="Xem version history"
                            >
                              <History size={12} />
                              {versions.length} versions
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {resource.url && (
                            <>
                              {isImageResource(type) ? (
                                <button
                                  onClick={() => handlePreview(resource)}
                                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                  title="Xem preview"
                                >
                                  <ZoomIn size={14} />
                                </button>
                              ) : (
                                <a 
                                  href={resource.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                  title="Mở link"
                                >
                                  <Eye size={14} />
                                </a>
                              )}
                              <a
                                href={resource.url}
                                download
                                className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                title="Download"
                              >
                                <Download size={14} />
                              </a>
                            </>
                          )}
                          
                          {isManager && resource.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => onApprove(resource.id)}
                                className="p-1 hover:bg-green-100 rounded text-green-600"
                                title="Duyệt"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => onReject(resource.id)}
                                className="p-1 hover:bg-red-100 rounded text-red-600"
                                title="Từ chối"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                          
                          <button 
                            onClick={() => onDelete(resource.id)}
                            className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-600"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        {/* Version History Dropdown */}
                        {showVersionHistory === resource.id && hasMultipleVersions && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-2 max-h-48 overflow-y-auto">
                            <div className="text-xs font-semibold text-slate-700 mb-2">Version History</div>
                            {versions.map((v) => (
                              <div 
                                key={v.id}
                                className={`flex items-center justify-between p-2 rounded text-xs ${
                                  v.id === resource.id ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">v{v.version}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${getStatusColor(v.status)}`}>
                                    {v.status}
                                  </span>
                                  {v.approvedAt && (
                                    <span className="text-slate-400">
                                      Approved {new Date(v.approvedAt).toLocaleDateString('vi-VN')}
                                    </span>
                                  )}
                                </div>
                                {v.url && (
                                  <a
                                    href={v.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand-600 hover:underline"
                                  >
                                    <Eye size={12} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 mb-3">Chưa có tài nguyên</p>
              )}


              {/* Phase Requirement Info */}
              {required && !isComplete && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                  <strong>Yêu cầu:</strong> Tài nguyên này cần được duyệt để chuyển sang giai đoạn Development
                </div>
              )}

              {/* Upload Section */}
              {type === 'FIGMA_LINK' ? (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    placeholder="https://figma.com/file/..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleFigmaSubmit}
                    disabled={!figmaUrl.trim() || uploadingType === 'FIGMA_LINK'}
                  >
                    {uploadingType === 'FIGMA_LINK' ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <LinkIcon size={14} />
                    )}
                  </Button>
                </div>
              ) : type === 'CREDENTIAL' ? (
                <Button variant="outline" size="sm" className="w-full">
                  <Lock size={14} className="mr-2" /> Thêm thông tin đăng nhập
                </Button>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    accept={allowedFormats.map(f => `.${f}`).join(',')}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(type, file);
                    }}
                    disabled={uploadingType === type}
                  />
                  {uploadingType === type ? (
                    <RefreshCw size={16} className="animate-spin text-brand-600" />
                  ) : (
                    <Upload size={16} className="text-slate-400" />
                  )}
                  <span className="text-sm text-slate-500">
                    {uploadingType === type ? 'Đang tải lên...' : 'Tải lên tệp mới'}
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
              <h3 className="font-semibold text-slate-900">{previewName}</h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-center max-h-[calc(90vh-80px)] overflow-auto">
              <img 
                src={previewUrl} 
                alt={previewName}
                className="max-w-full max-h-full object-contain rounded"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-2">
              <a
                href={previewUrl}
                download
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={16} />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManager;
