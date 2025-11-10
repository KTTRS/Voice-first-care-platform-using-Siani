/**
 * Follow-Up Engine
 *
 * Manages natural, non-pushy follow-ups on resource offers.
 * Siani checks in like a best friend, not a case manager.
 *
 * Philosophy: "Hey, did you ever end up checking out that thing? No pressure."
 */

import {
  resourceEngine,
  ResourceInteraction,
  Resource,
  generateFollowUpMessage as generateResourceFollowUpMessage,
} from "./resourceEngine";

import { sianiMemory, MemoryMoment } from "./sianiMemory";

/**
 * Follow-up schedule configuration
 */
export const FOLLOW_UP_CONFIG = {
  // Days to wait before each follow-up
  firstFollowUp: 3, // After 3 days
  secondFollowUp: 7, // After 7 days
  thirdFollowUp: 14, // After 14 days

  // Maximum number of follow-ups before abandoning
  maxFollowUps: 3,

  // Days after which to auto-abandon unclosed loop
  autoAbandonAfter: 21,

  // Probability of mentioning follow-up in conversation (0-1)
  followUpMentionProbability: 0.3, // 30% chance
};

export interface FollowUpOpportunity {
  interaction: ResourceInteraction;
  resource: Resource;
  daysSinceOffer: number;
  daysSinceLastFollowUp: number;
  shouldFollowUp: boolean;
  followUpMessage: string;
  urgency: "low" | "medium" | "high";
}

/**
 * Check all unclosed loops and determine follow-up opportunities
 */
