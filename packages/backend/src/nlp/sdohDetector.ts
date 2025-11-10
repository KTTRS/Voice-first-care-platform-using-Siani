/**
 * SDOH (Social Determinants of Health) Signal Detection
 * Passively detects needs during natural conversation
 *
 * Uses pattern matching and keyword analysis to identify:
 * - Transportation needs
 * - Food insecurity
 * - Housing instability
 * - Financial hardship
 * - Healthcare access barriers
 * - Social isolation
 */

export type SDOHNeedType =
  | "TRANSPORTATION"
  | "FOOD_INSECURITY"
  | "HOUSING"
  | "FINANCIAL"
  | "HEALTHCARE_ACCESS"
  | "SOCIAL_ISOLATION"
  | "UTILITIES"
  | "EMPLOYMENT";

export interface DetectedNeed {
  type: SDOHNeedType;
  confidence: number; // 0-1
  triggers: string[]; // Which keywords/patterns matched
  context: string; // The relevant portion of the message
}

// Pattern definitions for each SDOH category
const SDOH_PATTERNS = {
  TRANSPORTATION: {
    keywords: [
      "ride",
      "bus",
      "car",
      "drive",
      "transport",
      "get there",
      "getting there",
      "no way to",
      "can't get to",
      "too far",
      "no car",
      "uber",
      "lyft",
      "appointment",
      "pickup",
      "drop off",
      "stranded",
      "stuck at home",
    ],
    phrases: [
      /can'?t (get|make it) to/i,
      /no (way|ride|car|transportation) to/i,
      /need a ride/i,
      /how (do i|can i) get to/i,
      /too far to walk/i,
      /don'?t have a car/i,
      /miss(ed)? (my )?appointment.*couldn'?t get/i,
    ],
    weight: 0.8,
  },

  FOOD_INSECURITY: {
    keywords: [
      "hungry",
      "food",
      "eat",
      "meal",
      "grocery",
      "groceries",
      "afford food",
      "can't afford",
      "food bank",
      "pantry",
      "breakfast",
      "lunch",
      "dinner",
      "skipped",
      "nothing to eat",
      "empty fridge",
      "ran out of food",
    ],
    phrases: [
      /can'?t afford (food|groceries|to eat)/i,
      /don'?t have (any |enough )?food/i,
      /skip(ped)? (breakfast|lunch|dinner|meals?)/i,
      /ran out of (food|groceries)/i,
      /need (a )?food/i,
      /haven'?t eaten/i,
      /too expensive to (eat|buy food)/i,
    ],
    weight: 0.9,
  },

  HOUSING: {
    keywords: [
      "homeless",
      "eviction",
      "evicted",
      "rent",
      "landlord",
      "lease",
      "shelter",
      "couch surfing",
      "living in car",
      "no place to",
      "behind on rent",
      "can't pay rent",
      "losing apartment",
      "losing house",
      "foreclosure",
    ],
    phrases: [
      /can'?t (pay|afford) (the )?rent/i,
      /behind on (the )?rent/i,
      /getting evicted/i,
      /need (a )?place to (stay|live)/i,
      /homeless/i,
      /living in (my )?car/i,
      /couch surfing/i,
      /lost (my )?(home|apartment|house)/i,
    ],
    weight: 1.0,
  },

  FINANCIAL: {
    keywords: [
      "money",
      "bills",
      "debt",
      "broke",
      "afford",
      "cost",
      "expensive",
      "pay",
      "financial",
      "budget",
      "insurance",
      "utility",
      "electricity",
      "gas bill",
      "water bill",
      "phone bill",
      "overdue",
      "collection",
      "bankrupt",
    ],
    phrases: [
      /can'?t (afford|pay (for)?)/i,
      /no money/i,
      /behind on (my )?bills/i,
      /too expensive/i,
      /struggling financially/i,
      /bills are overdue/i,
      /in debt/i,
      /need (financial )?help/i,
    ],
    weight: 0.7,
  },

  HEALTHCARE_ACCESS: {
    keywords: [
      "doctor",
      "clinic",
      "hospital",
      "insurance",
      "medication",
      "prescription",
      "can't afford",
      "no insurance",
      "appointment",
      "specialist",
      "dentist",
      "need to see",
      "medical",
      "health",
      "treatment",
      "therapy",
    ],
    phrases: [
      /need to see (a )?(doctor|dentist|specialist)/i,
      /can'?t afford (medication|prescriptions?|treatment)/i,
      /no (health )?insurance/i,
      /can'?t get (an )?appointment/i,
      /need (medical )?help/i,
      /haven'?t seen a doctor/i,
      /ran out of (medication|pills|prescriptions?)/i,
    ],
    weight: 0.85,
  },

  SOCIAL_ISOLATION: {
    keywords: [
      "alone",
      "lonely",
      "isolated",
      "no one",
      "nobody",
      "no friends",
      "no family",
      "by myself",
      "miss people",
      "wish i had",
      "talk to",
      "see anyone",
      "isolated",
      "stuck at home",
      "no one to talk to",
    ],
    phrases: [
      /feel(ing)? (so |really )?alone/i,
      /feel(ing)? (so |really )?lonely/i,
      /no one to talk to/i,
      /don'?t have (any )?(friends|family nearby)/i,
      /wish i had someone/i,
      /haven'?t (seen|talked to) anyone/i,
      /isolated/i,
      /miss (having )?people/i,
    ],
    weight: 0.75,
  },

  UTILITIES: {
    keywords: [
      "electricity",
      "gas",
      "water",
      "heat",
      "power",
      "turned off",
      "shut off",
      "utility",
      "electric bill",
      "gas bill",
      "water bill",
      "cold",
      "hot",
      "no heat",
      "no power",
      "no water",
      "disconnected",
    ],
    phrases: [
      /(electricity|power|gas|water|heat) (was )?(turned|shut) off/i,
      /no (electricity|power|gas|water|heat)/i,
      /can'?t pay (the )?(electric|gas|water|utility) bill/i,
      /behind on utilities/i,
      /freezing.*no heat/i,
      /(utility|utilities) disconnected/i,
    ],
    weight: 0.9,
  },

  EMPLOYMENT: {
    keywords: [
      "job",
      "work",
      "employment",
      "unemployed",
      "laid off",
      "fired",
      "quit",
      "looking for work",
      "need a job",
      "lost my job",
      "can't find work",
      "job search",
      "resume",
      "application",
      "interview",
    ],
    phrases: [
      /lost (my )?job/i,
      /(got )?(laid off|fired)/i,
      /can'?t find (a )?job/i,
      /need (a )?job/i,
      /looking for (work|employment|a job)/i,
      /unemployed/i,
      /out of work/i,
      /need (to find )?work/i,
    ],
    weight: 0.75,
  },
};

