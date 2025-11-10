import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ResourceEngagement,
  getNeedTypeLabel,
  getNeedTypeIcon,
  getNeedTypeColor,
} from "../hooks/useSDOHSync";
import {
  acceptResourceOffer,
  declineResourceOffer,
  getResourceEngagement,
} from "../lib/api";

/**
 * Full guided walkthrough screen for resource engagement
 * Shows resource details, 3 action buttons (Accept/Save/Dismiss)
 * Integrates with backend to update engagement status
 */
export default function ResourceAssistant() {
  const router = useRouter();
  const { engagementId } = useLocalSearchParams<{ engagementId: string }>();

  const [engagement, setEngagement] = useState<ResourceEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  React.useEffect(() => {
    loadEngagement();
  }, [engagementId]);

  const loadEngagement = async () => {
    if (!engagementId) {
      Alert.alert("Error", "No engagement ID provided");
      router.back();
      return;
    }

    try {
      setLoading(true);
      const data = await getResourceEngagement(engagementId);
      setEngagement(data);
    } catch (error) {
      console.error("Error loading engagement:", error);
      Alert.alert("Error", "Failed to load resource details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!engagement) return;

    setActionLoading(true);
    try {
      await acceptResourceOffer(engagement.id);
      Alert.alert(
        "Great!",
        "I'll walk you through this step by step. Check back anytime for next steps.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error accepting offer:", error);
      Alert.alert("Error", "Failed to accept offer. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveForLater = async () => {
    if (!engagement) return;

    setActionLoading(true);
    try {
      // Keep status as OFFERED, just dismiss the screen
      Alert.alert(
        "Saved",
        "I'll remind you about this later. You can find it anytime in your progress.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error saving:", error);
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (!engagement) return;

    Alert.alert("Not interested?", "No problem! I won't bring this up again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Dismiss",
        style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          try {
            await declineResourceOffer(engagement.id, "User dismissed offer");
            router.back();
          } catch (error) {
            console.error("Error declining:", error);
            Alert.alert("Error", "Failed to dismiss. Please try again.");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (!engagement) {
    return null;
  }

  const icon = getNeedTypeIcon(engagement.needType);
  const title =
    engagement.resourceName || getNeedTypeLabel(engagement.needType);
  const color = getNeedTypeColor(engagement.needType);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>{icon}</Text>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Context Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What I heard</Text>
          <View style={styles.contextBox}>
            <Text style={styles.contextText}>
              "{engagement.detectionContext}"
            </Text>
          </View>
        </View>

        {/* Resource Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How I can help</Text>
          <View style={styles.detailsBox}>
            <Text style={styles.detailsText}>
              {getHelpText(engagement.needType)}
            </Text>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next steps</Text>
          <View style={styles.stepsBox}>
            {getNextSteps(engagement.needType).map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Actions Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.acceptButton,
            { backgroundColor: color },
          ]}
          onPress={handleAccept}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptButtonText}>Let's do this</Text>
          )}
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSaveForLater}
            disabled={actionLoading}
          >
            <Text style={styles.secondaryButtonText}>Save for later</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleDismiss}
            disabled={actionLoading}
          >
            <Text style={styles.secondaryButtonText}>Not interested</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Helper functions for content
function getHelpText(needType: string): string {
  const helpTexts: Record<string, string> = {
    TRANSPORTATION:
      "I can connect you with local transportation services that offer free or reduced-cost rides to medical appointments, groceries, and other essential needs.",
    FOOD_INSECURITY:
      "I'll help you find food pantries, meal programs, and SNAP benefits in your area. Many offer same-day assistance.",
    HOUSING:
      "I can connect you with emergency housing assistance, rental aid programs, and housing counselors who can help with your situation.",
    FINANCIAL:
      "I'll help you explore emergency financial assistance, bill payment programs, and financial counseling services available in your area.",
    HEALTHCARE_ACCESS:
      "I can help you find community health centers, affordable clinics, and programs that help cover medical costs.",
    SOCIAL_ISOLATION:
      "I'll connect you with community programs, support groups, and social activities where you can meet people and build connections.",
    UTILITIES:
      "I can help you find utility assistance programs, energy bill payment help, and weatherization services.",
    EMPLOYMENT:
      "I'll connect you with job training programs, employment services, and career counseling in your area.",
  };

  return (
    helpTexts[needType] || "I'm here to help you find the resources you need."
  );
}

function getNextSteps(needType: string): string[] {
  const steps: Record<string, string[]> = {
    TRANSPORTATION: [
      "I'll gather some basic info about your transportation needs",
      "I'll search for services in your area",
      "I'll help you contact and schedule with the best option",
      "I'll check in to make sure everything's working out",
    ],
    FOOD_INSECURITY: [
      "I'll ask a few questions about your household",
      "I'll find food resources near you",
      "I'll help you connect with the programs",
      "I'll follow up to make sure you got what you need",
    ],
    HOUSING: [
      "I'll understand your housing situation",
      "I'll find emergency and long-term housing resources",
      "I'll help you apply and connect with the right programs",
      "I'll stay in touch as you work through this",
    ],
    // Add more as needed...
  };

  return (
    steps[needType] || [
      "I'll gather some information about your needs",
      "I'll search for the best resources for you",
      "I'll help you connect with those resources",
      "I'll check in to make sure it's working out",
    ]
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
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  headerContent: {
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contextBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  contextText: {
    fontSize: 15,
    color: "#4B5563",
    fontStyle: "italic",
    lineHeight: 22,
  },
  detailsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  detailsText: {
    fontSize: 15,
    color: "#1F2937",
    lineHeight: 24,
  },
  stepsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    lineHeight: 22,
    paddingTop: 3,
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  acceptButton: {
    backgroundColor: "#8B5CF6",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  secondaryButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
  },
});
