/**
 * Resource Engine
 *
 * Manages resource discovery, tracking, and loop closure.
 * Tracks user interactions from offer → view → engage → complete.
 *
 * Philosophy: Resources are gifts from a friend, not assignments from a case manager.
 */

import { SDOHCategory } from "./sdohCategories";

export interface Resource {
  id: string;
  category: SDOHCategory;
  subcategory: string;
  title: string;
  description: string;
  provider: string;
  contactInfo: {
    phone?: string;
    website?: string;
    email?: string;
    address?: string;
  };
  eligibility?: string[];
  tags: string[];
  localityInfo?: {
    city?: string;
    state?: string;
    zipCodes?: string[];
    nationwide?: boolean;
  };
  type: "service" | "financial_aid" | "information" | "hotline" | "community";
  urgency: "immediate" | "moderate" | "ongoing";
  sianiIntro?: string; // How Siani introduces this resource naturally
}

export interface ResourceInteraction {
  id: string;
  userId: string;
  resourceId: string;
  memoryMomentId: string; // Links to the conversation where need was detected
  status:
    | "offered"
    | "accepted"
    | "viewed"
    | "engaged"
    | "completed"
    | "declined"
    | "abandoned";
  offeredAt: Date;
  acceptedAt?: Date;
  viewedAt?: Date;
  engagedAt?: Date;
  completedAt?: Date;
  declinedAt?: Date;
  abandonedAt?: Date;
  followUps: Array<{
    timestamp: Date;
    message: string;
    response?: string;
  }>;
  loopClosed: boolean;
  notes?: string;
}

/**
 * In-memory resource catalog
 * In production, this would come from backend API or CMS
 */
