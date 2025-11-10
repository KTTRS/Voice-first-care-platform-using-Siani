import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";

// Screens
import HomeScreen from "../screens/HomeScreen";
import SianiScreen from "../screens/SianiScreen";
import FeedScreen from "../screens/FeedScreen";
import ProfileScreen from "../screens/ProfileScreen";

// Components
import EmotionAvatar from "../components/EmotionAvatar";
import { useEmotionStore } from "../store/emotionStore";

const Tab = createBottomTabNavigator();

/**
 * Main App Navigation
 *
 * Structure: Bottom Tabs with 4 screens
 * Overlay: Floating EmotionAvatar on non-Siani screens
 */
export default function AppNavigator() {
  const { currentEmotion } = useEmotionStore();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: "#B8860B",
          tabBarInactiveTintColor: "#B0AAA5",
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIconStyle: { display: "none" }, // Icons removed for minimal design
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: "Home",
          }}
        />

        <Tab.Screen
          name="Siani"
          component={SianiScreen}
          options={{
            tabBarLabel: "Siani",
            tabBarStyle: { display: "none" }, // Hide tab bar on Siani screen
          }}
        />

        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{
            tabBarLabel: "Journey",
          }}
        />

        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: "Profile",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: 60,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});
