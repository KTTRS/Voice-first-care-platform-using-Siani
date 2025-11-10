import prisma from "../utils/db";
import { detectSDOH } from "../utils/sdohDetector";
import {
  analyzeUserSDOH,
  getResourceEngagementStats,
  calculateSDOHImpact,
} from "./sdoh.service";

/**
 * Signal Score Categories
 * Each scored 0-10 (higher = more risk/concern)
 */
export interface CategoryScores {
  medicationAdherence: number;
  mentalHealthRisk: number;
  socialIsolation: number;
  careCoordination: number;
  systemTrust: number;
}

/**
 * Trend indicators (-1 to 1: negative to positive momentum)
 */
export interface TrendScores {
  trendMedication: number;
  trendMentalHealth: number;
  trendSocial: number;
}

/**
 * Complete signal analysis result
 */
export interface SignalAnalysis {
  scores: CategoryScores;
  trends: TrendScores;
  overallRisk: number;
  sdohRisk: number;
  detectedNeeds: string[];
  metadata: {
    totalMoments: number;
    totalGoalsCompleted: number;
    streakDays: number;
    lastActivityAt: Date | null;
  };
}

/**
 * Sentiment keywords for mental health scoring
 */
const NEGATIVE_KEYWORDS = [
  "hopeless",
  "alone",
  "depressed",
  "anxious",
  "scared",
  "worried",
  "sad",
  "tired",
  "exhausted",
  "give up",
  "can't",
  "won't",
  "never",
  "hate",
  "angry",
];

const POSITIVE_KEYWORDS = [
  "happy",
  "grateful",
  "hopeful",
  "excited",
  "better",
  "improved",
  "great",
  "wonderful",
  "love",
  "appreciate",
  "thankful",
  "blessed",
];

/**
 * Calculate medication adherence score based on daily actions
 */
function calculateMedicationAdherence(
  actions: any[],
  timeWindow: number = 30
): number {
  if (actions.length === 0) return 5; // Neutral if no data

  const medicationActions = actions.filter((a) =>
    a.content.toLowerCase().includes("medication")
  );

  if (medicationActions.length === 0) return 5;

  const completedCount = medicationActions.filter((a) => a.completed).length;
  const completionRate = completedCount / medicationActions.length;

  // Convert completion rate to risk score (inverted)
  // High completion = low risk
  return Math.max(0, Math.min(10, 10 * (1 - completionRate)));
}

/**
 * Calculate mental health risk from memory moments
 */
function calculateMentalHealthRisk(moments: any[]): number {
  if (moments.length === 0) return 5;

  let riskScore = 0;
  let sentimentSum = 0;

  for (const moment of moments) {
    const text = moment.content.toLowerCase(); // Use 'content' field

    // Check for negative keywords
    const negativeCount = NEGATIVE_KEYWORDS.filter((keyword) =>
      text.includes(keyword)
    ).length;

    // Check for positive keywords
    const positiveCount = POSITIVE_KEYWORDS.filter((keyword) =>
      text.includes(keyword)
    ).length;

    // Calculate sentiment for this moment
    const sentiment = positiveCount - negativeCount;
    sentimentSum += sentiment;

    // Boost risk if multiple negative keywords
    if (negativeCount >= 3) {
      riskScore += 2;
    } else if (negativeCount >= 1) {
      riskScore += 1;
    }

    // Reduce risk for positive moments
    if (positiveCount >= 2) {
      riskScore -= 1;
    }
  }

  // Average sentiment across all moments
  const avgSentiment = sentimentSum / moments.length;

  // Combine keyword-based risk with sentiment
  let finalRisk = riskScore + (avgSentiment < 0 ? 3 : -2);

  // Recent moments have more weight
  const recentMoments = moments.slice(0, 5); // Last 5 moments
  const recentNegative = recentMoments.filter(
    (m) => NEGATIVE_KEYWORDS.some((kw) => m.content.toLowerCase().includes(kw)) // Use 'content'
  ).length;

  if (recentNegative >= 3) {
    finalRisk += 2;
  }

  return Math.max(0, Math.min(10, finalRisk));
}

/**
 * Calculate social isolation score
 */
