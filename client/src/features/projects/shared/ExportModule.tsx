import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, Upload, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ExportModuleProps {
  projectId: string;
  onExportJSON: () => Promise<void>;
  onExportCSV: () => Promise<void>;
  onExportPDF: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
  loading?: boolean;
}

const EXPORT_OPTIONS = [
  { id: 'json', name: 'JSON Export', description: 'Full project data including all configurations', icon: <FileJson size={24} />, color: 'text-amber-600 bg-amber-100' },
  { id: 'csv', name: 'CSV Export', description: 'Tasks and assignments in spreadsheet format', icon: <FileSpreadsheet size={24} />, color: 'text-green-600 bg-green-100' },
  { id: 'pdf', name: 'PDF Report', description: 'Project summary report for stakeholders', icon: <FileText size={24} />, color: 'text-red-600 bg-red-100' },
];

export const ExportModule = ({ projectId, onExportJSON, onExportCSV, onExportPDF, onImport, loading = false }: ExportModuleProps) => {
  const [exporting, setExporting] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      switch (type) {
        case 'json': await onExportJSON(); break;
        case 'csv': await onExportCSV(); break;
        case 'pdf': await onExportPDF(); break;
      }
    } finally {
      setExporting(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      await onImport(importFile);
      setImportFile(null);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Export Project</h3>
          <p className="text-sm text-slate-500">Download project data in various formats</p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {EXPORT_OPTIONS.map(option => (
            <div key={option.id} className="p-4 border border-slate-200 rounded-lg hover:border-brand-300 hover:bg-brand-50/50 transition-colors">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${option.color}`}>
                {option.icon}
              </div>
              <h4 className="font-medium text-slate-900">{option.name}</h4>
              <p className="text-sm text-slate-500 mb-4">{option.description}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(option.id)}
                disabled={exporting !== null}
                className="w-full"
              >
                {exporting === option.id ? 'Exporting...' : <><Download size={14} className="mr-1" /> Download</>}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Import Project</h3>
          <p className="text-sm text-slate-500">Import project data from JSON file</p>
        </div>
        <div className="p-6">
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-brand-300 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file" className="cursor-pointer">
              <Upload size={32} className="mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600 mb-1">
                {importFile ? importFile.name : 'Click to select or drag and drop'}
              </p>
              <p className="text-xs text-slate-400">JSON files only</p>
            </label>
          </div>
          {importFile && (
            <div className="mt-4 flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <Check size={16} /> <span>{importFile.name}</span>
              </div>
              <Button size="sm" onClick={handleImport} disabled={importing}>
                {importing ? 'Importing...' : 'Import'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModule;
