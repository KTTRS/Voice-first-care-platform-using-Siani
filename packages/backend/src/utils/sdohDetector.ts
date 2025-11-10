/**
 * SDOH Detection Utility
 * Lightweight rule-based keyword detection
 * Future: Evolve to embedding similarity or fine-tuned LLM classification
 */

const sdohKeywords: Record<string, string[]> = {
  food_insecurity: [
    "food stamps",
    "hungry",
    "grocery",
    "meal",
    "snap",
    "can't afford food",
    "food bank",
    "skip meals",
    "not eating",
  ],
  housing_instability: [
    "homeless",
    "evicted",
    "rent",
    "shelter",
    "apartment",
    "no place to stay",
    "lost apartment",
    "couch surfing",
    "living in car",
  ],
  transportation: [
    "ride",
    "bus",
    "car",
    "transport",
    "uber",
    "missed appointment",
    "no ride",
    "can't get there",
    "no way to get",
  ],
  financial_hardship: [
    "broke",
    "money",
    "paycheck",
    "bills",
    "can't afford",
    "debt",
    "unemployed",
    "lost job",
    "no money",
  ],
  childcare: [
    "childcare",
    "daycare",
    "watch my kids",
    "no babysitter",
    "can't find childcare",
    "kids need care",
  ],
  health_literacy: [
    "confused by meds",
    "don't understand",
    "complicated",
    "instructions unclear",
    "can't read",
    "need explanation",
  ],
  trust_in_system: [
    "don't trust",
    "been let down",
    "they never help",
    "doctors don't listen",
    "won't help anyway",
    "they don't care",
    "given up",
  ],
  employment: [
    "lost my job",
    "can't work",
    "unemployed",
    "need work",
    "job search",
    "laid off",
  ],
  utilities: [
    "power shut off",
    "no electricity",
    "water turned off",
    "can't pay utilities",
    "no heat",
  ],
  legal_assistance: [
    "legal trouble",
    "court",
    "lawyer",
    "custody",
    "immigration",
  ],
  safety_concerns: [
    "not safe",
    "domestic violence",
    "abuse",
    "dangerous neighborhood",
    "afraid",
    "threatened",
  ],
  social_isolation: [
    "no one to talk to",
    "completely alone",
    "no friends",
    "isolated",
    "lonely",
    "no support",
  ],
};

/**
 * Detect SDOH categories from text
 * @param text - Text content to analyze
 * @returns Array of detected SDOH category names
 */
export function detectSDOH(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(sdohKeywords)
    .filter(([, keywords]) => keywords.some((k) => lower.includes(k)))
    .map(([category]) => category);
}

/**
 * Get all available SDOH categories
 */
export function getSDOHCategories(): string[] {
  return Object.keys(sdohKeywords);
}

/**
 * Check if text contains specific SDOH need
 */
export function hasSDOHNeed(text: string, needType: string): boolean {
  const lower = text.toLowerCase();
  const keywords = sdohKeywords[needType];
  if (!keywords) return false;
  return keywords.some((k) => lower.includes(k));
}
