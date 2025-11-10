import { useCallback } from 'react';
import { apiRequest, buildQuery } from '../lib/api';
import { DailyAction, ListParams } from '../types/api';

interface CreateDailyActionInput {
  userId: string;
  goalId?: string | null;
  content: string;
  points: number;
  completed?: boolean;
}

type UpdateDailyActionInput = Partial<Omit<CreateDailyActionInput, 'userId'>>;

export function useDailyActions() {
  const fetchAll = useCallback(async (params?: ListParams): Promise<DailyAction[]> => {
    const query = buildQuery(params);
    return apiRequest<DailyAction[]>(`/api/daily-actions${query}`);
  }, []);

  const fetchById = useCallback(async (id: string): Promise<DailyAction> => {
    return apiRequest<DailyAction>(`/api/daily-actions/${id}`);
  }, []);

  const create = useCallback(async (payload: CreateDailyActionInput): Promise<DailyAction> => {
    return apiRequest<DailyAction>('/api/daily-actions', {
      method: 'POST',
      body: payload,
    });
  }, []);

  const update = useCallback(
    async (id: string, payload: UpdateDailyActionInput): Promise<DailyAction> => {
      return apiRequest<DailyAction>(`/api/daily-actions/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<DailyAction> => {
    return apiRequest<DailyAction>(`/api/daily-actions/${id}`, { method: 'DELETE' });
  }, []);

  return {
    fetchAll,
    fetchById,
    create,
    update,
    remove,
  };
}
