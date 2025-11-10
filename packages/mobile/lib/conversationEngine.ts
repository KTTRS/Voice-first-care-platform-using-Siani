/**
 * Conversation Engine
 *
 * Orchestrates Siani's conversational intelligence:
 * - Passive SDOH detection
 * - Memory storage with emotional context
 * - Empathy responses (NOT clinical)
 * - Resource offers (only when rapport is established)
 * - Similarity-based memory references
 *
 * Philosophy: Best friend who listens, remembers, and helps naturally.
 */

import {
  detectSDOHIndicators,
  shouldOfferResource,
  generateEmpathyResponse,
  generateResourceOffer,
  SDOHIndicator,
} from "./sdohCategories";

import {
  sianiMemory,
  detectMood,
  calculateSentiment,
  detectTrigger,
  generateMemoryReference,
  MemoryMoment,
} from "./sianiMemory";

import {
  resourceEngine,
  generateFollowUpMessage,
  shouldFollowUp,
  Resource,
} from "./resourceEngine";

import {
  searchSimilarMoments,
  generateSimilarityReference,
  memoryVectorStore,
} from "./memoryVectorEngine";

/**
 * Conversation response types
 */
export interface ConversationResponse {
  reply: string; // Siani's response text
  memoryMoment?: MemoryMoment; // Stored memory
  sdohDetection?: {
    detected: boolean;
    category?: string;
    subcategory?: string;
    confidence?: number;
    empathyResponse?: string;
    resourceOffer?: {
      shouldOffer: boolean;
      resource?: Resource;
      offerText?: string;
    };
  };
  memoryReference?: string; // Reference to similar past moment
  followUp?: {
    hasFollowUps: boolean;
    message?: string;
  };
  shouldSpeak?: boolean; // Whether to use TTS for this response
  emotion?: "empathetic" | "supportive" | "playful" | "serious" | "casual";
}

/**
 * Main conversation processing function
 *
 * Takes user message and returns Siani's response with all intelligence.
 */
