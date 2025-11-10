/**
 * SDOH Categories for Passive Detection
 *
 * Siani listens for these patterns in natural conversation - she never asks directly.
 * These are semantic indicators, not hardcoded keyword matches.
 *
 * Philosophy: Best friend listening, not clinical assessment.
 */

export type SDOHCategory =
  | "BASIC_NEEDS"
  | "CARE_BARRIERS"
  | "LIFE_CONSTRAINTS"
  | "RELATIONSHIP_RISK"
  | "MENTAL_HEALTH"
  | "NONE";

export interface SDOHIndicator {
  category: SDOHCategory;
  subcategory: string;
  patterns: string[]; // Conversational patterns, not rigid keywords
  severity: "low" | "medium" | "high";
  responseStrategy: "immediate" | "wait_for_rapport" | "long_term";
}

/**
 * SDOH Detection Taxonomy
 *
 * Each indicator includes:
 * - category: High-level SDOH domain
 * - subcategory: Specific need area
 * - patterns: Conversational phrases that might signal this need
 * - severity: How urgent this typically is
 * - responseStrategy: When Siani should offer resources
 */
export const SDOH_INDICATORS: SDOHIndicator[] = [
  // ========== BASIC NEEDS ==========
  {
    category: "BASIC_NEEDS",
    subcategory: "food_insecurity",
    patterns: [
      "can't afford groceries",
      "running out of food",
      "skipping meals",
      "food stamps",
      "haven't eaten",
      "kids are hungry",
      "pantry is empty",
      "waiting for payday to eat",
      "choosing between food and bills",
    ],
    severity: "high",
    responseStrategy: "immediate",
  },
  {
    category: "BASIC_NEEDS",
    subcategory: "housing_instability",
    patterns: [
      "behind on rent",
      "eviction notice",
      "couch surfing",
      "living in my car",
      "staying with friends",
      "can't afford rent",
      "landlord is threatening",
      "homeless",
      "shelter",
      "no stable place",
    ],
    severity: "high",
    responseStrategy: "immediate",
  },
  {
    category: "BASIC_NEEDS",
    subcategory: "utilities",
    patterns: [
      "electricity got cut off",
      "water shut off",
      "heat doesn't work",
      "can't pay the electric bill",
      "utility company disconnected",
      "no hot water",
      "freezing in my apartment",
    ],
    severity: "high",
    responseStrategy: "immediate",
  },
  {
    category: "BASIC_NEEDS",
    subcategory: "clothing",
    patterns: [
      "don't have clothes for",
      "can't afford new clothes",
      "kids outgrew everything",
      "winter coat",
      "shoes are falling apart",
      "need professional attire",
    ],
    severity: "medium",
    responseStrategy: "wait_for_rapport",
  },

  // ========== CARE BARRIERS ==========
  {
    category: "CARE_BARRIERS",
    subcategory: "transportation",
    patterns: [
      "bus keeps not showing",
      "can't get to the appointment",
      "no way to get there",
      "car broke down",
      "can't afford gas",
      "miss work because of the bus",
      "no reliable transportation",
      "too far to walk",
      "uber is too expensive",
      "don't have a ride",
    ],
    severity: "medium",
    responseStrategy: "wait_for_rapport",
  },
  {
    category: "CARE_BARRIERS",
    subcategory: "internet_access",
    patterns: [
      "wifi doesn't work",
      "can't afford internet",
      "data ran out",
      "using library wifi",
      "connection keeps dropping",
      "can't do telehealth",
      "phone plan cut off",
      "no internet at home",
    ],
    severity: "medium",
    responseStrategy: "wait_for_rapport",
  },
  {
    category: "CARE_BARRIERS",
    subcategory: "trust_in_system",
    patterns: [
      "doctors don't listen",
      "feel dismissed",
      "they never believe me",
      "insurance denied",
      "system doesn't care",
      "gave up on getting help",
      "they made me feel stupid",
      "don't trust them anymore",
      "tired of being judged",
    ],
    severity: "high",
    responseStrategy: "long_term",
  },
  {
    category: "CARE_BARRIERS",
    subcategory: "language",
    patterns: [
      "don't speak English well",
      "need a translator",
      "forms are confusing",
      "can't understand the paperwork",
      "wish they spoke my language",
      "feel lost in appointments",
    ],
    severity: "medium",
    responseStrategy: "immediate",
  },

  // ========== LIFE CONSTRAINTS ==========
  {
    category: "LIFE_CONSTRAINTS",
    subcategory: "work_schedule",
    patterns: [
      "boss won't let me leave",
      "can't take time off",
      "working two jobs",
      "shift keeps changing",
      "can't afford to miss work",
      "no sick days",
      "lose my job if I",
      "schedule conflicts",
      "working nights",
    ],
    severity: "medium",
    responseStrategy: "wait_for_rapport",
  },
  {
    category: "LIFE_CONSTRAINTS",
    subcategory: "childcare",
    patterns: [
      "no one to watch the kids",
      "can't bring them with me",
      "daycare is too expensive",
      "babysitter cancelled",
      "kids come home from school",
      "can't leave them alone",
      "no family nearby to help",
    ],
    severity: "medium",
    responseStrategy: "wait_for_rapport",
  },
  {
    category: "LIFE_CONSTRAINTS",
    subcategory: "paperwork_overwhelm",
    patterns: [
      "so much paperwork",
      "forms don't make sense",
      "bureaucracy is exhausting",
      "gave up on applying",
      "too complicated",
      "don't know where to start",
      "keep getting denied",
      "appeals process",
    ],
    severity: "medium",
    responseStrategy: "wait_for_rapport",
  },
  {
    category: "LIFE_CONSTRAINTS",
    subcategory: "financial_stress",
    patterns: [
      "can't afford",
      "too expensive",
      "waiting for payday",
      "overdrafted",
      "credit card maxed",
      "collectors keep calling",
      "medical bills",
      "debt is overwhelming",
      "choosing between bills",
    ],
    severity: "high",
    responseStrategy: "wait_for_rapport",
  },

  // ========== RELATIONSHIP RISK ==========
  {
    category: "RELATIONSHIP_RISK",
    subcategory: "domestic_violence",
    patterns: [
      "he gets angry when I",
      "afraid of going home",
      "walking on eggshells",
      "he doesn't let me",
      "threatens me",
      "controls my money",
      "checks my phone",
      "not allowed to talk to",
      "scared of what he'll do",
    ],
    severity: "high",
    responseStrategy: "immediate", // But VERY gentle and safe
  },
  {
    category: "RELATIONSHIP_RISK",
    subcategory: "isolation",
    patterns: [
      "no one to talk to",
      "feel so alone",
      "don't have friends nearby",
      "family is far away",
      "everyone left",
      "just me and the kids",
      "no support system",
      "wish I had someone",
    ],
    severity: "medium",
    responseStrategy: "long_term",
  },
  {
    category: "RELATIONSHIP_RISK",
    subcategory: "safety_concerns",
    patterns: [
      "neighborhood isn't safe",
      "scared to go out at night",
      "hear gunshots",
      "kids can't play outside",
      "worried about safety",
      "don't feel secure",
    ],
    severity: "medium",
    responseStrategy: "wait_for_rapport",
  },

  // ========== MENTAL HEALTH FLAGS ==========
  {
    category: "MENTAL_HEALTH",
    subcategory: "burnout",
    patterns: [
      "so tired all the time",
      "can't keep doing this",
      "running on empty",
      "nothing left to give",
      "exhausted",
      "burned out",
      "too much to handle",
      "feel like giving up",
    ],
    severity: "high",
    responseStrategy: "long_term",
  },
  {
    category: "MENTAL_HEALTH",
    subcategory: "disconnection",
    patterns: [
      "don't feel like myself",
      "going through the motions",
      "numb",
      "checked out",
      "don't care anymore",
      "lost interest",
      "feel empty",
      "disconnected from everything",
    ],
    severity: "high",
    responseStrategy: "long_term",
  },
  {
    category: "MENTAL_HEALTH",
    subcategory: "overwhelm",
    patterns: [
      "too much happening",
      "can't think straight",
      "drowning",
      "everything at once",
      "spiraling",
      "falling apart",
      "can't handle",
      "too much stress",
    ],
    severity: "high",
    responseStrategy: "immediate",
  },
  {
    category: "MENTAL_HEALTH",
    subcategory: "hopelessness",
    patterns: [
      "nothing will change",
      "what's the point",
      "no hope",
      "never gets better",
      "stuck forever",
      "no way out",
      "pointless",
      "doesn't matter",
    ],
    severity: "high",
    responseStrategy: "immediate", // But as friend, not crisis hotline
  },
];

