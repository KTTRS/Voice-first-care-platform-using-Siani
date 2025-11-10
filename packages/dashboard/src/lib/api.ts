const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const AUTH_TOKEN = "test-token";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function apiRequest<TResponse>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
  } = {}
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;
  const { method = "GET", body } = options;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export function buildQuery(params?: { limit?: number; offset?: number }) {
  if (!params) return "";
  const search = new URLSearchParams();

  if (typeof params.limit === "number") {
    search.set("limit", String(params.limit));
  }
  if (typeof params.offset === "number") {
    search.set("offset", String(params.offset));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

// Goals API

export interface GoalResponse {
  id: string;
  userId: string;
  title: string;
  points: number;
  isActive: boolean;
  createdAt: string;
  dailyActions?: any[];
}

export interface GoalsListResponse {
  data: GoalResponse[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchGoals(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  userId?: string;
}): Promise<GoalsListResponse> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));
  if (params?.search) query.set("search", params.search);
  if (params?.userId) query.set("userId", params.userId);
  if (params?.isActive !== undefined)
    query.set("isActive", String(params.isActive));

  const queryString = query.toString();
  const path = `/api/goals${queryString ? `?${queryString}` : ""}`;

  return apiRequest<GoalsListResponse>(path);
}
