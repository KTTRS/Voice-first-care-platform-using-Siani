import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEmotionStore } from "../store/emotionStore";

interface FeedItem {
  id: string;
  type: "memory" | "goal" | "milestone";
  content: string;
  emotion?: string;
  timestamp: string;
  keywords?: string[];
}

/**
 * FeedScreen - Memory Moments & Goal Events
 *
 * Design: Chronological feed with emotion states
 * Features: Pagination, pull-to-refresh, mood indicators
 */
export default function FeedScreen() {
  const { memoryMoments, currentEmotion } = useEmotionStore();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Initialize feed from store
  useEffect(() => {
    loadInitialFeed();
  }, [memoryMoments]);

  const loadInitialFeed = () => {
    // Convert memory moments to feed items
    const items: FeedItem[] = memoryMoments.map((moment, index) => ({
      id: `moment-${index}`,
      type: "memory",
      content: moment.content || moment.text, // Use content or fallback to text
      emotion: moment.emotion,
      timestamp: moment.timestamp,
      keywords: moment.keywords,
    }));
    setFeedItems(items);
  };

  const loadMoreItems = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // TODO: Replace with actual API call
    // const newItems = await api.getFeed(currentPage + 1, 20);

    setTimeout(() => {
      // Placeholder: No more items for now
      setHasMore(false);
      setIsLoading(false);
    }, 1000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);

    // TODO: Replace with actual API call
    // await api.getFeed(1, 20);

    setTimeout(() => {
      loadInitialFeed();
      setIsRefreshing(false);
    }, 1000);
  };

  const renderFeedItem = ({ item }: { item: FeedItem }) => (
    <TouchableOpacity style={styles.feedCard}>
      {/* Emotion Indicator */}
      {item.emotion && (
        <View style={styles.emotionBadge}>
          <View
            style={[
              styles.emotionDot,
              { backgroundColor: getEmotionColor(item.emotion) },
            ]}
          />
          <Text style={styles.emotionLabel}>{item.emotion}</Text>
        </View>
      )}

      {/* Content */}
      <Text style={styles.feedContent}>{item.content}</Text>

      {/* Keywords */}
      {item.keywords && item.keywords.length > 0 && (
        <View style={styles.keywordsContainer}>
          {item.keywords.slice(0, 3).map((keyword, index) => (
            <View key={index} style={styles.keywordPill}>
              <Text style={styles.keywordText}>{keyword}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Timestamp */}
      <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Memories Yet</Text>
      <Text style={styles.emptySubtext}>
        Start a conversation with Siani to create your first memory moment
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#B8860B" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Journey</Text>
        <Text style={styles.headerSubtext}>Memory moments and milestones</Text>
      </View>

      {/* Feed List */}
      <FlatList
        data={feedItems}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#B8860B"
          />
        }
        onEndReached={loadMoreItems}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
}

// Helper functions
function getEmotionColor(emotion: string): string {
  switch (emotion) {
    case "calm":
      return "rgba(255, 182, 193, 0.8)";
    case "anxious":
      return "rgba(255, 193, 7, 0.8)";
    case "motivated":
      return "rgba(218, 165, 32, 0.9)";
    default:
      return "rgba(200, 200, 200, 0.8)";
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F7F4",
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerText: {
    fontSize: 36,
    fontFamily: "System", // Will use Playfair Display
    fontWeight: "600",
    color: "#1F1F1F",
    marginBottom: 6,
  },
  headerSubtext: {
    fontSize: 15,
    color: "#8B8680",
  },
  feedList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  feedCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  emotionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  emotionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emotionLabel: {
    fontSize: 12,
    color: "#8B8680",
    textTransform: "capitalize",
    fontWeight: "500",
  },
  feedContent: {
    fontSize: 16,
    color: "#1F1F1F",
    lineHeight: 24,
    marginBottom: 12,
  },
  keywordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  keywordPill: {
    backgroundColor: "rgba(218, 165, 32, 0.15)",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  keywordText: {
    fontSize: 11,
    color: "#B8860B",
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 12,
    color: "#B0AAA5",
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F1F1F",
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#8B8680",
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
