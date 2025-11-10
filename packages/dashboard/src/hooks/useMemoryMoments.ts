import { useCallback } from 'react';
import { apiRequest, buildQuery } from '../lib/api';
import { ListParams, MemoryMoment } from '../types/api';

interface CreateMemoryMomentInput {
  userId: string;
  content: string;
  emotion: string;
  tone: string;
  vectorId: string;
}

type UpdateMemoryMomentInput = Partial<Omit<CreateMemoryMomentInput, 'userId'>>;

export function useMemoryMoments() {
  const fetchAll = useCallback(
    async (params?: ListParams): Promise<MemoryMoment[]> => {
      const query = buildQuery(params);
      return apiRequest<MemoryMoment[]>(`/api/memory-moments${query}`);
    },
    [],
  );

  const fetchById = useCallback(async (id: string): Promise<MemoryMoment> => {
    return apiRequest<MemoryMoment>(`/api/memory-moments/${id}`);
  }, []);

  const create = useCallback(
    async (payload: CreateMemoryMomentInput): Promise<MemoryMoment> => {
      return apiRequest<MemoryMoment>('/api/memory-moments', {
        method: 'POST',
        body: payload,
      });
    },
    [],
  );

  const update = useCallback(
    async (id: string, payload: UpdateMemoryMomentInput): Promise<MemoryMoment> => {
      return apiRequest<MemoryMoment>(`/api/memory-moments/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<MemoryMoment> => {
    return apiRequest<MemoryMoment>(`/api/memory-moments/${id}`, { method: 'DELETE' });
  }, []);

  return {
    fetchAll,
    fetchById,
    create,
    update,
    remove,
  };
}
