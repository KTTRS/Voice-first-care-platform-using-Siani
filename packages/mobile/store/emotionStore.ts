import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Emotion Store - Global State Management for Siani
 *
 * Philosophy: "Quietly luxurious, emotionally present, not clinical"
 *
 * Manages:
 * - Current emotion state (calm, anxious, motivated)
 * - User authentication token
 * - Memory moments and goals
 * - Voice recording state
 * - Avatar glow/haptic states
 */

export type EmotionState = "calm" | "anxious" | "motivated" | "neutral";

export interface MemoryMoment {
  id: string;
  text: string;
  content?: string; // Alias for text
  emotion?: EmotionState;
  mood?: string;
  sentiment?: number;
  timestamp: string;
  tags?: string[];
  keywords?: string[]; // For emotion detection
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category?: string; // For ProfileScreen
  progress: number;
  completedActions: number;
  totalActions: number;
  streak: number;
  createdAt: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
}

interface EmotionStore {
  // Auth
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => Promise<void>;
  loadToken: () => Promise<void>;
  setUser: (user: User | null) => void;

  // Emotion State
  currentEmotion: EmotionState;
  emotionIntensity: number; // 0-1
  setEmotion: (emotion: EmotionState, intensity?: number) => void;

  // Memory Moments
  memoryMoments: MemoryMoment[];
  addMemoryMoment: (moment: MemoryMoment) => void;
  setMemoryMoments: (moments: MemoryMoment[]) => void;

  // Goals
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  updateGoalProgress: (goalId: string, progress: number) => void;

  // Voice State
  isListening: boolean;
  isSpeaking: boolean;
  setListening: (listening: boolean) => void;
  setSpeaking: (speaking: boolean) => void;

  // Avatar State
  shouldGlow: boolean;
  shouldHaptic: boolean;
  setGlow: (glow: boolean) => void;
  setHaptic: (haptic: boolean) => void;

  // Loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useEmotionStore = create<EmotionStore>((set, get) => ({
  // Auth
  token: null,
  user: null,

  setToken: async (token: string | null) => {
    if (token) {
      await AsyncStorage.setItem("@siani_token", token);
    } else {
      await AsyncStorage.removeItem("@siani_token");
    }
    set({ token });
  },

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem("@siani_token");
      set({ token });
    } catch (error) {
      console.error("Error loading token:", error);
    }
  },

  setUser: (user) => set({ user }),

  // Emotion State
  currentEmotion: "calm",
  emotionIntensity: 0.5,

  setEmotion: (emotion, intensity = 0.7) => {
    set({
      currentEmotion: emotion,
      emotionIntensity: intensity,
      shouldGlow: true, // Trigger glow on emotion change
    });

    // Auto-reset glow after animation
    setTimeout(() => {
      set({ shouldGlow: false });
    }, 3000);
  },

  // Memory Moments
  memoryMoments: [],

  addMemoryMoment: (moment) => {
    set((state) => ({
      memoryMoments: [moment, ...state.memoryMoments],
    }));

    // Detect emotion from moment and update state
    if (moment.emotion) {
      get().setEmotion(
        moment.emotion,
        moment.sentiment ? Math.abs(moment.sentiment) : 0.7
      );
    }
  },

  setMemoryMoments: (moments) => set({ memoryMoments: moments }),

  // Goals
  goals: [],

  setGoals: (goals) => set({ goals }),

  updateGoalProgress: (goalId, progress) => {
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === goalId ? { ...goal, progress } : goal
      ),
    }));

    // Trigger motivated emotion on progress
    if (progress > 0) {
      get().setEmotion("motivated", 0.8);
    }
  },

  // Voice State
  isListening: false,
  isSpeaking: false,

  setListening: (listening) => {
    set({ isListening: listening });
    if (listening) {
      set({ shouldGlow: true, shouldHaptic: true });
    }
  },

  setSpeaking: (speaking) => {
    set({ isSpeaking: speaking });
    if (speaking) {
      set({ shouldGlow: true });
    }
  },

  // Avatar State
  shouldGlow: false,
  shouldHaptic: false,

  setGlow: (glow) => set({ shouldGlow: glow }),
  setHaptic: (haptic) => set({ shouldHaptic: haptic }),

  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));

/**
 * Emotion-to-Color Mapping (for avatar glow)
 */
export const EMOTION_COLORS = {
  calm: {
    primary: "rgba(255, 182, 193, 0.6)", // Soft blush
    secondary: "rgba(255, 218, 224, 0.4)",
  },
  anxious: {
    primary: "rgba(255, 193, 7, 0.6)", // Amber/pale red
    secondary: "rgba(255, 224, 130, 0.4)",
  },
  motivated: {
    primary: "rgba(218, 165, 32, 0.7)", // Gold/blue
    secondary: "rgba(135, 206, 235, 0.5)",
  },
  neutral: {
    primary: "rgba(200, 200, 200, 0.4)", // Subtle gray
    secondary: "rgba(220, 220, 220, 0.3)",
  },
} as const;

/**
 * Haptic Patterns (for avatar feedback)
 */
export const HAPTIC_PATTERNS = {
  calm: {
    type: "impactLight" as const,
    interval: 2000, // Gentle pulse every 2s
  },
  anxious: {
    type: "impactMedium" as const,
    interval: 500, // Short sharp tap every 500ms
  },
  motivated: {
    type: "impactHeavy" as const,
    interval: 1500, // Steady pulse every 1.5s
  },
  neutral: {
    type: "selectionChanged" as const,
    interval: 3000, // Very subtle
  },
} as const;
