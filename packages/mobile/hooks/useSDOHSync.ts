import { useState, useEffect, useCallback } from "react";
import { getResourceEngagements, getUser } from "../lib/api";

export interface ResourceEngagement {
  id: string;
  userId: string;
  needType: string;
  status:
    | "DETECTED"
    | "OFFERED"
    | "ACCEPTED"
    | "DECLINED"
    | "COMPLETED"
    | "FAILED"
    | "ABANDONED";
  resourceId?: string;
  resourceName?: string;
  confidence?: number;
  detectionContext?: string;
  detectedAt: string;
  offeredAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  completedAt?: string;
  failedAt?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface UseSDOHSyncResult {
  engagements: ResourceEngagement[];
  activeEngagements: ResourceEngagement[];
  pendingOffers: ResourceEngagement[];
  completedEngagements: ResourceEngagement[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasNewOffers: boolean;
}

/**
 * Hook to sync and manage SDOH resource engagements
 * Automatically fetches engagements for the current user
 * Provides filtered views and real-time updates
 */
export function useSDOHSync(
  autoRefreshInterval?: number // ms, e.g., 30000 for 30 seconds
): UseSDOHSyncResult {
  const [engagements, setEngagements] = useState<ResourceEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSeenOfferId, setLastSeenOfferId] = useState<string | null>(null);

  const fetchEngagements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await getUser();
      if (!user) {
        setEngagements([]);
        return;
      }

      const data = await getResourceEngagements(user.id);
      setEngagements(data.engagements || data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load engagements"
      );
      console.error("Error fetching resource engagements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEngagements();
  }, [fetchEngagements]);

  // Auto-refresh if interval is provided
  useEffect(() => {
    if (!autoRefreshInterval) return;

    const intervalId = setInterval(() => {
      fetchEngagements();
    }, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, fetchEngagements]);

  // Calculate filtered views
  const activeEngagements = engagements.filter((e) =>
    ["DETECTED", "OFFERED", "ACCEPTED"].includes(e.status)
  );

  const pendingOffers = engagements.filter((e) => e.status === "OFFERED");

  const completedEngagements = engagements.filter((e) =>
    ["COMPLETED", "FAILED", "DECLINED", "ABANDONED"].includes(e.status)
  );

  // Check for new offers
  const hasNewOffers =
    pendingOffers.length > 0 &&
    (lastSeenOfferId === null ||
      pendingOffers.some((offer) => offer.id !== lastSeenOfferId));

  // Mark offers as seen
  useEffect(() => {
    if (pendingOffers.length > 0) {
      const latestOfferId = pendingOffers[0].id;
      if (latestOfferId !== lastSeenOfferId) {
        setLastSeenOfferId(latestOfferId);
      }
    }
  }, [pendingOffers, lastSeenOfferId]);

  return {
    engagements,
    activeEngagements,
    pendingOffers,
    completedEngagements,
    loading,
    error,
    refresh: fetchEngagements,
    hasNewOffers,
  };
}

/**
 * Get human-readable label for need type
 */
export function getNeedTypeLabel(needType: string): string {
  const labels: Record<string, string> = {
    TRANSPORTATION: "Transportation",
    FOOD_INSECURITY: "Food Assistance",
    HOUSING: "Housing Support",
    FINANCIAL: "Financial Help",
    HEALTHCARE_ACCESS: "Healthcare Access",
    SOCIAL_ISOLATION: "Community Connection",
    UTILITIES: "Utility Assistance",
    EMPLOYMENT: "Job Resources",
  };

  return labels[needType] || needType;
}

/**
 * Get icon/emoji for need type
 */
export function getNeedTypeIcon(needType: string): string {
  const icons: Record<string, string> = {
    TRANSPORTATION: "🚗",
    FOOD_INSECURITY: "🍎",
    HOUSING: "🏠",
    FINANCIAL: "💰",
    HEALTHCARE_ACCESS: "🏥",
    SOCIAL_ISOLATION: "👥",
    UTILITIES: "💡",
    EMPLOYMENT: "💼",
  };

  return icons[needType] || "📋";
}

/**
 * Get color for need type
 */
export function getNeedTypeColor(needType: string): string {
  const colors: Record<string, string> = {
    TRANSPORTATION: "#3B82F6", // blue
    FOOD_INSECURITY: "#10B981", // green
    HOUSING: "#8B5CF6", // purple
    FINANCIAL: "#F59E0B", // amber
    HEALTHCARE_ACCESS: "#EF4444", // red
    SOCIAL_ISOLATION: "#EC4899", // pink
    UTILITIES: "#06B6D4", // cyan
    EMPLOYMENT: "#6366F1", // indigo
  };

  return colors[needType] || "#6B7280";
}

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DETECTED: "Detected",
    OFFERED: "Offered",
    ACCEPTED: "In Progress",
    DECLINED: "Declined",
    COMPLETED: "Completed",
    FAILED: "Needs Help",
    ABANDONED: "Expired",
  };

  return labels[status] || status;
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DETECTED: "#6B7280", // gray
    OFFERED: "#3B82F6", // blue
    ACCEPTED: "#8B5CF6", // purple
    DECLINED: "#9CA3AF", // light gray
    COMPLETED: "#10B981", // green
    FAILED: "#EF4444", // red
    ABANDONED: "#6B7280", // gray
  };

  return colors[status] || "#6B7280";
}