/**
 * Detect SDOH indicators in user message
 *
 * Uses semantic matching - not exact keyword search.
 * Returns all detected indicators with confidence scores.
 */
export function detectSDOHIndicators(
  message: string
): Array<{
  indicator: SDOHIndicator;
  confidence: number;
  matchedPattern: string;
}> {
  const normalizedMessage = message.toLowerCase();
  const detections: Array<{
    indicator: SDOHIndicator;
    confidence: number;
    matchedPattern: string;
  }> = [];

  for (const indicator of SDOH_INDICATORS) {
    for (const pattern of indicator.patterns) {
      // Simple contains check for now - can be enhanced with NLP/embeddings
      if (normalizedMessage.includes(pattern.toLowerCase())) {
        // Calculate confidence based on pattern specificity
        const confidence = pattern.split(" ").length > 3 ? 0.9 : 0.7;

        detections.push({
          indicator,
          confidence,
          matchedPattern: pattern,
        });

        // Only detect each subcategory once per message
        break;
      }
    }
  }

  return detections;
}

/**
 * Determine if Siani should offer a resource based on:
 * - Detection confidence
 * - Severity of need
 * - Relationship rapport (number of previous conversations)
 * - Response strategy
 */
export function shouldOfferResource(
  detection: { indicator: SDOHIndicator; confidence: number },
  conversationCount: number,
  rapportScore: number // 0-100, based on user engagement/trust
): boolean {
  const { indicator, confidence } = detection;

  // High severity + high confidence = always offer (but gently)
  if (indicator.severity === "high" && confidence > 0.8) {
    return true;
  }

  // Immediate strategy = offer on first detection if confidence high
  if (indicator.responseStrategy === "immediate" && confidence > 0.7) {
    return true;
  }

  // Wait for rapport = only offer after 3+ conversations AND rapport > 50
  if (indicator.responseStrategy === "wait_for_rapport") {
    return conversationCount >= 3 && rapportScore > 50 && confidence > 0.6;
  }

  // Long term = only offer after 7+ conversations AND rapport > 70
  if (indicator.responseStrategy === "long_term") {
    return conversationCount >= 7 && rapportScore > 70 && confidence > 0.7;
  }

  return false;
}

