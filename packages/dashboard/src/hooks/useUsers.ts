import { useCallback } from 'react';
import { apiRequest, buildQuery } from '../lib/api';
import { ListParams, User } from '../types/api';

interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  phone?: string | null;
}

type UpdateUserInput = Partial<CreateUserInput>;

export function useUsers() {
  const fetchAll = useCallback(async (params?: ListParams): Promise<User[]> => {
    const query = buildQuery(params);
    return apiRequest<User[]>(`/api/users${query}`);
  }, []);

  const fetchById = useCallback(async (id: string): Promise<User> => {
    return apiRequest<User>(`/api/users/${id}`);
  }, []);

  const create = useCallback(async (payload: CreateUserInput): Promise<User> => {
    return apiRequest<User>('/api/users', {
      method: 'POST',
      body: payload,
    });
  }, []);

  const update = useCallback(async (id: string, payload: UpdateUserInput): Promise<User> => {
    return apiRequest<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: payload,
    });
  }, []);

  const remove = useCallback(async (id: string): Promise<User> => {
    return apiRequest<User>(`/api/users/${id}`, { method: 'DELETE' });
  }, []);

  return {
    fetchAll,
    fetchById,
    create,
    update,
    remove,
  };
}
