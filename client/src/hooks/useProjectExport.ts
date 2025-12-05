import { useState } from 'react';
import { get, post } from '../services/api';
import { ProjectExport } from '../../../shared/types';
import { useApiError } from './useApiError';

export function useProjectExport(projectId: string) {
  const [loading, setLoading] = useState(false);
  const { error, userMessage, handleError, clearError } = useApiError();

  const exportJSON = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await get<ProjectExport>(`/projects/${projectId}/export/json`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project-${projectId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await get<string>(`/projects/${projectId}/export/csv`);
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks-${projectId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await get<any>(`/projects/${projectId}/export/pdf-data`);
      // In a real app, you'd use a PDF library to generate the PDF
      console.log('PDF data:', data);
      alert('PDF generation would happen here with the data');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const importProject = async (file: File) => {
    try {
      setLoading(true);
      clearError();
      const content = await file.text();
      const data = JSON.parse(content);
      await post(`/projects/${projectId}/export/import`, data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error: userMessage, exportJSON, exportCSV, exportPDF, importProject };
}

export default useProjectExport;
