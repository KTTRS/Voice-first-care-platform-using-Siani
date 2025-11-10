"use client";
import { useEffect, useState } from "react";

interface ResourceEngagement {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  needType: string;
  status: string;
  successRating?: number;
  timestamps: {
    offeredAt: string;
    acceptedAt?: string;
    followedUpAt?: string;
    closedAt?: string;
  };
  impactNotes?: string;
  declineReason?: string;
}

interface SDOHNeeds {
  userId: string;
  detectedNeeds: string[];
  needCounts: Record<string, number>;
  riskLevel: number;
  riskBadge: string;
}

export default function SDOHPanel({ params }: { params: { id: string } }) {
  const [resourceLoops, setResourceLoops] = useState<ResourceEngagement[]>([]);
  const [sdohNeeds, setSDOHNeeds] = useState<SDOHNeeds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch resource loops and SDOH needs in parallel
        const [loopsRes, needsRes] = await Promise.all([
          fetch(`/api/users/${params.id}/resource-loops`, {
            headers: { Authorization: "Bearer test-token" },
          }),
          fetch(`/api/users/${params.id}/sdoh-needs`, {
            headers: { Authorization: "Bearer test-token" },
          }),
        ]);

        if (!loopsRes.ok || !needsRes.ok) {
          throw new Error("Failed to fetch SDOH data");
        }

        const [loops, needs] = await Promise.all([
          loopsRes.json(),
          needsRes.json(),
        ]);

        setResourceLoops(loops);
        setSDOHNeeds(needs);
      } catch (err: any) {
        setError(err.message || "Failed to load SDOH data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "engaged":
        return "bg-blue-100 text-blue-800";
      case "offered":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "declined":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatNeedType = (need: string) => {
    return need
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          SDOH Needs & Resource Engagement
        </h2>
        <p className="text-gray-600">
          Social Determinants of Health monitoring and resource loop tracking
        </p>
      </div>

      {/* SDOH Risk Overview */}
      {sdohNeeds && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Risk Overview
            </h3>
            <span className="text-2xl">{sdohNeeds.riskBadge}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 rounded p-4">
              <div className="text-sm text-gray-600 mb-1">SDOH Risk Level</div>
              <div className="text-2xl font-bold text-gray-900">
                {sdohNeeds.riskLevel.toFixed(1)}/10
              </div>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <div className="text-sm text-gray-600 mb-1">Detected Needs</div>
              <div className="text-2xl font-bold text-gray-900">
                {sdohNeeds.detectedNeeds.length}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <div className="text-sm text-gray-600 mb-1">Active Resources</div>
              <div className="text-2xl font-bold text-gray-900">
                {
                  resourceLoops.filter(
                    (r) => r.status === "offered" || r.status === "engaged"
                  ).length
                }
              </div>
            </div>
          </div>

          {sdohNeeds.detectedNeeds.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Identified Needs:
              </div>
              <div className="flex flex-wrap gap-2">
                {sdohNeeds.detectedNeeds.map((need, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                  >
                    {formatNeedType(need)}
                    {sdohNeeds.needCounts[need] > 1 && (
                      <span className="ml-1 text-xs">
                        ×{sdohNeeds.needCounts[need]}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resource Loops */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resource Engagement History
        </h3>

        {resourceLoops.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-2">No resource engagements recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resourceLoops.map((engagement) => (
              <div
                key={engagement.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {engagement.resourceName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {engagement.resourceType}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      engagement.status
                    )}`}
                  >
                    {engagement.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Need Type:
                    </span>
                    <p className="text-sm text-gray-900">
                      {formatNeedType(engagement.needType)}
                    </p>
                  </div>
                  {engagement.successRating && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Success Rating:
                      </span>
                      <p className="text-sm text-gray-900">
                        {"⭐".repeat(engagement.successRating)} (
                        {engagement.successRating}/5)
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <div>
                    Offered:{" "}
                    {new Date(
                      engagement.timestamps.offeredAt
                    ).toLocaleDateString()}
                  </div>
                  {engagement.timestamps.acceptedAt && (
                    <div>
                      Accepted:{" "}
                      {new Date(
                        engagement.timestamps.acceptedAt
                      ).toLocaleDateString()}
                    </div>
                  )}
                  {engagement.timestamps.followedUpAt && (
                    <div>
                      Followed Up:{" "}
                      {new Date(
                        engagement.timestamps.followedUpAt
                      ).toLocaleDateString()}
                    </div>
                  )}
                  {engagement.timestamps.closedAt && (
                    <div>
                      Closed:{" "}
                      {new Date(
                        engagement.timestamps.closedAt
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {engagement.impactNotes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      Impact Notes:
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {engagement.impactNotes}
                    </p>
                  </div>
                )}

                {engagement.declineReason && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      Decline Reason:
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {engagement.declineReason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