const RESOURCE_CATALOG: Resource[] = [
  // ========== FOOD RESOURCES ==========
  {
    id: "res_food_001",
    category: "BASIC_NEEDS",
    subcategory: "food_insecurity",
    title: "Local Food Pantry Network",
    description:
      "Free groceries, no questions asked. Open Monday, Wednesday, Friday 10am-2pm.",
    provider: "Community Food Share",
    contactInfo: {
      phone: "1-800-555-FOOD",
      website: "https://communityfoodshare.org",
      address: "Multiple locations",
    },
    tags: ["food", "groceries", "emergency", "no_income_verification"],
    localityInfo: {
      nationwide: false,
      city: "Local",
    },
    type: "service",
    urgency: "immediate",
    sianiIntro:
      "So there's this food pantry that's super low-key. No paperwork, no weird questions. Just show up and grab what you need. Want me to send you the address?",
  },
  {
    id: "res_food_002",
    category: "BASIC_NEEDS",
    subcategory: "food_insecurity",
    title: "SNAP Benefits (Food Stamps)",
    description:
      "Monthly food assistance. Apply online or by phone. Can qualify even if working.",
    provider: "State Benefits Office",
    contactInfo: {
      phone: "1-800-555-SNAP",
      website: "https://www.benefits.gov/benefit/361",
    },
    eligibility: [
      "Income under 200% of poverty line",
      "U.S. citizen or eligible immigrant",
    ],
    tags: ["food", "monthly_assistance", "government", "ongoing_support"],
    localityInfo: {
      nationwide: true,
    },
    type: "financial_aid",
    urgency: "moderate",
    sianiIntro:
      "Have you thought about applying for SNAP? I know the process can feel annoying, but it's actually not that bad. Want me to walk you through it?",
  },

  // ========== TRANSPORTATION ==========
  {
    id: "res_trans_001",
    category: "CARE_BARRIERS",
    subcategory: "transportation",
    title: "Free Ride to Medical Appointments",
    description:
      "Door-to-door rides for medical visits. Schedule 24 hours in advance.",
    provider: "Community Health Rides",
    contactInfo: {
      phone: "1-800-555-RIDE",
      website: "https://healthrides.org",
    },
    tags: ["transportation", "medical", "free", "scheduled"],
    type: "service",
    urgency: "immediate",
    sianiIntro:
      "You know what, there's this free ride service for medical stuff. You just call them a day ahead. Could that help with the bus situation?",
  },
  {
    id: "res_trans_002",
    category: "CARE_BARRIERS",
    subcategory: "transportation",
    title: "Reduced Bus Pass Program",
    description:
      "Half-price monthly bus pass if income-qualified. Can apply online.",
    provider: "Public Transit Authority",
    contactInfo: {
      website: "https://publictransit.org/reduced-fare",
    },
    tags: ["transportation", "public_transit", "monthly", "income_based"],
    type: "financial_aid",
    urgency: "moderate",
    sianiIntro:
      "I saw that you might qualify for a half-price bus pass. It's not much, but could help a little?",
  },

  // ========== HOUSING ==========
  {
    id: "res_housing_001",
    category: "BASIC_NEEDS",
    subcategory: "housing_instability",
    title: "Emergency Rental Assistance",
    description:
      "One-time payment to prevent eviction. Can cover up to 3 months rent.",
    provider: "Housing Stability Fund",
    contactInfo: {
      phone: "1-800-555-HOME",
      website: "https://housinghelp.gov",
    },
    eligibility: [
      "Eviction notice or late rent",
      "Income under 80% area median",
    ],
    tags: ["housing", "emergency", "rental_assistance", "eviction_prevention"],
    type: "financial_aid",
    urgency: "immediate",
    sianiIntro:
      "I don't want to overstep, but there's emergency rental help that could cover a few months. The application is actually pretty quick. Want to look at it together?",
  },

  // ========== UTILITIES ==========
  {
    id: "res_util_001",
    category: "BASIC_NEEDS",
    subcategory: "utilities",
    title: "Utility Bill Payment Assistance",
    description:
      "Help paying electric, gas, water bills. Can also prevent shutoffs.",
    provider: "Energy Assistance Program",
    contactInfo: {
      phone: "1-800-555-UTIL",
    },
    tags: ["utilities", "electricity", "water", "emergency", "ongoing"],
    type: "financial_aid",
    urgency: "immediate",
    sianiIntro:
      "There's this program that helps with utility bills. They can even call the company and prevent shutoffs. Want me to send you the number?",
  },

  // ========== CHILDCARE ==========
  {
    id: "res_child_001",
    category: "LIFE_CONSTRAINTS",
    subcategory: "childcare",
    title: "Childcare Subsidy Program",
    description:
      "Covers cost of daycare/after-school care if you're working or in school.",
    provider: "Department of Human Services",
    contactInfo: {
      website: "https://childcaresubsidy.gov",
      phone: "1-800-555-KIDS",
    },
    eligibility: [
      "Working or in job training",
      "Income under 200% poverty line",
    ],
    tags: ["childcare", "subsidy", "working_families", "ongoing"],
    type: "financial_aid",
    urgency: "moderate",
    sianiIntro:
      "I know finding childcare is impossible. There's a program that covers the cost if you're working. The waitlist can be long, but worth getting on it. Want the link?",
  },

  // ========== DOMESTIC VIOLENCE ==========
  {
    id: "res_dv_001",
    category: "RELATIONSHIP_RISK",
    subcategory: "domestic_violence",
    title: "National Domestic Violence Hotline",
    description:
      "24/7 confidential support, safety planning, and shelter referrals. Call or text.",
    provider: "National DV Hotline",
    contactInfo: {
      phone: "1-800-799-7233",
      website: "https://thehotline.org",
    },
    tags: ["safety", "domestic_violence", "24_7", "confidential", "shelter"],
    type: "hotline",
    urgency: "immediate",
    sianiIntro:
      "I'm really worried about you. There are people who can help you be safe, and they keep everything private. No pressure at all, but I want you to have the number just in case: 1-800-799-7233. You can call or text anytime.",
  },

  // ========== MENTAL HEALTH ==========
  {
    id: "res_mh_001",
    category: "MENTAL_HEALTH",
    subcategory: "overwhelm",
    title: "Crisis Text Line",
    description: "Text a trained counselor 24/7. Free and confidential.",
    provider: "Crisis Text Line",
    contactInfo: {
      phone: "Text HOME to 741741",
      website: "https://crisistextline.org",
    },
    tags: ["mental_health", "crisis", "24_7", "free", "text_based"],
    type: "hotline",
    urgency: "immediate",
    sianiIntro:
      "I want you to know there are people you can text anytime if things feel too heavy. It's free and totally private. Just text HOME to 741741. No pressure, just want you to have it.",
  },
];

/**
 * Resource Engine Class
 */
class ResourceEngineStore {
  private resources: Resource[] = RESOURCE_CATALOG;
  private interactions: ResourceInteraction[] = [];

  /**
   * Get resources by category and subcategory
   */
  getResources(category: SDOHCategory, subcategory?: string): Resource[] {
    return this.resources.filter(
      (r) =>
        r.category === category &&
        (!subcategory || r.subcategory === subcategory)
    );
  }

  /**
   * Get a single resource by ID
   */
  getResource(resourceId: string): Resource | undefined {
    return this.resources.find((r) => r.id === resourceId);
  }

