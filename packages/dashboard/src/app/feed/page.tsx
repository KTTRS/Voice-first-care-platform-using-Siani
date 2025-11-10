"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface FeedItem {
  id: string;
  type:
    | "GOAL_CREATED"
    | "GOAL_COMPLETED"
    | "DAILY_ACTION_COMPLETED"
    | "MEMORY_MOMENT"
    | "MILESTONE";
  userId: string;
  content: string;
  metadata: any;
  createdAt: string;
}

interface Milestone {
  type: string;
  value: number;
  message: string;
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<"community" | "me">("community");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    loadFeed();
    loadMilestones();

    // Initialize WebSocket connection
    const apiUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

    socketRef.current = io(apiUrl, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("✅ WebSocket connected");
      // Join the community room (use hardcoded user for now)
      socketRef.current?.emit("join-feed", "user_test");
    });

    socketRef.current.on("feed:new-event", (data: FeedItem) => {
      console.log("📡 Received feed event:", data);
      // Prepend new event to feed
      setFeed((prevFeed) => [data, ...prevFeed]);
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ WebSocket disconnected");
    });

    // Auto-refresh every 30 seconds as fallback
    const interval = setInterval(() => {
      loadFeed();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [feedType]);

  async function loadFeed() {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
      const endpoint =
        feedType === "community" ? "/api/feed/community" : "/api/feed/me";

      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: {
          Authorization: "Bearer test-token",
        },
      });

      if (!response.ok) throw new Error("Failed to load feed");

      const data = await response.json();
      setFeed(data.feed || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }

  async function loadMilestones() {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/feed/milestones`, {
        headers: {
          Authorization: "Bearer test-token",
        },
      });

      if (!response.ok) throw new Error("Failed to load milestones");

      const data = await response.json();
      setMilestones(data.milestones || []);
    } catch (err) {
      console.error("Failed to load milestones:", err);
    }
  }

  function getEventIcon(type: string) {
    switch (type) {
      case "GOAL_CREATED":
        return "🎯";
      case "GOAL_COMPLETED":
        return "🏆";
      case "DAILY_ACTION_COMPLETED":
        return "✅";
      case "MEMORY_MOMENT":
        return "💭";
      case "MILESTONE":
        return "⭐";
      default:
        return "📌";
    }
  }

  function getEventColor(type: string) {
    switch (type) {
      case "GOAL_CREATED":
        return "bg-blue-50 border-blue-200";
      case "GOAL_COMPLETED":
        return "bg-green-50 border-green-200";
      case "DAILY_ACTION_COMPLETED":
        return "bg-purple-50 border-purple-200";
      case "MEMORY_MOMENT":
        return "bg-pink-50 border-pink-200";
      case "MILESTONE":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Community Feed
          </h1>
          <p className="text-gray-600">See what everyone is achieving</p>
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Milestones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200"
                >
                  <div className="text-3xl font-bold text-blue-600">
                    {milestone.value}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {milestone.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feed Type Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex">
            <button
              onClick={() => setFeedType("community")}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                feedType === "community"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } rounded-tl-lg`}
            >
              🌍 Community Feed
            </button>
            <button
              onClick={() => setFeedType("me")}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                feedType === "me"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } rounded-tr-lg`}
            >
              👤 My Feed
            </button>
          </div>
        </div>

        {/* Feed Items */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading feed...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg">No feed items yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Start creating goals to see them here!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feed.map((item) => (
              <div
                key={item.id}
                className={`bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${getEventColor(
                  item.type
                )}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getEventIcon(item.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-900 font-medium">
                          {item.content}
                        </p>
                        {item.metadata?.points && (
                          <p className="text-sm text-blue-600 mt-1">
                            +{item.metadata.points} points
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 flex gap-3">
                      <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        👍 Like
                      </button>
                      <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        💬 Comment
                      </button>
                      <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        🔗 Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
