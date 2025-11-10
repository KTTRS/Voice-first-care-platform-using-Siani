import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { getFeed } from "../lib/api";
import { colors, spacing, typography, shadows } from "../theme/luxury";

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
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

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
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
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

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Luxury Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Journey</Text>
        <Text style={styles.subtitle}>
          {feed.length} {feed.length === 1 ? "moment" : "moments"}
        </Text>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.gold}
          />
        }
        contentContainerStyle={styles.listContent}
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
        ))}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activities yet!</Text>
            <Text style={styles.emptySubtext}>
              Start completing goals to see your feed
            </Text>
          </View>
        )}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.semibold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text.tertiary,
    marginTop: 4,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: "uppercase",
  },
  listContent: {
    padding: spacing.lg,
  },
  feedCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.md,
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  iconEmoji: {
    fontSize: 22,
  },
  feedContent: {
    flex: 1,
  },
  feedMessage: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  feedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedType: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    textTransform: "uppercase",
    letterSpacing: typography.letterSpacing.wide,
  },
  feedTime: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.text.disabled,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.medium,
    color: colors.semantic.error,
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.text.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    ...shadows.md,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text.tertiary,
    textAlign: "center",
  },
});