/**
 * Detect SDOH signals in a message
 * Returns array of detected needs with confidence scores
 */
export async function detectSDOHSignals(
  message: string
): Promise<DetectedNeed[]> {
  if (!message || message.trim().length === 0) {
    return [];
  }

  const detectedNeeds: DetectedNeed[] = [];
  const lowerMessage = message.toLowerCase();

  // Check each SDOH category
  for (const [needType, patterns] of Object.entries(SDOH_PATTERNS)) {
    const triggers: string[] = [];
    let matchCount = 0;

    // Check keywords
    for (const keyword of patterns.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        triggers.push(keyword);
        matchCount++;
      }
    }

    // Check phrase patterns (regex)
    for (const pattern of patterns.phrases) {
      if (pattern.test(message)) {
        const match = message.match(pattern);
        if (match) {
          triggers.push(match[0]);
          matchCount += 2; // Phrases count more than keywords
        }
      }
    }

    // If we have matches, calculate confidence
    if (matchCount > 0) {
      // Confidence based on: number of matches, pattern weight, and message length
      const baseConfidence = Math.min(matchCount * 0.15, 0.7);
      const weightedConfidence = baseConfidence * patterns.weight;
      const finalConfidence = Math.min(weightedConfidence, 1.0);

      // Only report if confidence is reasonable
      if (finalConfidence >= 0.3) {
        detectedNeeds.push({
          type: needType as SDOHNeedType,
          confidence: parseFloat(finalConfidence.toFixed(2)),
          triggers: triggers.slice(0, 3), // Limit to top 3 triggers
          context: extractContext(message, triggers[0]),
        });
      }
    }
  }

  // Sort by confidence (highest first)
  return detectedNeeds.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Extract relevant context around a trigger word
 */
function extractContext(
  message: string,
  trigger: string,
  windowSize = 50
): string {
  const index = message.toLowerCase().indexOf(trigger.toLowerCase());
  if (index === -1) return message.substring(0, 100);

  const start = Math.max(0, index - windowSize);
  const end = Math.min(message.length, index + trigger.length + windowSize);

  let context = message.substring(start, end);

  // Add ellipsis if truncated
  if (start > 0) context = "..." + context;
  if (end < message.length) context = context + "...";

  return context.trim();
}

