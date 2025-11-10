import { useCallback } from 'react';
import { apiRequest, buildQuery } from '../lib/api';
import { ListParams, SignalEvent } from '../types/api';

interface CreateSignalEventInput {
  userId: string;
  type: string;
  delta: number;
}

type UpdateSignalEventInput = Partial<Omit<CreateSignalEventInput, 'userId'>>;

export function useSignalEvents() {
  const fetchAll = useCallback(async (params?: ListParams): Promise<SignalEvent[]> => {
    const query = buildQuery(params);
    return apiRequest<SignalEvent[]>(`/api/signal-events${query}`);
  }, []);

  const fetchById = useCallback(async (id: string): Promise<SignalEvent> => {
    return apiRequest<SignalEvent>(`/api/signal-events/${id}`);
  }, []);

  const create = useCallback(
    async (payload: CreateSignalEventInput): Promise<SignalEvent> => {
      return apiRequest<SignalEvent>('/api/signal-events', {
        method: 'POST',
        body: payload,
      });
    },
    [],
  );

  const update = useCallback(
    async (id: string, payload: UpdateSignalEventInput): Promise<SignalEvent> => {
      return apiRequest<SignalEvent>(`/api/signal-events/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<SignalEvent> => {
    return apiRequest<SignalEvent>(`/api/signal-events/${id}`, { method: 'DELETE' });
  }, []);

  return {
    fetchAll,
    fetchById,
    create,
    update,
    remove,
  };
}
