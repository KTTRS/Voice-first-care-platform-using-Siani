export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryMoment {
  id: string;
  userId: string;
  content: string;
  emotion: string;
  tone: string;
  vectorId: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  points: number;
  isActive: boolean;
  createdAt: string;
  dailyActions?: DailyAction[];
}

export interface DailyAction {
  id: string;
  userId: string;
  goalId?: string | null;
  content: string;
  points: number;
  completed: boolean;
  createdAt: string;
}

export interface ReferralLoop {
  id: string;
  userId: string;
  resource: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignalEvent {
  id: string;
  userId: string;
  type: string;
  delta: number;
  createdAt: string;
}

export interface ListParams {
  limit?: number;
  offset?: number;
}
