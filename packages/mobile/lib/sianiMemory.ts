/**
 * Siani Memory System
 *
 * Stores conversation moments with emotional context, SDOH flags, and timestamps.
 * Enables Siani to remember patterns, build rapport, and reference past conversations naturally.
 *
 * Philosophy: Best friend who actually remembers what you've shared.
 */

export type MoodType =
  | "overwhelmed"
  | "hopeful"
  | "burnt_out"
  | "anxious"
  | "relieved"
  | "frustrated"
  | "lonely"
  | "content"
  | "stressed"
  | "grateful"
  | "angry"
  | "sad"
  | "neutral";

export interface MemoryMoment {
  id: string;
  userId: string;
  text: string; // User's original message
  timestamp: Date;
  mood: MoodType;
  sentiment: number; // -1 to 1 (negative to positive)
  sdohCategory?: string; // If SDOH was detected
  sdohSubcategory?: string;
  sdohConfidence?: number;
  trigger?: string; // Optional notable trigger ("first time mentioned dad")
  context?: string; // Optional context notes ("right after job loss")
  rapportScore: number; // 0-100, how connected the conversation felt
  conversationId: string; // Groups messages from same session
}

export interface MemoryVector {
  id: string;
  userId: string;
  memoryMomentId: string;
  vector: number[]; // Embedding vector (1536-dim for OpenAI)
  timestamp: Date;
}

