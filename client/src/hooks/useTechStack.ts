import { useState, useEffect, useCallback } from 'react';
import { TechStackItem, TechStackCategory } from '../../../shared/types';
import { get, post, put, del } from '../services/api';
import { useApiError } from './useApiError';

interface TechStackState {
  items: TechStackItem[];
  isLocked: boolean;
}

export function useTechStack(projectId: string) {
  const [items, setItems] = useState<TechStackItem[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchTechStack = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const data = await get<TechStackState>(`/projects/${projectId}/tech-stack`);
      setItems(data.items);
      setIsLocked(data.isLocked);
    } catch (err) {
      handleError(err, fetchTechStack);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    fetchTechStack();
  }, [fetchTechStack]);

  const addItem = async (item: { category: TechStackCategory; name: string; version?: string }) => {
    try {
      await post(`/projects/${projectId}/tech-stack`, item);
      await fetchTechStack();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: { name?: string; version?: string }) => {
    try {
      await put(`/projects/${projectId}/tech-stack/${id}`, updates);
      await fetchTechStack();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await del(`/projects/${projectId}/tech-stack/${id}`);
      await fetchTechStack();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const lockTechStack = async () => {
    try {
      await post(`/projects/${projectId}/tech-stack/lock`, {});
      await fetchTechStack();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const unlockTechStack = async () => {
    try {
      await post(`/projects/${projectId}/tech-stack/unlock`, {});
      await fetchTechStack();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return { 
    items, 
    isLocked, 
    loading, 
    error: userMessage, 
    addItem, 
    updateItem, 
    deleteItem, 
    lockTechStack, 
    unlockTechStack, 
    refresh: fetchTechStack 
  };
}

export default useTechStack;
