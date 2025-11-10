import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { logout, getUser } from "../lib/api";

export default function Index() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = await getUser();
    if (user) {
      setUserName(user.name || user.email);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Sainte</Text>
              <Text style={styles.subtitle}>AI Care Platform</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          {userName && (
            <Text style={styles.welcomeText}>Welcome, {userName}!</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome to Voice-First Care</Text>
          <Text style={styles.cardText}>
            Experience intelligent healthcare monitoring with AI-powered
            insights and voice-first interactions.
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📊</Text>
            </View>
            <Text style={styles.featureTitle}>Real-Time Monitoring</Text>
            <Text style={styles.featureText}>
              Track vital signs and symptoms with intelligent scoring
            </Text>
          </View>

          <View style={styles.feature}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🤖</Text>
            </View>
            <Text style={styles.featureTitle}>AI Memory</Text>
            <Text style={styles.featureText}>
              Context-aware conversations that remember your preferences
            </Text>
          </View>

          <View style={styles.feature}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👥</Text>
            </View>
            <Text style={styles.featureTitle}>Care Coordination</Text>
            <Text style={styles.featureText}>
              Seamless communication with your healthcare team
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/goals")}
          >
            <Text style={styles.primaryButtonText}>🎯 View Goals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/feed")}
          >
            <Text style={styles.secondaryButtonText}>📰 View Feed</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Platform Features</Text>

          <View style={styles.infoItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.infoText}>Voice-first patient interface</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.infoText}>Secure JWT authentication</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.infoText}>
              Real-time health signal tracking
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.infoText}>AI-powered care recommendations</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.infoText}>Automated referral management</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9ff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: "#0ea5e9",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#e0f2fe",
  },
  welcomeText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "500",
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0c4a6e",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
  },
  features: {
    padding: 16,
  },
  feature: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#e0f2fe",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0c4a6e",
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  actions: {
    padding: 16,
  },
  primaryButton: {
    backgroundColor: "#0ea5e9",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0ea5e9",
  },
  secondaryButtonText: {
    color: "#0ea5e9",
    fontSize: 16,
    fontWeight: "bold",
  },
  info: {
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0c4a6e",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkmark: {
    fontSize: 18,
    color: "#10b981",
    marginRight: 12,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 16,
    color: "#475569",
    flex: 1,
  },
});
