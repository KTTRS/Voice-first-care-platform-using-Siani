import prisma from "../utils/db";
import { SDOHNeedType } from "../nlp/sdohDetector";

export type EngagementStatus =
  | "DETECTED" // Need detected, not yet offered
  | "OFFERED" // Resource offered to user
  | "ACCEPTED" // User accepted the offer
  | "DECLINED" // User declined the offer
  | "COMPLETED" // User successfully used the resource
  | "FAILED" // User tried but couldn't use the resource
  | "ABANDONED" // User didn't respond/follow through
  | "ESCALATED"; // Sent to care team for manual intervention

export interface ResourceEngagementData {
  userId: string;
  needType: SDOHNeedType;
  status: EngagementStatus;
  resourceId?: string;
  confidence?: number;
  detectionContext?: string;
  timestamps: {
    detectedAt?: string;
    offeredAt?: string;
    acceptedAt?: string;
    declinedAt?: string;
    completedAt?: string;
    failedAt?: string;
    lastFollowUpAt?: string;
  };
  metadata?: {
    triggers?: string[];
    userResponse?: string;
    failureReason?: string;
    escalationReason?: string;
    followUpCount?: number;
  };
}

/**
 * Create a new resource engagement
 */
export async function createResourceEngagement(data: ResourceEngagementData) {
  return await prisma.resourceEngagement.create({
    data: {
      userId: data.userId,
      needType: data.needType,
      status: data.status,
      resourceId: data.resourceId,
      resourceName: data.resourceId ? `Resource ${data.resourceId}` : "",
      resourceType: data.needType.toLowerCase(),
      confidence: data.confidence,
      detectionContext: data.detectionContext,
      detectedAt: data.timestamps.detectedAt
        ? new Date(data.timestamps.detectedAt)
        : new Date(),
      offeredAt: data.timestamps.offeredAt
        ? new Date(data.timestamps.offeredAt)
        : undefined,
      acceptedAt: data.timestamps.acceptedAt
        ? new Date(data.timestamps.acceptedAt)
        : undefined,
      declinedAt: data.timestamps.declinedAt
        ? new Date(data.timestamps.declinedAt)
        : undefined,
      completedAt: data.timestamps.completedAt
        ? new Date(data.timestamps.completedAt)
        : undefined,
      failedAt: data.timestamps.failedAt
        ? new Date(data.timestamps.failedAt)
        : undefined,
      lastFollowUpAt: data.timestamps.lastFollowUpAt
        ? new Date(data.timestamps.lastFollowUpAt)
        : undefined,
      metadata: data.metadata || {},
    },
  });
}

/**
 * Get a resource engagement by ID
 */
export async function getEngagementById(engagementId: string) {
  return await prisma.resourceEngagement.findUnique({
    where: {
      id: engagementId,
    },
  });
}

/**
 * Check if user has an open engagement for a specific need type
 */
