import { useCallback } from 'react';
import { apiRequest, buildQuery } from '../lib/api';
import { ListParams, ReferralLoop } from '../types/api';

interface CreateReferralLoopInput {
  userId: string;
  resource: string;
  status: string;
}

type UpdateReferralLoopInput = Partial<Omit<CreateReferralLoopInput, 'userId'>>;

export function useReferralLoops() {
  const fetchAll = useCallback(async (params?: ListParams): Promise<ReferralLoop[]> => {
    const query = buildQuery(params);
    return apiRequest<ReferralLoop[]>(`/api/referral-loops${query}`);
  }, []);

  const fetchById = useCallback(async (id: string): Promise<ReferralLoop> => {
    return apiRequest<ReferralLoop>(`/api/referral-loops/${id}`);
  }, []);

  const create = useCallback(
    async (payload: CreateReferralLoopInput): Promise<ReferralLoop> => {
      return apiRequest<ReferralLoop>('/api/referral-loops', {
        method: 'POST',
        body: payload,
      });
    },
    [],
  );

  const update = useCallback(
    async (id: string, payload: UpdateReferralLoopInput): Promise<ReferralLoop> => {
      return apiRequest<ReferralLoop>(`/api/referral-loops/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<ReferralLoop> => {
    return apiRequest<ReferralLoop>(`/api/referral-loops/${id}`, { method: 'DELETE' });
  }, []);

  return {
    fetchAll,
    fetchById,
    create,
    update,
    remove,
  };
}