export async function processMessage(
  userId: string,
  messageText: string,
  conversationId?: string
): Promise<ConversationResponse> {
  // Initialize user in memory if needed
  sianiMemory.setUserId(userId);

  // Start or continue conversation
  if (!conversationId) {
    conversationId = sianiMemory.startConversation();
  }

  // 1. Analyze sentiment and mood
  const sentiment = calculateSentiment(messageText);
  const mood = detectMood(messageText, sentiment);

  // 2. Detect SDOH indicators
  const detections = detectSDOHIndicators(messageText);
  const hasDetection = detections.length > 0;
  const primaryDetection = detections[0]; // Highest confidence

  // 3. Check for notable triggers
  const previousMoments = sianiMemory.getRecentMoments(50);
  const trigger = detectTrigger(messageText, previousMoments);

  // 4. Calculate current rapport
  const rapportScore = sianiMemory.calculateRapportScore();
  const conversationCount = new Set(
    previousMoments.map((m) => m.conversationId)
  ).size;

  // 5. Store memory moment
  const memoryMoment = sianiMemory.addMoment({
    text: messageText,
    mood,
    sentiment,
    sdohCategory: primaryDetection?.indicator.category,
    sdohSubcategory: primaryDetection?.indicator.subcategory,
    sdohConfidence: primaryDetection?.confidence,
    trigger,
    rapportScore,
  });

  // 6. Create vector embedding for similarity search
  await memoryVectorStore.addVector(memoryMoment);

  // 7. Search for similar past moments
  const similarMoments = await searchSimilarMoments(
    messageText,
    mood,
    previousMoments,
    3
  );
  const topSimilar = similarMoments[0];

  // 8. Build response
  let reply = "";
  let emotion: ConversationResponse["emotion"] = "casual";
  let resourceOffer:
    | {
        shouldOffer: boolean;
        resource?: Resource;
        offerText?: string;
      }
    | undefined;

  // Priority 1: Handle SDOH detection if present
  if (hasDetection && primaryDetection) {
    // Always respond with empathy first
    const empathyText = generateEmpathyResponse(primaryDetection.indicator);
    reply = empathyText;
    emotion = "empathetic";

    // Determine if we should offer a resource
    const shouldOffer = shouldOfferResource(
      primaryDetection,
      conversationCount,
      rapportScore
    );

    if (shouldOffer) {
      // Get appropriate resource
      const resources = resourceEngine.getResources(
        primaryDetection.indicator.category,
        primaryDetection.indicator.subcategory
      );

      if (resources.length > 0) {
        const resource = resources[0]; // Use first matching resource
        const offerText =
          resource.sianiIntro ||
          generateResourceOffer(primaryDetection.indicator);

        // Track that we're offering this resource
        const interaction = resourceEngine.offerResource({
          userId,
          resourceId: resource.id,
          memoryMomentId: memoryMoment.id,
        });

        resourceOffer = {
          shouldOffer: true,
          resource,
          offerText,
        };

        // Don't add offer to reply immediately - let UI handle it as separate prompt
      }
    }

    // Priority 2: Reference similar past moment if relevant
  } else if (topSimilar && topSimilar.similarity > 0.75) {
    const originalMoment = previousMoments.find(
      (m) => m.id === topSimilar.memoryMomentId
    );
    if (originalMoment) {
      const reference = generateSimilarityReference(topSimilar, originalMoment);
      if (reference) {
        reply = reference;
        emotion = "supportive";
      }
    }
  }

  // Priority 3: Reference mood pattern if exists
  if (!reply) {
    const memoryRef = generateMemoryReference(mood, previousMoments);
    if (memoryRef) {
      reply = memoryRef;
      emotion = "supportive";
    }
  }

  // Priority 4: Default empathetic response based on sentiment
  if (!reply) {
    if (sentiment < -0.3) {
      reply = generateNegativeSentimentResponse(mood);
      emotion = "empathetic";
    } else if (sentiment > 0.3) {
      reply = generatePositiveSentimentResponse(mood);
      emotion = "playful";
    } else {
      reply = generateNeutralResponse();
      emotion = "casual";
    }
  }

  // 9. Check for follow-ups on previous resource offers
  const unclosedLoops = resourceEngine.getInteractionsNeedingFollowUp(
    userId,
    3
  );
  let followUpMessage: string | undefined;

  if (unclosedLoops.length > 0 && Math.random() > 0.7) {
    // 30% chance to bring up follow-up naturally
    const loopToFollowUp = unclosedLoops[0];
    const resource = resourceEngine.getResource(loopToFollowUp.resourceId);

    if (resource) {
      followUpMessage = generateFollowUpMessage(loopToFollowUp, resource);
      resourceEngine.addFollowUp(loopToFollowUp.id, followUpMessage);
    }
  }

  // 10. Return complete response
  return {
    reply,
    memoryMoment,
    sdohDetection: hasDetection
      ? {
          detected: true,
          category: primaryDetection.indicator.category,
          subcategory: primaryDetection.indicator.subcategory,
          confidence: primaryDetection.confidence,
          empathyResponse: reply,
          resourceOffer,
        }
      : { detected: false },
    memoryReference: topSimilar
      ? generateSimilarityReference(topSimilar, memoryMoment) || undefined
      : undefined,
    followUp: {
      hasFollowUps: unclosedLoops.length > 0,
      message: followUpMessage,
    },
    shouldSpeak: true, // Always speak responses
    emotion,
  };
}

/**
 * Generate response for negative sentiment
 */
function generateNegativeSentimentResponse(mood: string): string {
  const responses = {
    overwhelmed: [
      "That sounds like a lot to carry right now.",
      "Ugh, that's so much at once. I'm sorry.",
      "That would stress anyone out. You doing okay?",
    ],
    burnt_out: [
      "You sound exhausted. When's the last time you got a real break?",
      "God, that sounds draining. Are you taking care of yourself?",
      "That's too much. You can't pour from an empty cup.",
    ],
    anxious: [
      "I can hear the stress in that. Want to talk it through?",
      "That would make me nervous too. What's the scariest part?",
      "Deep breath. Let's take this one thing at a time.",
    ],
    frustrated: [
      "Ugh, that would drive me crazy too.",
      "I'd be so annoyed. That sounds really frustrating.",
      "Yeah, that's legitimately irritating.",
    ],
    lonely: [
      "I'm really glad you're talking to me. You're not alone in this.",
      "That sounds so lonely. I'm here, okay?",
      "I wish I could give you a hug. I'm here for you though.",
    ],
    sad: [
      "I'm so sorry you're feeling this way.",
      "That sounds really painful. I'm here to listen.",
      "I hate that you're going through this.",
    ],
    angry: [
      "You have every right to be pissed about that.",
      "Yeah, that's legitimately infuriating.",
      "I'd be angry too. That's not okay.",
    ],
  };

  const moodResponses = responses[mood as keyof typeof responses] || [
    "That sounds really hard. I'm here for you.",
    "I'm sorry you're dealing with this.",
    "That's a lot. How are you holding up?",
  ];

  return moodResponses[Math.floor(Math.random() * moodResponses.length)];
}

