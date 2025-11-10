import prisma from "../utils/db";

/**
 * SDOH (Social Determinants of Health) Need Types
 */
export enum SDOHNeedType {
  FOOD_INSECURITY = "food_insecurity",
  HOUSING_INSTABILITY = "housing_instability",
  TRANSPORTATION = "transportation",
  CHILDCARE = "childcare",
  FINANCIAL_HARDSHIP = "financial_hardship",
  HEALTH_LITERACY = "health_literacy",
  TRUST_IN_SYSTEM = "trust_in_system",
  EMPLOYMENT = "employment",
  UTILITIES = "utilities",
  LEGAL_ASSISTANCE = "legal_assistance",
  SAFETY_CONCERNS = "safety_concerns",
  SOCIAL_ISOLATION = "social_isolation",
}

/**
 * SDOH Detection Keywords
 * Maps keywords/phrases to SDOH need types
 */
const SDOH_KEYWORDS: Record<SDOHNeedType, string[]> = {
  [SDOHNeedType.FOOD_INSECURITY]: [
    "can't afford food",
    "hungry",
    "food bank",
    "no food",
    "skip meals",
    "not eating",
    "can't buy groceries",
    "food stamps",
    "snap benefits",
    "feeding kids",
  ],
  [SDOHNeedType.HOUSING_INSTABILITY]: [
    "evicted",
    "homeless",
    "no place to stay",
    "can't pay rent",
    "lost apartment",
    "couch surfing",
    "living in car",
    "housing assistance",
    "need shelter",
    "find housing",
    "pay rent",
  ],
  [SDOHNeedType.TRANSPORTATION]: [
    "no ride",
    "can't get there",
    "no car",
    "bus doesn't run",
    "need transportation",
    "can't get to appointment",
    "no way to get",
    "too far to walk",
    "uber expensive",
  ],
  [SDOHNeedType.CHILDCARE]: [
    "no babysitter",
    "can't find childcare",
    "kids need care",
    "daycare too expensive",
    "watching kids",
    "no one to watch",
    "child care",
  ],
  [SDOHNeedType.FINANCIAL_HARDSHIP]: [
    "can't afford",
    "no money",
    "bills piling up",
    "debt",
    "financially struggling",
    "broke",
    "can't pay",
    "financial stress",
    "lost job",
    "unemployed",
  ],
  [SDOHNeedType.HEALTH_LITERACY]: [
    "don't understand",
    "confused about meds",
    "what does this mean",
    "can't read",
    "instructions unclear",
    "don't know how",
    "need explanation",
  ],
  [SDOHNeedType.TRUST_IN_SYSTEM]: [
    "don't trust",
    "doctors don't listen",
    "system doesn't help",
    "given up",
    "pointless",
    "won't help anyway",
    "they don't care",
  ],
  [SDOHNeedType.EMPLOYMENT]: [
    "lost my job",
    "can't work",
    "unemployed",
    "need work",
    "job search",
    "can't find work",
    "laid off",
  ],
  [SDOHNeedType.UTILITIES]: [
    "power shut off",
    "no electricity",
    "water turned off",
    "can't pay utilities",
    "heating bill",
    "no heat",
  ],
  [SDOHNeedType.LEGAL_ASSISTANCE]: [
    "legal trouble",
    "court",
    "lawyer",
    "custody",
    "immigration",
    "legal help",
  ],
  [SDOHNeedType.SAFETY_CONCERNS]: [
    "not safe",
    "domestic violence",
    "abuse",
    "dangerous neighborhood",
    "afraid",
    "threatened",
  ],
  [SDOHNeedType.SOCIAL_ISOLATION]: [
    "no one to talk to",
    "completely alone",
    "no friends",
    "isolated",
    "lonely",
    "no support",
  ],
};

/**
 * Detect SDOH needs from text content
 */
export function detectSDOHNeeds(text: string): SDOHNeedType[] {
  const normalizedText = text.toLowerCase();
  const detectedNeeds: Set<SDOHNeedType> = new Set();

  for (const [needType, keywords] of Object.entries(SDOH_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        detectedNeeds.add(needType as SDOHNeedType);
        break; // One match per need type is enough
      }
    }
  }

  return Array.from(detectedNeeds);
}

/**
 * Analyze multiple sources for SDOH needs
 */
