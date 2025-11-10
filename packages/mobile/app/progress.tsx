import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSDOHSync, getStatusLabel } from "../hooks/useSDOHSync";
import { ResourceCard } from "../components/ResourceCard";

/**
 * Dashboard showing goals, daily actions, and resource engagements
 * Displays:
 * - Active resource engagements
 * - Completed resources
 * - Open support items
 * - Progress statistics
 */
export default function MyProgress() {
  const router = useRouter();
  const { activeEngagements, completedEngagements, loading, error, refresh } =
    useSDOHSync(30000); // Auto-refresh every 30 seconds

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleEngagementPress = (engagementId: string) => {
    router.push({
      pathname: "/resource-assistant",
      params: { engagementId },
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Progress</Text>
        <Text style={styles.headerSubtitle}>
          Everything we're working on together
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refresh} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Resources Section */}
        {activeEngagements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Support</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeEngagements.length}</Text>
              </View>
            </View>
            {activeEngagements.map((engagement) => (
              <ResourceCard
                key={engagement.id}
                engagement={engagement}
                onPress={() => handleEngagementPress(engagement.id)}
              />
            ))}
          </View>
        )}

        {/* Completed Resources Section */}
        {completedEngagements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Completed</Text>
              <View style={[styles.badge, styles.completedBadge]}>
                <Text style={styles.badgeText}>
                  {completedEngagements.length}
                </Text>
              </View>
            </View>
            {completedEngagements.map((engagement) => (
              <ResourceCard
                key={engagement.id}
                engagement={engagement}
                onPress={() => handleEngagementPress(engagement.id)}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {activeEngagements.length === 0 &&
          completedEngagements.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyTitle}>Looking good!</Text>
              <Text style={styles.emptyText}>
                When you need help with something, I'll let you know here.
                {"\n\n"}
                Just keep talking to me like you normally do.
              </Text>
            </View>
          )}

        {/* Progress Stats */}
        {(activeEngagements.length > 0 || completedEngagements.length > 0) && (
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{activeEngagements.length}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, styles.completedValue]}>
                  {
                    completedEngagements.filter((e) => e.status === "COMPLETED")
                      .length
                  }
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer Message */}
        <View style={styles.footerMessage}>
          <Text style={styles.footerIcon}>💬</Text>
          <Text style={styles.footerText}>
            I'm always listening for ways to help.
            {"\n"}
            Just mention what you need in our conversations.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  errorBox: {
    margin: 16,
    padding: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    fontSize: 14,
    color: "#991B1B",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginRight: 8,
  },
  badge: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: "#10B981",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#8B5CF6",
    marginBottom: 4,
  },
  completedValue: {
    color: "#10B981",
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  footerMessage: {
    alignItems: "center",
    padding: 32,
    marginTop: 20,
  },
  footerIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});