/**
 * Check if a message likely indicates successful resource use
 */
export function detectResourceSuccess(message: string): boolean {
  const successPatterns = [
    /i (used|tried|went to|called|contacted) (it|that|them)/i,
    /(it|that|they) (worked|helped|was helpful)/i,
    /thank(s| you).*(for|help|resource)/i,
    /i got (the|help|assistance|support)/i,
    /(used|utilized) (the )?resource/i,
    /problem (is )?(solved|resolved|fixed)/i,
  ];

  return successPatterns.some((pattern) => pattern.test(message));
}

/**
 * Check if a message likely indicates resource failure
 */
export function detectResourceFailure(message: string): boolean {
  const failurePatterns = [
    /couldn'?t (get|reach|contact|find)/i,
    /(didn'?t|doesn'?t) (work|help)/i,
    /tried but/i,
    /still (have|need|struggling)/i,
    /(too far|too expensive|didn'?t qualify)/i,
    /they (said|told me|couldn'?t help)/i,
    /turned (me )?down/i,
    /not eligible/i,
  ];

  return failurePatterns.some((pattern) => pattern.test(message));
}

/**
 * Generate natural language offer for a detected need
 */
export function generateNaturalOffer(
  needType: SDOHNeedType,
  hasResource: boolean = true
): string {
  const offers: Record<SDOHNeedType, string[]> = {
    TRANSPORTATION: [
      "I noticed you mentioned getting around might be tough — do you want me to find some transportation options for you?",
      "Hey, sounds like you might need help getting places. Want me to look up some ride services?",
      "I can help you find transportation if you need it. Interested?",
    ],
    FOOD_INSECURITY: [
      "It sounds like food might be a concern — I can help you find local food banks or meal programs if you'd like?",
      "Want me to find some resources for food assistance nearby?",
      "I can look up food pantries and meal programs in your area if that would help?",
    ],
    HOUSING: [
      "It sounds like housing might be a challenge right now. I can help you find emergency housing resources or rental assistance — interested?",
      "I can help you find housing support services if you need them?",
      "Want me to look up some housing assistance programs that might help?",
    ],
    FINANCIAL: [
      "It sounds like finances might be tight. I can help you find financial assistance programs or resources — want me to look?",
      "I can search for financial support programs that might help your situation?",
      "Want me to find some resources for financial assistance or bill help?",
    ],
    HEALTHCARE_ACCESS: [
      "It sounds like accessing healthcare might be difficult. I can help you find clinics, affordable care options, or insurance help — interested?",
      "Want me to look up healthcare resources or free clinics nearby?",
      "I can help you find affordable healthcare options if you'd like?",
    ],
    SOCIAL_ISOLATION: [
      "It sounds like you might be feeling a bit isolated. I can help you find community groups or activities nearby — want me to look?",
      "Want me to find some local groups or activities where you could meet people?",
      "I can help you find social activities or support groups in your area if you're interested?",
    ],
    UTILITIES: [
      "It sounds like you might need help with utilities. I can find assistance programs for electricity, gas, or water bills — interested?",
      "Want me to look up utility assistance programs that could help?",
      "I can help you find resources for utility bill assistance if you need it?",
    ],
    EMPLOYMENT: [
      "It sounds like work might be a concern. I can help you find job resources, training programs, or employment services — want me to look?",
      "Want me to find some job search resources or employment assistance programs?",
      "I can help you find employment services and job training programs if you'd like?",
    ],
  };

  const optionsForType = offers[needType] || [
    "I might be able to help with that — interested?",
  ];
  return optionsForType[Math.floor(Math.random() * optionsForType.length)];
}

/**
 * Generate natural follow-up message for engagement status
 */
export function generateFollowUp(
  needType: SDOHNeedType,
  daysSinceOffered: number,
  wasAccepted: boolean
): string | null {
  if (!wasAccepted) {
    if (daysSinceOffered >= 7) {
      return "Hey, just checking in — are you still dealing with that situation we talked about? I'm here if you want help finding resources.";
    }
    return null; // Don't follow up too soon if declined
  }

  // Follow up on accepted offers
  if (daysSinceOffered >= 3 && daysSinceOffered < 7) {
    return "Hey, just wanted to check — were you able to use that resource I found for you?";
  } else if (daysSinceOffered >= 7) {
    return "I wanted to follow up on that resource I sent you — did it end up helping? Let me know if you need something different.";
  }

  return null;
}