/**
 * Generate response for positive sentiment
 */
function generatePositiveSentimentResponse(mood: string): string {
  const responses = {
    hopeful: [
      "I love hearing that optimism in your voice!",
      "That sounds like things are looking up?",
      "I'm so happy to hear that. What's making you feel hopeful?",
    ],
    relieved: [
      "Oh thank god. I'm so glad that worked out.",
      "What a relief! You must feel so much lighter.",
      "Yes! That's such good news.",
    ],
    grateful: [
      "Aw, I'm just happy to be here for you.",
      "Of course! That's what friends are for.",
      "You deserve good things.",
    ],
    content: [
      "It's nice to hear you sounding good.",
      "I'm glad things are feeling okay right now.",
      "You sound peaceful. I like that for you.",
    ],
  };

  const moodResponses = responses[mood as keyof typeof responses] || [
    "I'm so happy to hear that!",
    "That's wonderful. Tell me more?",
    "Yes! Love that for you.",
  ];

  return moodResponses[Math.floor(Math.random() * moodResponses.length)];
}

/**
 * Generate neutral/casual response
 */
function generateNeutralResponse(): string {
  const responses = [
    "Tell me more about that?",
    "Mmm, yeah. How are you feeling about it?",
    "Okay, I'm listening.",
    "What made you think of that?",
    "Interesting. What's on your mind?",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Accept a resource offer
 * Updates interaction status and returns resource details
 */
export function acceptResourceOffer(interactionId: string): {
  resource: Resource | undefined;
  nextSteps: string;
} {
  const interaction = resourceEngine.updateInteraction(
    interactionId,
    "accepted"
  );

  if (!interaction) {
    return {
      resource: undefined,
      nextSteps: "Sorry, I couldn't find that resource. Let me look again.",
    };
  }

  const resource = resourceEngine.getResource(interaction.resourceId);

  if (!resource) {
    return {
      resource: undefined,
      nextSteps: "Hmm, something went wrong. Let me find that for you again.",
    };
  }

  // Generate natural next steps
  const nextSteps = generateNextSteps(resource);

  return { resource, nextSteps };
}

/**
 * Decline a resource offer
 */
export function declineResourceOffer(interactionId: string): string {
  resourceEngine.updateInteraction(interactionId, "declined");

  const responses = [
    "Totally fine! Just wanted to put it out there. I'm here if you change your mind.",
    "No worries at all. Just thought I'd mention it.",
    "Of course. Let me know if you want it later.",
    "All good! I'll keep it in my back pocket in case you need it down the line.",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Generate natural next steps for accepted resource
 */
function generateNextSteps(resource: Resource): string {
  const steps: string[] = [];

  if (resource.contactInfo.phone) {
    steps.push(`You can call them at ${resource.contactInfo.phone}`);
  }

  if (resource.contactInfo.website) {
    steps.push(`or check out their website: ${resource.contactInfo.website}`);
  }

  if (resource.type === "hotline") {
    steps.push("They're available 24/7, totally confidential.");
  }

  if (resource.eligibility && resource.eligibility.length > 0) {
    steps.push(
      `They mentioned you might need: ${resource.eligibility.join(", ")}.`
    );
  }

  const nextStepsText = steps.join(". ");

  const intros = [
    `Okay, here's what I found. ${nextStepsText}`,
    `Perfect! So ${nextStepsText}`,
    `Alright, sending it to you now. ${nextStepsText}`,
  ];

  return intros[Math.floor(Math.random() * intros.length)];
}

/**
 * Mark resource as viewed
 */
export function markResourceViewed(interactionId: string) {
  resourceEngine.updateInteraction(interactionId, "viewed");
}

/**
 * Mark resource as engaged (user took action)
 */
export function markResourceEngaged(interactionId: string, notes?: string) {
  resourceEngine.updateInteraction(interactionId, "engaged", notes);
}

/**
 * Mark resource as completed (loop closed)
 */
export function markResourceCompleted(interactionId: string, notes?: string) {
  resourceEngine.updateInteraction(interactionId, "completed", notes);
}