export async function analyzeUserSDOH(userId: string): Promise<{
  detectedNeeds: SDOHNeedType[];
  needCounts: Record<string, number>;
  riskLevel: number;
}> {
  // Fetch user data
  const [moments, goals, referralLoops, dailyActions] = await Promise.all([
    prisma.memoryMoment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.goal.findMany({
      where: { userId },
    }),
    prisma.referralLoop.findMany({
      where: { userId },
    }),
    prisma.dailyAction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const needCounts: Record<string, number> = {};
  const allNeeds: SDOHNeedType[] = [];

  // Analyze memory moments
  for (const moment of moments) {
    const needs = detectSDOHNeeds(moment.content);
    allNeeds.push(...needs);
  }

  // Analyze goal titles
  for (const goal of goals) {
    const needs = detectSDOHNeeds(goal.title);
    allNeeds.push(...needs);
  }

  // Analyze daily action content
  for (const action of dailyActions) {
    const needs = detectSDOHNeeds(action.content);
    allNeeds.push(...needs);
  }

  // Count occurrences
  for (const need of allNeeds) {
    needCounts[need] = (needCounts[need] || 0) + 1;
  }

  // Get unique needs
  const detectedNeeds = Array.from(new Set(allNeeds));

  // Calculate SDOH risk level (0-10)
  // More unique needs = higher risk
  // Frequent mentions = higher risk
  const uniqueNeedsScore = Math.min(detectedNeeds.length * 1.5, 7);
  const frequencyScore = Math.min(
    Object.values(needCounts).reduce((sum, count) => sum + count, 0) * 0.3,
    3
  );
  const riskLevel = Math.min(uniqueNeedsScore + frequencyScore, 10);

  return {
    detectedNeeds,
    needCounts,
    riskLevel,
  };
}

/**
 * Resource Engagement Status
 */
export enum ResourceStatus {
  OFFERED = "offered",
  ENGAGED = "engaged",
  COMPLETED = "completed",
  FAILED = "failed",
  DECLINED = "declined",
}

/**
 * Offer a resource to address an SDOH need
 */
export async function offerResource(params: {
  userId: string;
  resourceName: string;
  resourceType: string;
  needType: SDOHNeedType;
  offeredBy?: string;
}): Promise<any> {
  return prisma.resourceEngagement.create({
    data: {
      userId: params.userId,
      resourceName: params.resourceName,
      resourceType: params.resourceType,
      needType: params.needType,
      status: ResourceStatus.OFFERED,
      offeredBy: params.offeredBy || "system",
    },
  });
}

/**
 * User accepts a resource offer
 */
export async function acceptResource(engagementId: string): Promise<any> {
  return prisma.resourceEngagement.update({
    where: { id: engagementId },
    data: {
      status: ResourceStatus.ENGAGED,
      acceptedAt: new Date(),
    },
  });
}

/**
 * User declines a resource offer
 */
export async function declineResource(
  engagementId: string,
  reason?: string
): Promise<any> {
  return prisma.resourceEngagement.update({
    where: { id: engagementId },
    data: {
      status: ResourceStatus.DECLINED,
      declineReason: reason,
      closedAt: new Date(),
    },
  });
}

/**
 * Complete a resource engagement (successful outcome)
 */
export async function completeResource(params: {
  engagementId: string;
  successRating?: number;
  impactNotes?: string;
}): Promise<any> {
  const engagement = await prisma.resourceEngagement.update({
    where: { id: params.engagementId },
    data: {
      status: ResourceStatus.COMPLETED,
      successRating: params.successRating,
      impactNotes: params.impactNotes,
      closedAt: new Date(),
    },
  });

  // Trigger signal score update to reflect SDOH improvement
  const { triggerSignalUpdate } = await import("../jobs/queues/signalQueue");
  await triggerSignalUpdate(engagement.userId, "resource_completed");

  return engagement;
}

/**
 * Mark resource engagement as failed
 */
export async function failResource(
  engagementId: string,
  notes?: string
): Promise<any> {
  return prisma.resourceEngagement.update({
    where: { id: engagementId },
    data: {
      status: ResourceStatus.FAILED,
      impactNotes: notes,
      closedAt: new Date(),
    },
  });
}

/**
 * Follow up on a resource engagement
 */
export async function followUpResource(engagementId: string): Promise<any> {
  return prisma.resourceEngagement.update({
    where: { id: engagementId },
    data: {
      followedUpAt: new Date(),
    },
  });
}

/**
 * Get active resource engagements for a user
 */
export async function getActiveResourceEngagements(userId: string) {
  return prisma.resourceEngagement.findMany({
    where: {
      userId,
      status: {
        in: [ResourceStatus.OFFERED, ResourceStatus.ENGAGED],
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get completed resource engagements for a user
 */
export async function getCompletedResourceEngagements(userId: string) {
  return prisma.resourceEngagement.findMany({
    where: {
      userId,
      status: ResourceStatus.COMPLETED,
    },
    orderBy: { closedAt: "desc" },
  });
}

/**
 * Get resource engagement statistics
 */
export async function getResourceEngagementStats(userId: string) {
  const engagements = await prisma.resourceEngagement.findMany({
    where: { userId },
  });

  const stats = {
    total: engagements.length,
    offered: 0,
    engaged: 0,
    completed: 0,
    failed: 0,
    declined: 0,
    successRate: 0,
    avgSuccessRating: 0,
    needsAddressed: new Set<string>(),
  };

  let totalRating = 0;
  let ratingCount = 0;

  for (const engagement of engagements) {
    stats[engagement.status as keyof typeof stats]++;

    if (engagement.status === ResourceStatus.COMPLETED) {
      stats.needsAddressed.add(engagement.needType);
      if (engagement.successRating) {
        totalRating += engagement.successRating;
        ratingCount++;
      }
    }
  }

  if (stats.completed + stats.failed > 0) {
    stats.successRate = stats.completed / (stats.completed + stats.failed);
  }

  if (ratingCount > 0) {
    stats.avgSuccessRating = totalRating / ratingCount;
  }

  return {
    ...stats,
    needsAddressed: Array.from(stats.needsAddressed),
  };
}

/**
 * Calculate SDOH impact on signal scores
 * Returns a multiplier to reduce risk when needs are being addressed
 */
export function calculateSDOHImpact(
  detectedNeeds: SDOHNeedType[],
  engagementStats: any
): number {
  if (detectedNeeds.length === 0) return 0;

  const needsAddressed = new Set(engagementStats.needsAddressed);
  const addressedCount = detectedNeeds.filter((need) =>
    needsAddressed.has(need)
  ).length;

  // If we're addressing needs, reduce risk
  const addressedRatio = addressedCount / detectedNeeds.length;
  const impactMultiplier = addressedRatio * engagementStats.successRate;

  return impactMultiplier; // 0 to 1, higher = more positive impact
}
