import { useCallback } from 'react';
import { apiRequest, buildQuery } from '../lib/api';
import { Goal, ListParams } from '../types/api';

interface CreateGoalInput {
  userId: string;
  title: string;
  points: number;
  isActive?: boolean;
}

type UpdateGoalInput = Partial<Omit<CreateGoalInput, 'userId'>>;

export function useGoals() {
  const fetchAll = useCallback(async (params?: ListParams): Promise<Goal[]> => {
    const query = buildQuery(params);
    return apiRequest<Goal[]>(`/api/goals${query}`);
  }, []);

  const fetchById = useCallback(async (id: string): Promise<Goal> => {
    return apiRequest<Goal>(`/api/goals/${id}`);
  }, []);

  const create = useCallback(async (payload: CreateGoalInput): Promise<Goal> => {
    return apiRequest<Goal>('/api/goals', {
      method: 'POST',
      body: payload,
    });
  }, []);

  const update = useCallback(async (id: string, payload: UpdateGoalInput): Promise<Goal> => {
    return apiRequest<Goal>(`/api/goals/${id}`, {
      method: 'PUT',
      body: payload,
    });
  }, []);

  const remove = useCallback(async (id: string): Promise<Goal> => {
    return apiRequest<Goal>(`/api/goals/${id}`, { method: 'DELETE' });
  }, []);

  return {
    fetchAll,
    fetchById,
    create,
    update,
    remove,
  };
}