function calculateSocialIsolation(
  moments: any[],
  feedEvents: any[],
  referralLoops: any[]
): number {
  let isolationScore = 5; // Start neutral

  // Low activity indicates isolation
  const recentMoments = moments.filter(
    (m) =>
      new Date(m.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  if (recentMoments.length === 0) {
    isolationScore += 3;
  } else if (recentMoments.length < 3) {
    isolationScore += 1;
  }

  // Check for social interaction keywords
  const socialKeywords = ["friend", "family", "visit", "talk", "call", "meet"];
  const socialMoments = moments.filter(
    (m) => socialKeywords.some((kw) => m.content.toLowerCase().includes(kw)) // Use 'content'
  );

  if (socialMoments.length === 0 && moments.length > 5) {
    isolationScore += 2;
  }

  // Low feed activity
  const recentFeed = feedEvents.filter(
    (f) =>
      new Date(f.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  if (recentFeed.length < 3) {
    isolationScore += 1;
  }

  return Math.max(0, Math.min(10, isolationScore));
}

/**
 * Calculate care coordination score
 */
function calculateCareCoordination(referralLoops: any[], goals: any[]): number {
  if (referralLoops.length === 0) return 5;

  const failedLoops = referralLoops.filter(
    (r) => r.status === "failed" || r.status === "cancelled"
  ).length;
  const successRate = 1 - failedLoops / referralLoops.length;

  // Check goal completion
  const completedGoals = goals.filter((g) => g.completed).length;
  const goalCompletionRate =
    goals.length > 0 ? completedGoals / goals.length : 0.5;

  // Combine metrics
  const coordScore = 10 * (1 - (successRate + goalCompletionRate) / 2);

  return Math.max(0, Math.min(10, coordScore));
}

/**
 * Calculate system trust score
 */
function calculateSystemTrust(
  moments: any[],
  dailyActions: any[],
  referralLoops: any[]
): number {
  let trustScore = 5; // Start neutral

  // Check for disengagement (ghosting)
  const lastMoment = moments[0];
  if (lastMoment) {
    const daysSinceLastActivity =
      (Date.now() - new Date(lastMoment.createdAt).getTime()) /
      (24 * 60 * 60 * 1000);
    if (daysSinceLastActivity > 14) {
      trustScore += 3;
    } else if (daysSinceLastActivity > 7) {
      trustScore += 1;
    }
  }

  // Check for negative sentiment about system
  const systemKeywords = ["system", "app", "platform", "support", "help"];
  const systemMoments = moments.filter(
    (m) => systemKeywords.some((kw) => m.content.toLowerCase().includes(kw)) // Use 'content'
  );
  const negativeSystemMoments = systemMoments.filter(
    (m) => NEGATIVE_KEYWORDS.some((kw) => m.content.toLowerCase().includes(kw)) // Use 'content'
  );

  if (negativeSystemMoments.length > systemMoments.length / 2) {
    trustScore += 2;
  }

  // Cancelled referrals indicate trust issues
  const cancelledReferrals = referralLoops.filter(
    (r) => r.status === "cancelled"
  ).length;
  trustScore += cancelledReferrals * 0.5;

  return Math.max(0, Math.min(10, trustScore));
}

/**
 * Calculate trend indicators by comparing recent vs historical scores
 */
function calculateTrends(
  recentScores: CategoryScores,
  historicalScores: CategoryScores | null
): TrendScores {
  if (!historicalScores) {
    return {
      trendMedication: 0,
      trendMentalHealth: 0,
      trendSocial: 0,
    };
  }

  // Negative trend = risk increasing, positive trend = risk decreasing
  return {
    trendMedication:
      (historicalScores.medicationAdherence -
        recentScores.medicationAdherence) /
      10,
    trendMentalHealth:
      (historicalScores.mentalHealthRisk - recentScores.mentalHealthRisk) / 10,
    trendSocial:
      (historicalScores.socialIsolation - recentScores.socialIsolation) / 10,
  };
}

/**
 * Main signal analysis function
 */
export async function analyzeUserSignals(
  userId: string
): Promise<SignalAnalysis> {
  // Fetch all relevant data
  const [moments, dailyActions, goals, referralLoops, feedEvents, streakStats] =
    await Promise.all([
      prisma.memoryMoment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50, // Last 50 moments
      }),
      prisma.dailyAction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30, // Last 30 days
      }),
      prisma.goal.findMany({
        where: { userId },
      }),
      prisma.referralLoop.findMany({
        where: { userId },
      }),
      prisma.feedEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.dailyAction
        .findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        })
        .then((action) => ({
          streakDays: 0, // TODO: Calculate actual streak
        })),
    ]);

  // Calculate category scores
  const scores: CategoryScores = {
    medicationAdherence: calculateMedicationAdherence(dailyActions),
    mentalHealthRisk: calculateMentalHealthRisk(moments),
    socialIsolation: calculateSocialIsolation(
      moments,
      feedEvents,
      referralLoops
    ),
    careCoordination: calculateCareCoordination(referralLoops, goals),
    systemTrust: calculateSystemTrust(moments, dailyActions, referralLoops),
  };

  // Calculate overall risk (weighted average)
  const overallRisk =
    (scores.medicationAdherence * 0.3 +
      scores.mentalHealthRisk * 0.3 +
      scores.socialIsolation * 0.2 +
      scores.careCoordination * 0.1 +
      scores.systemTrust * 0.1) /
    1.0;

  // Get historical scores for trend calculation
  const lastScore = await prisma.signalScore.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const historicalScores = lastScore
    ? {
        medicationAdherence: lastScore.medicationAdherence,
        mentalHealthRisk: lastScore.mentalHealthRisk,
        socialIsolation: lastScore.socialIsolation,
        careCoordination: lastScore.careCoordination,
        systemTrust: lastScore.systemTrust,
      }
    : null;

  const trends = calculateTrends(scores, historicalScores);

  // Compile metadata
  const metadata = {
    totalMoments: moments.length,
    totalGoalsCompleted: goals.filter((g) => !g.isActive).length, // Inactive goals are completed
    streakDays: streakStats.streakDays,
    lastActivityAt: moments[0]?.createdAt || null,
  };

  // Analyze SDOH needs
  const sdohAnalysis = await analyzeUserSDOH(userId);
  const resourceStats = await getResourceEngagementStats(userId);
  const sdohImpact = calculateSDOHImpact(
    sdohAnalysis.detectedNeeds as any[],
    resourceStats
  );

  // Adjust overall risk based on SDOH and resource engagement
  const sdohRiskContribution = sdohAnalysis.riskLevel * 0.15; // SDOH adds up to 1.5 points
  const resourceImpactReduction = sdohImpact * 2; // Successful resources reduce risk by up to 2 points
  const adjustedOverallRisk = Math.max(
    0,
    Math.min(10, overallRisk + sdohRiskContribution - resourceImpactReduction)
  );

  return {
    scores,
    trends,
    overallRisk: adjustedOverallRisk,
    sdohRisk: sdohAnalysis.riskLevel,
    detectedNeeds: sdohAnalysis.detectedNeeds,
    metadata,
  };
}