  /**
   * Track that a resource was offered
   */
  offerResource(params: {
    userId: string;
    resourceId: string;
    memoryMomentId: string;
  }): ResourceInteraction {
    const interaction: ResourceInteraction = {
      id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: params.userId,
      resourceId: params.resourceId,
      memoryMomentId: params.memoryMomentId,
      status: "offered",
      offeredAt: new Date(),
      followUps: [],
      loopClosed: false,
    };

    this.interactions.push(interaction);
    return interaction;
  }

  /**
   * Update interaction status
   */
  updateInteraction(
    interactionId: string,
    status: ResourceInteraction["status"],
    notes?: string
  ): ResourceInteraction | undefined {
    const interaction = this.interactions.find((i) => i.id === interactionId);

    if (!interaction) return undefined;

    interaction.status = status;
    const now = new Date();

    switch (status) {
      case "accepted":
        interaction.acceptedAt = now;
        break;
      case "viewed":
        interaction.viewedAt = now;
        break;
      case "engaged":
        interaction.engagedAt = now;
        break;
      case "completed":
        interaction.completedAt = now;
        interaction.loopClosed = true;
        break;
      case "declined":
        interaction.declinedAt = now;
        interaction.loopClosed = true;
        break;
      case "abandoned":
        interaction.abandonedAt = now;
        interaction.loopClosed = true;
        break;
    }

    if (notes) {
      interaction.notes = notes;
    }

    return interaction;
  }

  /**
   * Add a follow-up to an interaction
   */
  addFollowUp(interactionId: string, message: string, response?: string) {
    const interaction = this.interactions.find((i) => i.id === interactionId);

    if (interaction) {
      interaction.followUps.push({
        timestamp: new Date(),
        message,
        response,
      });
    }
  }

  /**
   * Get all unclosed loops for a user
   */
  getUnclosedLoops(userId: string): ResourceInteraction[] {
    return this.interactions.filter(
      (i) => i.userId === userId && !i.loopClosed && i.status !== "declined"
    );
  }

  /**
   * Get interactions that need follow-up
   * (Offered or accepted but not engaged/completed, and last follow-up > X days ago)
   */
  getInteractionsNeedingFollowUp(
    userId: string,
    daysSinceLastFollowUp: number = 3
  ): ResourceInteraction[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastFollowUp);

    return this.interactions.filter((i) => {
      if (i.userId !== userId || i.loopClosed) return false;

      // Status is offered or accepted but not completed
      if (!["offered", "accepted", "viewed"].includes(i.status)) return false;

      // Check last follow-up time
      if (i.followUps.length === 0) {
        // No follow-ups yet, check when it was offered
        return i.offeredAt <= cutoffDate;
      } else {
        // Check last follow-up
        const lastFollowUp = i.followUps[i.followUps.length - 1];
        return lastFollowUp.timestamp <= cutoffDate;
      }
    });
  }

  /**
   * Get all interactions for syncing
   */
  getAllInteractions(): ResourceInteraction[] {
    return [...this.interactions];
  }

  /**
   * Clear synced interactions
   */
  clearSyncedInteractions(interactionIds: string[]) {
    this.interactions = this.interactions.filter(
      (i) => !interactionIds.includes(i.id)
    );
  }
}

// Singleton instance
export const resourceEngine = new ResourceEngineStore();

/**
 * Generate a natural follow-up message for unclosed loops
 */
export function generateFollowUpMessage(
  interaction: ResourceInteraction,
  resource: Resource
): string {
  const daysSinceOffer = Math.floor(
    (Date.now() - interaction.offeredAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const followUpCount = interaction.followUps.length;

  // First follow-up (3-5 days after offer)
  if (followUpCount === 0) {
    return "Hey, did you ever end up checking out that thing we talked about? No pressure at all, just thinking of you.";
  }

  // Second follow-up (7-10 days after offer)
  if (followUpCount === 1) {
    return "No rush on this, but I wanted to make sure you still had the info I sent. Let me know if you want me to explain anything about it.";
  }

  // Third follow-up (14+ days after offer)
  if (followUpCount === 2) {
    return "I know life gets crazy. Just wanted to check in — is that resource still something you might use, or should I let it go?";
  }

  // After 3 follow-ups, mark as abandoned
  return "";
}

/**
 * Determine if follow-up should be sent
 */
export function shouldFollowUp(interaction: ResourceInteraction): boolean {
  const daysSinceOffer = Math.floor(
    (Date.now() - interaction.offeredAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Don't follow up if already completed or declined
  if (interaction.loopClosed) return false;

  // Don't follow up more than 3 times
  if (interaction.followUps.length >= 3) return false;

  // Follow-up schedule: Day 3, Day 7, Day 14
  const followUpDays = [3, 7, 14];
  const targetDay = followUpDays[interaction.followUps.length];

  return daysSinceOffer >= targetDay;
}