export async function checkOpenEngagement(
  userId: string,
  needType: SDOHNeedType
): Promise<any | null> {
  const openStatuses: EngagementStatus[] = ["DETECTED", "OFFERED", "ACCEPTED"];

  return await prisma.resourceEngagement.findFirst({
    where: {
      userId,
      needType,
      status: {
        in: openStatuses,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Update engagement status
 */
export async function updateEngagementStatus(
  engagementId: string,
  status: EngagementStatus,
  metadata?: any
) {
  const updates: any = {
    status,
  };

  // Set timestamp based on status
  const now = new Date();
  switch (status) {
    case "OFFERED":
      updates.offeredAt = now;
      break;
    case "ACCEPTED":
      updates.acceptedAt = now;
      break;
    case "DECLINED":
      updates.declinedAt = now;
      break;
    case "COMPLETED":
      updates.completedAt = now;
      break;
    case "FAILED":
      updates.failedAt = now;
      break;
  }

  // Merge metadata
  if (metadata) {
    const existing = await prisma.resourceEngagement.findUnique({
      where: { id: engagementId },
      select: { metadata: true },
    });

    const existingMeta = (existing?.metadata as any) || {};
    updates.metadata = {
      ...existingMeta,
      ...metadata,
    };
  }

  return await prisma.resourceEngagement.update({
    where: { id: engagementId },
    data: updates,
  });
}

/**
 * Mark engagement as requiring follow-up
 */
export async function recordFollowUp(engagementId: string) {
  const engagement = await prisma.resourceEngagement.findUnique({
    where: { id: engagementId },
    select: { metadata: true },
  });

  const currentCount = (engagement?.metadata as any)?.followUpCount || 0;

  const existingMeta = (engagement?.metadata as any) || {};

  return await prisma.resourceEngagement.update({
    where: { id: engagementId },
    data: {
      lastFollowUpAt: new Date(),
      metadata: {
        ...existingMeta,
        followUpCount: currentCount + 1,
      },
    },
  });
}

/**
 * Get engagements needing follow-up
 * - Accepted but no completion after 3+ days
 * - Offered but no acceptance after 7+ days
 */
export async function getEngagementsNeedingFollowUp(
  maxDaysOffered: number = 7,
  maxDaysAccepted: number = 3
) {
  const now = new Date();
  const offeredCutoff = new Date(
    now.getTime() - maxDaysOffered * 24 * 60 * 60 * 1000
  );
  const acceptedCutoff = new Date(
    now.getTime() - maxDaysAccepted * 24 * 60 * 60 * 1000
  );

  const offered = await prisma.resourceEngagement.findMany({
    where: {
      status: "OFFERED",
      offeredAt: {
        lte: offeredCutoff,
      },
      OR: [
        { lastFollowUpAt: null },
        {
          lastFollowUpAt: {
            lte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Haven't followed up in 2 days
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      // resource: true, // TODO: Add when Resource model is implemented
    },
  });

  const accepted = await prisma.resourceEngagement.findMany({
    where: {
      status: "ACCEPTED",
      acceptedAt: {
        lte: acceptedCutoff,
      },
      OR: [
        { lastFollowUpAt: null },
        {
          lastFollowUpAt: {
            lte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      // resource: true, // TODO: Add when Resource model is implemented
    },
  });

  return [...offered, ...accepted];
}

/**
 * Get user's engagement history
 */
export async function getUserEngagementHistory(
  userId: string,
  limit: number = 20
) {
  return await prisma.resourceEngagement.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    // include: { resource: true }, // TODO: Add when Resource model is implemented
  });
}

/**
 * Get engagement statistics for a user
 */
export async function getUserEngagementStats(userId: string) {
  const engagements = await prisma.resourceEngagement.findMany({
    where: { userId },
  });

  const stats = {
    total: engagements.length,
    byStatus: {
      detected: 0,
      offered: 0,
      accepted: 0,
      declined: 0,
      completed: 0,
      failed: 0,
      abandoned: 0,
      escalated: 0,
    },
    byNeedType: {} as Record<string, number>,
    successRate: 0,
    averageTimeToCompletion: 0,
  };

  let totalCompletionTime = 0;
  let completionCount = 0;

  engagements.forEach((eng) => {
    // Count by status
    const statusKey = eng.status.toLowerCase() as keyof typeof stats.byStatus;
    if (statusKey in stats.byStatus) {
      stats.byStatus[statusKey]++;
    }

    // Count by need type
    stats.byNeedType[eng.needType] = (stats.byNeedType[eng.needType] || 0) + 1;

    // Calculate completion time
    if (eng.status === "COMPLETED" && eng.detectedAt && eng.completedAt) {
      const timeToCompletion =
        eng.completedAt.getTime() - eng.detectedAt.getTime();
      totalCompletionTime += timeToCompletion;
      completionCount++;
    }
  });

  // Calculate success rate (completed / (completed + failed))
  const outcomes = stats.byStatus.completed + stats.byStatus.failed;
  if (outcomes > 0) {
    stats.successRate = parseFloat(
      ((stats.byStatus.completed / outcomes) * 100).toFixed(1)
    );
  }

  // Average time to completion (in days)
  if (completionCount > 0) {
    const avgMs = totalCompletionTime / completionCount;
    stats.averageTimeToCompletion = parseFloat(
      (avgMs / (24 * 60 * 60 * 1000)).toFixed(1)
    );
  }

  return stats;
}

/**
 * Find best matching resource for a need type
 * For now, returns a placeholder ID until Resource catalog is built
 */
export async function findBestMatchResource(
  needType: SDOHNeedType,
  userZip?: string
): Promise<string | null> {
  // TODO: Once Resource model is created, implement actual matching
  // For now, return a placeholder based on need type
  const placeholderIds: Record<SDOHNeedType, string> = {
    TRANSPORTATION: "transport-001",
    FOOD_INSECURITY: "food-001",
    HOUSING: "housing-001",
    FINANCIAL: "financial-001",
    HEALTHCARE_ACCESS: "healthcare-001",
    SOCIAL_ISOLATION: "social-001",
    UTILITIES: "utilities-001",
    EMPLOYMENT: "employment-001",
  };

  return placeholderIds[needType] || null;
}

/**
 * Escalate engagement to care team
 */
export async function escalateEngagement(
  engagementId: string,
  reason: string,
  assignToUserId?: string
) {
  return await prisma.resourceEngagement.update({
    where: { id: engagementId },
    data: {
      status: "ESCALATED",
      metadata: {
        escalationReason: reason,
        escalatedAt: new Date().toISOString(),
        assignedTo: assignToUserId,
      },
    },
  });
}

/**
 * Get high-priority engagements for care team review
 */
export async function getHighPriorityEngagements() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  return await prisma.resourceEngagement.findMany({
    where: {
      OR: [
        // Failed attempts
        { status: "FAILED" },
        // Escalated cases
        { status: "ESCALATED" },
        // High-confidence detections not yet offered
        {
          status: "DETECTED",
          confidence: { gte: 0.8 },
          createdAt: { lte: threeDaysAgo },
        },
        // Accepted but not completed after long time
        {
          status: "ACCEPTED",
          acceptedAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      // resource: true, // TODO: Add when Resource model is implemented
    },
    orderBy: [{ confidence: "desc" }, { createdAt: "asc" }],
  });
}

/**
 * Auto-abandon stale engagements
 * - Offered but not accepted after 14 days
 * - Accepted but no follow-up after 14 days
 */
export async function autoAbandonStaleEngagements() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const staleOffered = await prisma.resourceEngagement.updateMany({
    where: {
      status: "OFFERED",
      offeredAt: { lte: fourteenDaysAgo },
    },
    data: {
      status: "ABANDONED",
      metadata: {
        abandonReason: "No response after 14 days",
        abandonedAt: new Date().toISOString(),
      },
    },
  });

  const staleAccepted = await prisma.resourceEngagement.updateMany({
    where: {
      status: "ACCEPTED",
      acceptedAt: { lte: fourteenDaysAgo },
      lastFollowUpAt: { lte: fourteenDaysAgo },
    },
    data: {
      status: "ABANDONED",
      metadata: {
        abandonReason: "No completion or follow-up after 14 days",
        abandonedAt: new Date().toISOString(),
      },
    },
  });

  return {
    abandonedOffered: staleOffered.count,
    abandonedAccepted: staleAccepted.count,
    total: staleOffered.count + staleAccepted.count,
  };
}