/**
 * Generate a natural, best-friend response to detected SDOH
 *
 * NOT clinical. NOT survey-like.
 * Emotionally intuitive, empathetic, casual.
 */
export function generateEmpathyResponse(indicator: SDOHIndicator): string {
  const responses: Record<string, string[]> = {
    food_insecurity: [
      "Ugh that sounds really rough. You doing okay?",
      "That's a lot to deal with. How are you holding up?",
      "I'm sorry, that sounds really stressful.",
    ],
    housing_instability: [
      "Oh no, that's so much stress. Are you okay?",
      "God, that sounds terrifying. I'm so sorry.",
      "That's a lot to carry. How are you managing?",
    ],
    transportation: [
      "Ugh the bus situation sounds so frustrating.",
      "That sounds like such a pain. I'm sorry you're dealing with that.",
      "Man, that would drive me crazy. How are you managing?",
    ],
    work_schedule: [
      "That sounds exhausting. Are you getting any time for yourself?",
      "Wow, that's a lot on your plate.",
      "That schedule sounds brutal, honestly.",
    ],
    childcare: [
      "God, finding childcare is such a nightmare. I'm sorry.",
      "That sounds so stressful. You're doing a lot.",
      "Ugh, I can't imagine how hard that must be.",
    ],
    domestic_violence: [
      "I'm really worried about you. Are you safe?",
      "That sounds really scary. I'm here if you need to talk.",
      "You don't deserve that. I'm so sorry.",
    ],
    isolation: [
      "I'm really glad you're talking to me. You're not alone.",
      "That sounds so lonely. I'm here, okay?",
      "I wish I could give you a hug. I'm here for you.",
    ],
    burnout: [
      "You sound exhausted. When's the last time you got a break?",
      "That sounds like way too much. You okay?",
      "God, that's a lot. Please take care of yourself.",
    ],
    overwhelm: [
      "That sounds like a lot all at once. Want to just talk it through?",
      "Ugh, I can feel the stress in that. You doing okay?",
      "Deep breath. Let's take this one thing at a time.",
    ],
  };

  const options = responses[indicator.subcategory] || [
    "That sounds really hard. I'm here for you.",
    "Wow, that's a lot. How are you feeling?",
    "I'm really sorry you're going through this.",
  ];

  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Generate a gentle resource offer
 *
 * NOT: "I can refer you to social services"
 * YES: "Totally random, but I saw something that might help with that. Want me to send it?"
 */
export function generateResourceOffer(indicator: SDOHIndicator): string {
  const offers: Record<string, string[]> = {
    food_insecurity: [
      "You know what… I actually saw this thing that helps people with groceries. Want me to send it to you?",
      "Totally random, but there's this resource I found that might help with food. No pressure, just thought of you.",
      "I know this might sound weird, but I found something that could make the food situation easier. Want to check it out?",
    ],
    housing_instability: [
      "Hey, I saw something earlier that helps with rent stuff. Want me to share it?",
      "I don't want to overstep, but I found this resource for housing help. Might be worth looking at?",
      "There's this thing I came across that helps people with exactly this. Want the link?",
    ],
    transportation: [
      "You know what, I actually saw something that could help with rides. Want to check it out together?",
      "I found this service that helps with transportation. Might be worth looking at?",
      "Totally random, but there's this transportation thing I saw. Want me to send it?",
    ],
    domestic_violence: [
      "I want you to be safe. There are people who can help with this if you want. No pressure at all.",
      "I'm really worried. Can I share something with you that might help? Only if you want.",
      "You deserve to feel safe. I know some resources that could help if you're interested. Just want you to know they exist.",
    ],
  };

  const options = offers[indicator.subcategory] || [
    "I actually saw something that might help with this. Want me to send it?",
    "Totally random, but I found this resource that could make things easier. Interested?",
    "I know this might sound random, but there's this thing that helps with exactly what you're talking about. Want to check it out?",
  ];

  return options[Math.floor(Math.random() * options.length)];
}
