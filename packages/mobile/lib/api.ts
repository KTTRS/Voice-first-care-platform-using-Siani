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

// ===== Resource Engagement API =====

// Get resource engagements for current user
export const getResourceEngagements = async (
  userId?: string,
  status?: string
) => {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  if (status) params.append("status", status);

  const query = params.toString();
  return fetchAPI(`/api/resource-engagements${query ? `?${query}` : ""}`);
};

// Get single resource engagement
export const getResourceEngagement = async (engagementId: string) => {
  return fetchAPI(`/api/resource-engagements/${engagementId}`);
};

// Update resource engagement status
export const updateResourceEngagement = async (
  engagementId: string,
  updates: {
    status?:
      | "DETECTED"
      | "OFFERED"
      | "ACCEPTED"
      | "DECLINED"
      | "COMPLETED"
      | "FAILED"
      | "ABANDONED";
    metadata?: any;
  }
) => {
  return fetchAPI(
    `/api/resource-engagements/${engagementId}`,
    "PATCH",
    updates
  );
};

// Accept a resource offer
export const acceptResourceOffer = async (engagementId: string) => {
  return updateResourceEngagement(engagementId, { status: "ACCEPTED" });
};

// Decline a resource offer
export const declineResourceOffer = async (
  engagementId: string,
  reason?: string
) => {
  return updateResourceEngagement(engagementId, {
    status: "DECLINED",
    metadata: { declineReason: reason },
  });
};

// Mark resource as completed
export const completeResourceEngagement = async (
  engagementId: string,
  rating?: number,
  notes?: string
) => {
  return updateResourceEngagement(engagementId, {
    status: "COMPLETED",
    metadata: { successRating: rating, impactNotes: notes },
  });
};

// Mark resource as failed
export const failResourceEngagement = async (
  engagementId: string,
  reason?: string
) => {
  return updateResourceEngagement(engagementId, {
    status: "FAILED",
    metadata: { failureReason: reason },
  });
};

// Send message to Siani (with SDOH detection)
export const sendMessage = async (message: string, userId: string) => {
  return fetchAPI("/api/messages", "POST", { message, userId });
};

// Get engagement statistics
export const getEngagementStats = async (userId: string) => {
  return fetchAPI(`/api/resource-engagements/stats/${userId}`);
};

// ===== Siani Intelligence API (Memory & Vectors) =====

import { MemoryMoment, MemoryVector } from "./sianiMemory";

/**
 * Sync memory moments to backend
 */
export const syncMemoryMoments = async (moments: MemoryMoment[]) => {
  return fetchAPI("/api/memoryMoments", "POST", { moments });
};

/**
 * Get memory moments for user
 */
export const getMemoryMoments = async (
  userId: string,
  limit = 50,
  offset = 0
) => {
  return fetchAPI(
    `/api/memoryMoments?userId=${userId}&limit=${limit}&offset=${offset}`
  );
};

/**
 * Sync memory vectors to backend
 */
export const syncMemoryVectors = async (vectors: MemoryVector[]) => {
  return fetchAPI("/api/memoryVectors", "POST", { vectors });
};

/**
 * Search for similar memory vectors
 */
export const searchMemoryVectors = async (
  userId: string,
  vector: number[],
  topK = 5,
  minSimilarity = 0.7
) => {
  return fetchAPI("/api/memoryVectors/search", "POST", {
    userId,
    vector,
    topK,
    minSimilarity,
  });
};

/**
 * Create or update referral loop
 */
export const syncReferralLoop = async (loop: {
  userId: string;
  memoryMomentId: string;
  category: string;
  subcategory: string;
  resourceOffered: boolean;
  resourceAccepted?: boolean;
  resourceShared?: boolean;
  resourceViewed?: boolean;
  resourceEngaged?: boolean;
  resourceCompleted?: boolean;
  loopClosed?: boolean;
  status: string;
}) => {
  return fetchAPI("/api/referralLoops", "POST", loop);
};

/**
 * Get unclosed referral loops for user
 */
export const getUnclosedLoops = async (userId: string) => {
  return fetchAPI(`/api/referralLoops?userId=${userId}&loopClosed=false`);
};

/**
 * Update referral loop status
 */
export const updateReferralLoop = async (
  loopId: string,
  updates: {
    resourceAccepted?: boolean;
    resourceShared?: boolean;
    resourceViewed?: boolean;
    resourceEngaged?: boolean;
    resourceCompleted?: boolean;
    loopClosed?: boolean;
    status?: string;
  }
) => {
  return fetchAPI(`/api/referralLoops/${loopId}`, "PATCH", updates);
};

/**
 * Batch sync all Siani intelligence data
 * (Memories, vectors, and loops)
 */
export const syncSianiData = async (data: {
  moments?: MemoryMoment[];
  vectors?: MemoryVector[];
  loops?: Array<{
    userId: string;
    memoryMomentId: string;
    category: string;
    subcategory: string;
    resourceOffered: boolean;
    resourceAccepted?: boolean;
    status: string;
  }>;
}) => {
  const results = {
    moments: null as any,
    vectors: null as any,
    loops: null as any,
  };

  // Sync moments first (they're referenced by vectors and loops)
  if (data.moments && data.moments.length > 0) {
    results.moments = await syncMemoryMoments(data.moments);
  }

  // Sync vectors (can happen in parallel with loops)
  if (data.vectors && data.vectors.length > 0) {
    results.vectors = await syncMemoryVectors(data.vectors);
  }

  // Sync loops
  if (data.loops && data.loops.length > 0) {
    // Sync each loop individually (backend doesn't support batch yet)
    results.loops = await Promise.all(
      data.loops.map((loop) => syncReferralLoop(loop))
    );
  }

  return results;
};

/**
 * Transcribe audio file
 * POST /api/voice/transcribe
 */
export const transcribeAudio = async (
  audioUri: string
): Promise<{
  text: string;
  language?: string;
  duration?: number;
  source?: string;
}> => {
  const token = await getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    type: "audio/m4a",
    name: "recording.m4a",
  } as any);

  console.log(`[API] POST /api/voice/transcribe`);

  const response = await fetch(`${API_URL}/api/voice/transcribe`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Transcription failed");
  }

  console.log(`[API] ✅ Transcription succeeded (source: ${data.source})`);
  return data;
};

/**
 * Analyze audio with full voice pipeline
 * POST /api/voice/analyze
 */
export const analyzeVoice = async (
  audioUri: string,
  extraFields?: Record<string, string>
): Promise<{
  transcription: string;
  emotion: string;
  intent?: string;
  sdohFlags: string[];
  memoryMomentId: string;
  needsIntervention: boolean;
  sianiResponse?: string;
  feedEventId?: string;
}> => {
  const token = await getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    type: "audio/m4a",
    name: "recording.m4a",
  } as any);

  if (extraFields) {
    Object.entries(extraFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
  }

  console.log(`[API] POST /api/voice/analyze`);

  const response = await fetch(`${API_URL}/api/voice/analyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Voice analysis failed");
  }

  console.log(`[API] ✅ Voice analysis succeeded (emotion: ${data.emotion})`);
  return data;
};

/**
 * Check transcription service health
 * GET /api/voice/health
 */
export const checkTranscriptionHealth = async (): Promise<{
  healthy: boolean;
  strategy: string;
  services: {
    openai: boolean;
    local: boolean;
  };
}> => {
  return await fetchAPI("/api/voice/health");
};
