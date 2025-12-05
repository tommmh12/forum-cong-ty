import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useApiError } from './useApiError';

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  isCompleted: boolean;
  category: 'INFRASTRUCTURE' | 'SECURITY' | 'CONTENT' | 'TESTING';
}

interface Readiness {
  ready: boolean;
  blockers: string[];
  completedItems: number;
  totalItems: number;
}

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

export function useGoLive(projectId: string) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [readiness, setReadiness] = useState<Readiness>({ ready: false, blockers: [], completedItems: 0, totalItems: 0 });
  const [documents, setDocuments] = useState<HandoverDocument[]>([]);
  const [warranty, setWarranty] = useState<WarrantyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const [checklistData, readinessData, handoverData] = await Promise.all([
        api.get<ChecklistItem[]>(`/projects/${projectId}/go-live/checklist`),
        api.get<Readiness>(`/projects/${projectId}/go-live/readiness`),
        api.get<{ documents: HandoverDocument[]; warranty: WarrantyInfo }>(`/projects/${projectId}/go-live/handover`),
      ]);
      setChecklist(checklistData);
      setReadiness(readinessData);
      setDocuments(handoverData.documents);
      setWarranty(handoverData.warranty);
    } catch (err) {
      handleError(err, fetchData);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    checklist, 
    readiness, 
    documents, 
    warranty, 
    loading, 
    error: userMessage, 
    refresh: fetchData 
  };
}

export default useGoLive;
