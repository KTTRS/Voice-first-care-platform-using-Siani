import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { getFeed } from "../lib/api";

interface FeedEvent {
  id: string;
  type: string;
  message: string;
  userId: string;
  goalId?: string;
  createdAt: string;
}

const getEventEmoji = (type: string): string => {
  const emojiMap: Record<string, string> = {
    GOAL_CREATED: "🎯",
    GOAL_COMPLETED: "🏆",
    DAILY_ACTION_COMPLETED: "✅",
    STREAK_MAINTAINED: "🔥",
    RESOURCE_USED: "🔗",
    MEMORY_MOMENT: "💭",
    MILESTONE: "🎉",
  };
  return emojiMap[type] || "📝";
};

const getEventColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    GOAL_CREATED: "#2196F3",
    GOAL_COMPLETED: "#4CAF50",
    DAILY_ACTION_COMPLETED: "#8BC34A",
    STREAK_MAINTAINED: "#FF5722",
    RESOURCE_USED: "#9C27B0",
    MEMORY_MOMENT: "#00BCD4",
    MILESTONE: "#FFC107",
  };
  return colorMap[type] || "#757575";
};

export default function FeedScreen() {
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = async () => {
    try {
      setError(null);
      const response = await getFeed(1, 20);
      setFeed(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed");
      console.error("Error loading feed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFeed}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community Feed</Text>
      <Text style={styles.subtitle}>
        {feed.length} recent {feed.length === 1 ? "activity" : "activities"}
      </Text>

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.feedCard}>
            <View style={styles.feedHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getEventColor(item.type) + "20" },
                ]}
              >
                <Text style={styles.iconEmoji}>{getEventEmoji(item.type)}</Text>
              </View>
              <View style={styles.feedContent}>
                <Text style={styles.feedMessage}>{item.message}</Text>
                <View style={styles.feedFooter}>
                  <Text
                    style={[
                      styles.feedType,
                      { color: getEventColor(item.type) },
                    ]}
                  >
                    {item.type.replace(/_/g, " ")}
                  </Text>
                  <Text style={styles.feedTime}>
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activities yet!</Text>
            <Text style={styles.emptySubtext}>
              Start completing goals to see your feed
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  feedCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 20,
  },
  feedContent: {
    flex: 1,
  },
  feedMessage: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    lineHeight: 22,
  },
  feedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedType: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  feedTime: {
    fontSize: 12,
    color: "#999",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
});
