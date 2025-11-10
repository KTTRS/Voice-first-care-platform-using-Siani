import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// Storage keys
const TOKEN_KEY = "accessToken";
const USER_KEY = "user";

// Get stored token
export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

// Save token
export const setToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

// Remove token
export const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
};

// Get stored user
export const getUser = async () => {
  const userJson = await AsyncStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

// Save user
export const setUser = async (user: any): Promise<void> => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Main API fetch function with authentication
export const fetchAPI = async (path: string, method = "GET", body?: any) => {
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error: ${res.status} - ${errorText}`);
  }

  return res.json();
};

// Auth API calls
export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();

  // Save token and user data
  await setToken(data.accessToken);
  await setUser(data.user);

  return data;
};

export const logout = async () => {
  await removeToken();
};

export const register = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) => {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Registration failed");
  }

  const result = await response.json();

  // Save token and user data
  await setToken(result.token);
  await setUser(result.user);

  return result;
};

// Helper function to get goals
export const getGoals = async (page = 1, pageSize = 10) => {
  return fetchAPI(`/api/goals?page=${page}&pageSize=${pageSize}`);
};

// Helper function to get feed
export const getFeed = async (page = 1, pageSize = 10, userId?: string) => {
  const userParam = userId ? `&userId=${userId}` : "";
  return fetchAPI(`/api/feed?page=${page}&pageSize=${pageSize}${userParam}`);
};

// Helper function to get streak stats
export const getMyStreakStats = async () => {
  return fetchAPI("/api/streaks/my-stats");
};

// Helper function to get streak leaderboard
export const getStreakLeaderboard = async (limit = 10) => {
  return fetchAPI(`/api/streaks/leaderboard?limit=${limit}`);
};

// Helper function to complete a daily action
export const completeDailyAction = async (actionId: string) => {
  return fetchAPI(`/api/daily-actions/${actionId}`, "PUT", { completed: true });
};

// Helper function to create a goal
export const createGoal = async (
  userId: string,
  title: string,
  points: number
) => {
  return fetchAPI("/api/goals", "POST", { userId, title, points });
};
