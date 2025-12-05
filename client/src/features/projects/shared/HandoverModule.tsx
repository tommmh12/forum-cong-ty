import { FileText, Download, Check, X, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface HandoverDocument {
  type: string;
  name: string;
  description: string;
  available: boolean;
}

interface WarrantyInfo {
  startDate: string;
  endDate: string;
  durationMonths: number;
  supportEmail: string;
  supportPhone: string;
}

interface HandoverModuleProps {
  documents: HandoverDocument[];
  warranty: WarrantyInfo;
  onDownload?: (docType: string) => void;
  loading?: boolean;
}

export const HandoverModule = ({ documents, warranty, onDownload, loading = false }: HandoverModuleProps) => {
  const availableCount = documents.filter(d => d.available).length;

  return (
    <div className="space-y-6">
      {/* Warranty Information */}
      <div className="bg-brand-50 p-6 rounded-xl border border-brand-200">
        <h3 className="text-lg font-bold text-brand-900 mb-4">Warranty & Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg"><Calendar size={20} className="text-brand-600" /></div>
            <div>
              <p className="text-sm text-brand-600">Duration</p>
              <p className="font-semibold text-brand-900">{warranty.durationMonths} months</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg"><Mail size={20} className="text-brand-600" /></div>
            <div>
              <p className="text-sm text-brand-600">Support Email</p>
              <a href={`mailto:${warranty.supportEmail}`} className="font-semibold text-brand-900 hover:underline">{warranty.supportEmail}</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg"><Phone size={20} className="text-brand-600" /></div>
            <div>
              <p className="text-sm text-brand-600">Support Phone</p>
              <a href={`tel:${warranty.supportPhone}`} className="font-semibold text-brand-900 hover:underline">{warranty.supportPhone}</a>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-brand-200 text-sm text-brand-700">
          <p>Warranty Period: {new Date(warranty.startDate).toLocaleDateString('vi-VN')} - {new Date(warranty.endDate).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-slate-900">Handover Documentation</h3>
            <p className="text-sm text-slate-500">{availableCount} of {documents.length} documents available</p>
          </div>
          <Button variant="outline" onClick={() => onDownload?.('ALL')} disabled={availableCount === 0}>
            <Download size={16} className="mr-2" /> Download All
          </Button>
        </div>
        <div className="divide-y divide-slate-100">
          {documents.map(doc => (
            <div key={doc.type} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${doc.available ? 'bg-green-100' : 'bg-slate-100'}`}>
                  <FileText size={20} className={doc.available ? 'text-green-600' : 'text-slate-400'} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900">{doc.name}</h4>
                    {doc.available ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700"><Check size={12} /> Available</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500"><X size={12} /> Pending</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{doc.description}</p>
                </div>
              </div>
              {doc.available && (
                <Button variant="ghost" size="sm" onClick={() => onDownload?.(doc.type)}>
                  <Download size={16} />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HandoverModule;