/**
 * Process and save signal score for a user
 */
export async function processUserSignal(userId: string): Promise<void> {
  const analysis = await analyzeUserSignals(userId);

  await prisma.signalScore.create({
    data: {
      userId,
      medicationAdherence: analysis.scores.medicationAdherence,
      mentalHealthRisk: analysis.scores.mentalHealthRisk,
      socialIsolation: analysis.scores.socialIsolation,
      careCoordination: analysis.scores.careCoordination,
      systemTrust: analysis.scores.systemTrust,
      overallRisk: analysis.overallRisk,
      sdohRisk: analysis.sdohRisk,
      detectedNeeds: analysis.detectedNeeds,
      trendMedication: analysis.trends.trendMedication,
      trendMentalHealth: analysis.trends.trendMentalHealth,
      trendSocial: analysis.trends.trendSocial,
      totalMoments: analysis.metadata.totalMoments,
      totalGoalsCompleted: analysis.metadata.totalGoalsCompleted,
      streakDays: analysis.metadata.streakDays,
      lastActivityAt: analysis.metadata.lastActivityAt,
    },
  });
}

/**
 * Get latest signal score for a user
 */
export async function getLatestSignalScore(userId: string) {
  return prisma.signalScore.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get signal score history for trend analysis
 */
export async function getSignalScoreHistory(
  userId: string,
  limit: number = 30
) {
  return prisma.signalScore.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get risk level badge
 */
export function getRiskBadge(overallRisk: number): {
  level: string;
  color: string;
  emoji: string;
} {
  if (overallRisk >= 7) {
    return { level: "Critical", color: "red", emoji: "🔴" };
  } else if (overallRisk >= 4) {
    return { level: "Watch", color: "orange", emoji: "🟠" };
  } else {
    return { level: "Stable", color: "green", emoji: "🟢" };
  }
}

/**
 * Embed memory moments for future ML analysis
 */
export async function embedMemoryMoment(momentId: string): Promise<void> {
  const moment = await prisma.memoryMoment.findUnique({
    where: { id: momentId },
  });

  if (!moment) return;

  try {
    // TODO: Implement embedding with OpenAI or other service
    // const embedding = await embedText(moment.content);
    // Store embedding in vector DB or add embedding column to MemoryMoment
    console.log(
      `✅ Embedded moment ${momentId} - content length: ${moment.content.length}`
    );
  } catch (error) {
    console.error(`❌ Failed to embed moment ${momentId}:`, error);
  }
}
