/**
 * SDOH Detection Conversation Hook
 * Passively detects SDOH needs during natural conversation
 * and creates engagement records for Siani to offer resources
 */

import {
  detectSDOHSignals,
  generateNaturalOffer,
  SDOHNeedType,
} from "../nlp/sdohDetector";
import {
  createResourceEngagement,
  checkOpenEngagement,
  findBestMatchResource,
} from "../services/resourceEngagement.service";

export interface SDOHDetectionResult {
  detectedNeeds: Array<{
    needType: SDOHNeedType;
    confidence: number;
    engagementId?: string;
    shouldOffer: boolean;
    offerMessage?: string;
  }>;
  newEngagements: any[];
}

/**
 * Main SDOH detection hook
 * Run this after each user message to detect needs and create engagements
 */
export async function runSDOHDetection(
  userId: string,
  message: string
): Promise<SDOHDetectionResult> {
  // Detect potential SDOH needs in the message
  const detectedNeeds = await detectSDOHSignals(message);

  const result: SDOHDetectionResult = {
    detectedNeeds: [],
    newEngagements: [],
  };

  // Process each detected need
  for (const detection of detectedNeeds) {
    const { type: needType, confidence, triggers, context } = detection;

    // Only process if confidence is reasonable (>= 0.4)
    if (confidence < 0.4) {
      continue;
    }

    // Check if we already have an open engagement for this need
    const existingEngagement = await checkOpenEngagement(userId, needType);

    if (existingEngagement) {
      // Already tracking this need, don't create duplicate
      result.detectedNeeds.push({
        needType,
        confidence,
        engagementId: existingEngagement.id,
        shouldOffer: false, // Already offered
      });
      continue;
    }

    // Find best matching resource
    const resourceId = await findBestMatchResource(needType);

    // Create new engagement in DETECTED status
    const engagement = await createResourceEngagement({
      userId,
      needType,
      status: "DETECTED",
      resourceId: resourceId || undefined,
      confidence,
      detectionContext: context,
      timestamps: {
        detectedAt: new Date().toISOString(),
      },
      metadata: {
        triggers,
      },
    });

    result.newEngagements.push(engagement);

    // Generate natural offer message
    const offerMessage = generateNaturalOffer(needType, Boolean(resourceId));

    result.detectedNeeds.push({
      needType,
      confidence,
      engagementId: engagement.id,
      shouldOffer: true,
      offerMessage,
    });
  }

  return result;
}

/**
 * Process user response to a resource offer
 * Updates engagement status based on acceptance/decline
 */
export async function processOfferResponse(
  engagementId: string,
  userResponse: string,
  accepted: boolean
) {
  const { updateEngagementStatus } = await import(
    "../services/resourceEngagement.service"
  );

  if (accepted) {
    // User accepted the offer
    await updateEngagementStatus(engagementId, "ACCEPTED", {
      userResponse,
      acceptedVia: "conversation",
    });

    return {
      status: "ACCEPTED",
      nextStep: "provide_resource_details",
    };
  } else {
    // User declined the offer
    await updateEngagementStatus(engagementId, "DECLINED", {
      userResponse,
      declinedVia: "conversation",
    });

    return {
      status: "DECLINED",
      nextStep: "acknowledge_and_continue",
    };
  }
}

/**
 * Process resource usage feedback
 * Updates engagement based on whether the resource helped
 */
export async function processResourceFeedback(
  engagementId: string,
  userMessage: string,
  wasSuccessful: boolean
) {
  const { updateEngagementStatus } = await import(
    "../services/resourceEngagement.service"
  );

  if (wasSuccessful) {
    await updateEngagementStatus(engagementId, "COMPLETED", {
      completionMessage: userMessage,
      completedVia: "conversation",
    });

    return {
      status: "COMPLETED",
      message: "That's great to hear! I'm glad it helped.",
    };
  } else {
    await updateEngagementStatus(engagementId, "FAILED", {
      failureMessage: userMessage,
      failureVia: "conversation",
    });

    return {
      status: "FAILED",
      message:
        "I'm sorry that didn't work out. Let me find you something else.",
      shouldEscalate: true,
    };
  }
}

/**
 * Get pending engagements that need follow-up in conversation
 */
export async function getPendingEngagementsForUser(userId: string) {
  const { getUserEngagementHistory } = await import(
    "../services/resourceEngagement.service"
  );

  const engagements = await getUserEngagementHistory(userId, 10);

  // Filter for engagements that might need follow-up
  const pending = engagements.filter((eng: any) => {
    return ["OFFERED", "ACCEPTED"].includes(eng.status);
  });

  return pending;
}

/**
 * Determine if Siani should proactively bring up an engagement
 * Based on time since last interaction and engagement status
 */
export function shouldMentionEngagement(engagement: any): boolean {
  const now = new Date();

  if (engagement.status === "OFFERED" && engagement.offeredAt) {
    const daysSinceOffer =
      (now.getTime() - engagement.offeredAt.getTime()) / (24 * 60 * 60 * 1000);
    // Mention again after 3 days if no response
    return daysSinceOffer >= 3;
  }

  if (engagement.status === "ACCEPTED" && engagement.acceptedAt) {
    const daysSinceAccept =
      (now.getTime() - engagement.acceptedAt.getTime()) / (24 * 60 * 60 * 1000);
    // Follow up after 2 days to check if they used it
    return daysSinceAccept >= 2;
  }

  return false;
}

/**
 * Generate follow-up message for a pending engagement
 */
export function generateFollowUpMessage(engagement: any): string {
  const needTypeLabels: Record<string, string> = {
    TRANSPORTATION: "transportation help",
    FOOD_INSECURITY: "food assistance",
    HOUSING: "housing support",
    FINANCIAL: "financial help",
    HEALTHCARE_ACCESS: "healthcare resources",
    SOCIAL_ISOLATION: "community activities",
    UTILITIES: "utility assistance",
    EMPLOYMENT: "job resources",
  };

  const needLabel = needTypeLabels[engagement.needType] || "that resource";

  if (engagement.status === "OFFERED") {
    return `Hey, just wanted to check back — are you still interested in ${needLabel}? I'm here if you want to talk about it.`;
  }

  if (engagement.status === "ACCEPTED") {
    return `How did it go with ${needLabel}? Were you able to use it?`;
  }

  return `Just checking in about ${needLabel} — let me know if you need anything!`;
}

/**
 * Batch process: Check for natural SDOH mentions in conversation context
 * This can be used to scan recent conversation history for missed needs
 */
export async function scanConversationHistory(
  userId: string,
  messages: Array<{ content: string; timestamp: Date }>
): Promise<SDOHDetectionResult> {
  const aggregatedResult: SDOHDetectionResult = {
    detectedNeeds: [],
    newEngagements: [],
  };

  // Combine recent messages into context
  const combinedText = messages.map((m) => m.content).join(" ... ");

  // Run detection on combined context
  const result = await runSDOHDetection(userId, combinedText);

  return result;
}
