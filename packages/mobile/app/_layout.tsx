import { ActivityIndicator, View } from "react-native";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../context/AuthContext";

function NavigationStack() {
  const { token, initializing } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === "login";

    if (!token && !inAuthGroup) {
      router.replace("/login");
    } else if (token && inAuthGroup) {
      router.replace("/");
    }
  }, [token, segments, initializing]);

  if (initializing) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="index"
          options={{
            title: "Sainte",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            title: "Siani",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="conversation"
          options={{
            title: "Conversation",
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="goals"
          options={{
            title: "My Goals",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="feed"
          options={{
            title: "Your Journey",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="progress"
          options={{
            title: "Progress",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="resource-assistant"
          options={{
            title: "Resource Assistant",
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationStack />
    </AuthProvider>
  );
}