export function checkFollowUpOpportunities(
  userId: string
): FollowUpOpportunity[] {
  const unclosedLoops = resourceEngine.getUnclosedLoops(userId);
  const opportunities: FollowUpOpportunity[] = [];

  for (const interaction of unclosedLoops) {
    const resource = resourceEngine.getResource(interaction.resourceId);
    if (!resource) continue;

    const daysSinceOffer = Math.floor(
      (Date.now() - interaction.offeredAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const lastFollowUpTime =
      interaction.followUps.length > 0
        ? interaction.followUps[interaction.followUps.length - 1].timestamp
        : interaction.offeredAt;

    const daysSinceLastFollowUp = Math.floor(
      (Date.now() - lastFollowUpTime.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine if we should follow up
    const shouldFollowUp = determineShouldFollowUp(
      daysSinceLastFollowUp,
      interaction.followUps.length
    );

    // Auto-abandon if too old
    if (daysSinceOffer >= FOLLOW_UP_CONFIG.autoAbandonAfter) {
      resourceEngine.updateInteraction(
        interaction.id,
        "abandoned",
        "Auto-abandoned after 21 days"
      );
      continue;
    }

    // Determine urgency
    let urgency: FollowUpOpportunity["urgency"] = "low";
    if (resource.urgency === "immediate") urgency = "high";
    else if (resource.urgency === "moderate") urgency = "medium";

    // Generate follow-up message
    const followUpMessage = generateFollowUpMessage(
      interaction,
      resource,
      daysSinceOffer,
      interaction.followUps.length
    );

    opportunities.push({
      interaction,
      resource,
      daysSinceOffer,
      daysSinceLastFollowUp,
      shouldFollowUp,
      followUpMessage,
      urgency,
    });
  }

  // Sort by urgency and days since offer
  return opportunities.sort((a, b) => {
    if (a.urgency !== b.urgency) {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return b.daysSinceOffer - a.daysSinceOffer;
  });
}

/**
 * Determine if should follow up based on time and previous follow-up count
 */
function determineShouldFollowUp(
  daysSinceLastFollowUp: number,
  followUpCount: number
): boolean {
  // Don't follow up if already at max
  if (followUpCount >= FOLLOW_UP_CONFIG.maxFollowUps) return false;

  // Check against schedule
  if (followUpCount === 0) {
    return daysSinceLastFollowUp >= FOLLOW_UP_CONFIG.firstFollowUp;
  } else if (followUpCount === 1) {
    return (
      daysSinceLastFollowUp >=
      FOLLOW_UP_CONFIG.secondFollowUp - FOLLOW_UP_CONFIG.firstFollowUp
    );
  } else if (followUpCount === 2) {
    return (
      daysSinceLastFollowUp >=
      FOLLOW_UP_CONFIG.thirdFollowUp - FOLLOW_UP_CONFIG.secondFollowUp
    );
  }

  return false;
}

/**
 * Generate natural follow-up message
 */
function generateFollowUpMessage(
  interaction: ResourceInteraction,
  resource: Resource,
  daysSinceOffer: number,
  followUpCount: number
): string {
  const resourceTitle = resource.title;

  // First follow-up (casual check-in)
  if (followUpCount === 0) {
    const firstFollowUps = [
      `Hey, did you ever end up checking out that ${resource.subcategory} thing I sent? No pressure, just thinking of you.`,
      `Quick question — did you get a chance to look at that ${resourceTitle}? Totally fine either way.`,
      `I know life gets crazy, but did that resource I mentioned help at all?`,
      `Just wanted to check in — were you able to use that ${resource.subcategory} resource, or should I find something else?`,
    ];
    return firstFollowUps[Math.floor(Math.random() * firstFollowUps.length)];
  }

  // Second follow-up (gentle reminder)
  if (followUpCount === 1) {
    const secondFollowUps = [
      `No rush on this, but I wanted to make sure you still had the info for ${resourceTitle}. Let me know if you want me to resend it.`,
      `I don't want to be annoying, but just checking — is that ${resource.subcategory} thing still relevant, or has the situation changed?`,
      `Totally understand if you haven't gotten to it, but did you need any help with ${resourceTitle}? I can walk you through it if that's easier.`,
    ];
    return secondFollowUps[Math.floor(Math.random() * secondFollowUps.length)];
  }

  // Third follow-up (final check, give them an out)
  if (followUpCount === 2) {
    const thirdFollowUps = [
      `I know I've mentioned this before, but I want to make sure — is ${resourceTitle} still something you might use, or should I let it go?`,
      `Last time I'll bring this up, I promise. Did that ${resource.subcategory} resource end up being helpful, or did you find another way?`,
      `No pressure at all, but I'm going to stop bugging you about ${resourceTitle} unless you want to talk about it. Sound good?`,
    ];
    return thirdFollowUps[Math.floor(Math.random() * thirdFollowUps.length)];
  }

  return generateResourceFollowUpMessage(interaction, resource);
}

/**
 * Get the best follow-up to mention in current conversation
 * Returns null if no good opportunity
 */
export function getFollowUpForConversation(
  userId: string,
  currentSentiment: number,
  currentMood: string
): FollowUpOpportunity | null {
  const opportunities = checkFollowUpOpportunities(userId);

  // Don't bring up follow-ups if user is in negative emotional state
  if (currentSentiment < -0.5) return null;

  // Don't bring up if user seems overwhelmed
  if (["overwhelmed", "burnt_out", "stressed"].includes(currentMood))
    return null;

  // Filter to only opportunities that should follow up
  const readyOpportunities = opportunities.filter((o) => o.shouldFollowUp);

  if (readyOpportunities.length === 0) return null;

  // Random chance to mention
  if (Math.random() > FOLLOW_UP_CONFIG.followUpMentionProbability) return null;

  // Return highest priority opportunity
  return readyOpportunities[0];
}

/**
 * Record follow-up response from user
 */
export function recordFollowUpResponse(
  interactionId: string,
  userResponse: string
): "engaged" | "declined" | "later" {
  const lower = userResponse.toLowerCase();

  // Check for engagement signals
  if (
    lower.includes("yes") ||
    lower.includes("yeah") ||
    lower.includes("used it") ||
    lower.includes("called them") ||
    lower.includes("helped") ||
    lower.includes("working on it")
  ) {
    resourceEngine.updateInteraction(
      interactionId,
      "engaged",
      `User response: ${userResponse}`
    );
    return "engaged";
  }

  // Check for decline signals
  if (
    lower.includes("no") ||
    lower.includes("not interested") ||
    lower.includes("don't need") ||
    lower.includes("found something else") ||
    lower.includes("let it go")
  ) {
    resourceEngine.updateInteraction(
      interactionId,
      "declined",
      `User response: ${userResponse}`
    );
    return "declined";
  }

  // Default: they'll get to it later
  resourceEngine.addFollowUp(
    interactionId,
    "User said they'll check later",
    userResponse
  );
  return "later";
}

/**
 * Generate response to follow-up answer
 */
export function generateFollowUpResponse(
  result: "engaged" | "declined" | "later",
  resource: Resource
): string {
  if (result === "engaged") {
    const engagedResponses = [
      "Oh good! I'm so glad that helped. Let me know if you need anything else with it.",
      "That's awesome! I was hoping that would work out for you.",
      "Yes! Love that. You're taking care of business.",
      "I'm really happy to hear that. You've got this.",
    ];
    return engagedResponses[
      Math.floor(Math.random() * engagedResponses.length)
    ];
  }

  if (result === "declined") {
    const declinedResponses = [
      "Totally fine! I'm glad I could offer. Let me know if anything changes.",
      "No worries at all. I just wanted to put it out there.",
      "Of course. I'm here if you need anything else.",
      "All good! I'll keep an eye out for other things that might help.",
    ];
    return declinedResponses[
      Math.floor(Math.random() * declinedResponses.length)
    ];
  }

  // result === "later"
  const laterResponses = [
    "No rush! It'll be there when you're ready.",
    "Totally understand. Life is busy. It's there whenever you need it.",
    "Of course! Take your time. I'm not going anywhere.",
    "For sure. Let me know if you want me to send it again later.",
  ];
  return laterResponses[Math.floor(Math.random() * laterResponses.length)];
}

/**
 * Generate proactive follow-up message for push notification
 * (More appropriate for push than mid-conversation)
 */
export function generatePushFollowUp(opportunity: FollowUpOpportunity): {
  title: string;
  body: string;
} {
  const { resource, interaction } = opportunity;
  const followUpCount = interaction.followUps.length;

  if (followUpCount === 0) {
    return {
      title: "Hey, just checking in",
      body: `Did you get a chance to check out that ${resource.subcategory} resource? No pressure! 💙`,
    };
  }

  if (followUpCount === 1) {
    return {
      title: "Thinking of you",
      body: `Let me know if you need help with ${resource.title}. I'm here if you need me.`,
    };
  }

  return {
    title: "Last check-in on this",
    body: `Is ${resource.title} still useful, or should I let it go? All good either way.`,
  };
}

/**
 * Clean up abandoned loops
 * Run this periodically (e.g., daily)
 */
export function cleanUpAbandonedLoops(userId: string): number {
  const opportunities = checkFollowUpOpportunities(userId);
  let abandonedCount = 0;

  for (const opportunity of opportunities) {
    if (opportunity.daysSinceOffer >= FOLLOW_UP_CONFIG.autoAbandonAfter) {
      resourceEngine.updateInteraction(
        opportunity.interaction.id,
        "abandoned",
        `Auto-abandoned after ${FOLLOW_UP_CONFIG.autoAbandonAfter} days`
      );
      abandonedCount++;
    }
  }

  return abandonedCount;
}

/**
 * Get statistics on follow-up performance
 */
export function getFollowUpStats(userId: string): {
  totalOffered: number;
  accepted: number;
  engaged: number;
  completed: number;
  declined: number;
  abandoned: number;
  pending: number;
  averageTimeToEngagement: number; // in days
} {
  const allInteractions = resourceEngine
    .getAllInteractions()
    .filter((i) => i.userId === userId);

  const stats = {
    totalOffered: allInteractions.length,
    accepted: allInteractions.filter((i) => i.acceptedAt).length,
    engaged: allInteractions.filter((i) => i.status === "engaged").length,
    completed: allInteractions.filter((i) => i.status === "completed").length,
    declined: allInteractions.filter((i) => i.status === "declined").length,
    abandoned: allInteractions.filter((i) => i.status === "abandoned").length,
    pending: allInteractions.filter((i) => !i.loopClosed).length,
    averageTimeToEngagement: 0,
  };

  // Calculate average time to engagement
  const engagedInteractions = allInteractions.filter((i) => i.engagedAt);
  if (engagedInteractions.length > 0) {
    const totalDays = engagedInteractions.reduce((sum, i) => {
      const days = Math.floor(
        (i.engagedAt!.getTime() - i.offeredAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    stats.averageTimeToEngagement = totalDays / engagedInteractions.length;
  }

  return stats;
}