export interface ReferralLoop {
  id: string;
  userId: string;
  memoryMomentId: string; // Links to the moment when need was detected
  category: string;
  subcategory: string;
  resourceOffered: boolean;
  resourceAccepted: boolean;
  resourceShared: boolean;
  resourceViewed: boolean;
  resourceEngaged: boolean;
  resourceCompleted: boolean;
  loopClosed: boolean;
  lastFollowUpAt?: Date;
  followUpCount: number;
  status:
    | "detected"
    | "offered"
    | "accepted"
    | "in_progress"
    | "completed"
    | "declined"
    | "abandoned";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * In-memory storage for current session
 * (Will be synced to backend via API)
 */
class SianiMemoryStore {
  private moments: MemoryMoment[] = [];
  private currentConversationId: string | null = null;
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  startConversation(): string {
    this.currentConversationId = `conv_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    return this.currentConversationId;
  }

  endConversation() {
    this.currentConversationId = null;
  }

  /**
   * Add a memory moment from user message
   */
  addMoment(params: {
    text: string;
    mood: MoodType;
    sentiment: number;
    sdohCategory?: string;
    sdohSubcategory?: string;
    sdohConfidence?: number;
    trigger?: string;
    context?: string;
    rapportScore: number;
  }): MemoryMoment {
    if (!this.userId) {
      throw new Error("User ID not set in memory store");
    }

    if (!this.currentConversationId) {
      this.startConversation();
    }

    const moment: MemoryMoment = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      conversationId: this.currentConversationId!,
      timestamp: new Date(),
      ...params,
    };

    this.moments.push(moment);
    return moment;
  }

  /**
   * Get recent moments for context
   */
  getRecentMoments(limit: number = 10): MemoryMoment[] {
    return this.moments
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get moments by mood type
   */
  getMomentsByMood(mood: MoodType): MemoryMoment[] {
    return this.moments.filter((m) => m.mood === mood);
  }

  /**
   * Get moments with SDOH detections
   */
  getSDOHMoments(): MemoryMoment[] {
    return this.moments.filter((m) => m.sdohCategory !== undefined);
  }

  /**
   * Calculate average sentiment over time
   */
  getAverageSentiment(days: number = 7): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recentMoments = this.moments.filter((m) => m.timestamp >= cutoff);

    if (recentMoments.length === 0) return 0;

    const sum = recentMoments.reduce((acc, m) => acc + m.sentiment, 0);
    return sum / recentMoments.length;
  }

  /**
   * Calculate current rapport score
   * Based on conversation frequency, sentiment, and engagement
   */
  calculateRapportScore(): number {
    if (this.moments.length === 0) return 0;

    const conversationCount = new Set(this.moments.map((m) => m.conversationId))
      .size;
    const avgSentiment = this.getAverageSentiment(30); // Last 30 days
    const recentEngagement = this.moments.length;

    // Weighted score
    const conversationWeight = Math.min(conversationCount * 5, 40); // Max 40 points
    const sentimentWeight = (avgSentiment + 1) * 25; // -1 to 1 => 0 to 50 points
    const engagementWeight = Math.min(recentEngagement * 2, 10); // Max 10 points

    return Math.min(
      conversationWeight + sentimentWeight + engagementWeight,
      100
    );
  }

  /**
   * Get all moments for syncing to backend
   */
  getAllMoments(): MemoryMoment[] {
    return [...this.moments];
  }

  /**
   * Clear local cache after successful sync
   */
  clearSyncedMoments(momentIds: string[]) {
    this.moments = this.moments.filter((m) => !momentIds.includes(m.id));
  }
}

// Singleton instance
export const sianiMemory = new SianiMemoryStore();

/**
 * Detect mood from message text
 * Simple sentiment analysis - can be enhanced with ML model
 */
export function detectMood(message: string, sentiment: number): MoodType {
  const lower = message.toLowerCase();

  // Overwhelmed patterns
  if (
    lower.includes("too much") ||
    lower.includes("can't handle") ||
    lower.includes("overwhelming") ||
    lower.includes("drowning")
  ) {
    return "overwhelmed";
  }

  // Burnt out patterns
  if (
    lower.includes("exhausted") ||
    lower.includes("burned out") ||
    lower.includes("running on empty") ||
    lower.includes("can't keep doing this")
  ) {
    return "burnt_out";
  }

  // Hopeful patterns
  if (
    lower.includes("hoping") ||
    lower.includes("looking forward") ||
    lower.includes("excited") ||
    lower.includes("can't wait")
  ) {
    return "hopeful";
  }

  // Anxious patterns
  if (
    lower.includes("worried") ||
    lower.includes("nervous") ||
    lower.includes("scared") ||
    lower.includes("anxious") ||
    lower.includes("afraid")
  ) {
    return "anxious";
  }

  // Frustrated patterns
  if (
    lower.includes("frustrated") ||
    lower.includes("annoyed") ||
    lower.includes("irritated") ||
    lower.includes("fed up")
  ) {
    return "frustrated";
  }

  // Lonely patterns
  if (
    lower.includes("alone") ||
    lower.includes("lonely") ||
    lower.includes("isolated") ||
    lower.includes("no one")
  ) {
    return "lonely";
  }

  // Grateful patterns
  if (
    lower.includes("thank you") ||
    lower.includes("grateful") ||
    lower.includes("appreciate") ||
    lower.includes("blessed")
  ) {
    return "grateful";
  }

  // Relieved patterns
  if (
    lower.includes("relieved") ||
    lower.includes("better") ||
    lower.includes("glad") ||
    lower.includes("phew")
  ) {
    return "relieved";
  }

  // Sad patterns
  if (
    lower.includes("sad") ||
    lower.includes("crying") ||
    lower.includes("depressed") ||
    lower.includes("hopeless")
  ) {
    return "sad";
  }

  // Angry patterns
  if (
    lower.includes("angry") ||
    lower.includes("furious") ||
    lower.includes("pissed") ||
    lower.includes("mad")
  ) {
    return "angry";
  }

  // Use sentiment to determine if content or stressed
  if (sentiment > 0.3) return "content";
  if (sentiment < -0.3) return "stressed";

  return "neutral";
}

/**
 * Calculate sentiment score from message
 * Simple keyword-based approach - can be enhanced with ML
 * Returns -1 to 1
 */
export function calculateSentiment(message: string): number {
  const lower = message.toLowerCase();

  const positiveWords = [
    "good",
    "great",
    "happy",
    "better",
    "improving",
    "love",
    "wonderful",
    "amazing",
    "excited",
    "grateful",
    "blessed",
    "thankful",
    "relieved",
  ];

  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "worse",
    "hate",
    "horrible",
    "struggling",
    "difficult",
    "hard",
    "painful",
    "scared",
    "worried",
    "anxious",
    "stressed",
    "overwhelmed",
    "exhausted",
  ];

  let score = 0;

  positiveWords.forEach((word) => {
    if (lower.includes(word)) score += 0.1;
  });

  negativeWords.forEach((word) => {
    if (lower.includes(word)) score -= 0.1;
  });

  return Math.max(-1, Math.min(1, score));
}

/**
 * Determine if this moment represents a notable trigger
 * (First time mentioning something significant)
 */
export function detectTrigger(
  message: string,
  previousMoments: MemoryMoment[]
): string | undefined {
  const lower = message.toLowerCase();

  const triggers = [
    {
      pattern: /\b(my|her|his) (dad|father|mom|mother|parent)\b/i,
      label: "family_mention",
    },
    {
      pattern: /\bjob\b|\bwork\b|\bfired\b|\blaid off\b/i,
      label: "employment_mention",
    },
    {
      pattern: /\bdivorce\b|\bseparated\b|\bbreakup\b/i,
      label: "relationship_change",
    },
    { pattern: /\bdeath\b|\bdied\b|\bpassed away\b/i, label: "loss" },
    { pattern: /\bpregnant\b|\bbaby\b|\bnewborn\b/i, label: "new_child" },
    {
      pattern: /\bcancer\b|\bdiagnosed\b|\bsurgery\b/i,
      label: "health_crisis",
    },
  ];

  for (const trigger of triggers) {
    if (trigger.pattern.test(message)) {
      // Check if this is the first time mentioning this trigger
      const alreadyMentioned = previousMoments.some(
        (m) => m.trigger === trigger.label
      );

      if (!alreadyMentioned) {
        return trigger.label;
      }
    }
  }

  return undefined;
}

/**
 * Create rapport-building response based on memory
 */
export function generateMemoryReference(
  currentMood: MoodType,
  previousMoments: MemoryMoment[]
): string | null {
  // Look for similar mood in past
  const similarMoodMoments = previousMoments.filter(
    (m) => m.mood === currentMood
  );

  if (similarMoodMoments.length > 0 && similarMoodMoments[0].timestamp) {
    const daysSince = Math.floor(
      (Date.now() - similarMoodMoments[0].timestamp.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSince > 2 && daysSince < 30) {
      const timeRef =
        daysSince < 7
          ? "a few days ago"
          : daysSince < 14
          ? "last week"
          : "a couple weeks back";

      return `I remember you felt something kind of like this ${timeRef}. Want to talk about how this one feels?`;
    }
  }

  // Look for improvement since last low point
  const sadMoments = previousMoments.filter((m) => m.sentiment < -0.5);
  if (sadMoments.length > 0 && currentMood === "hopeful") {
    return "It sounds like things might be looking up a bit? I'm glad to hear that in your voice.";
  }

  return null;
}
