import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getToken } from "../lib/api";

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getToken();
    setIsAuthenticated(!!token);
  };

  useEffect(() => {
    if (isAuthenticated === null) return; // Still loading

    const inAuthGroup = segments[0] === "login";
    const inWebTest = segments[0] === "siani-web";

    if (!isAuthenticated && !inAuthGroup && !inWebTest) {
      // Redirect to login if not authenticated (except for siani-web test page)
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if already authenticated
      router.replace("/");
    }
  }, [isAuthenticated, segments]);

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
          name="siani"
          options={{
            title: "Siani",
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
        <Stack.Screen
          name="siani-web"
          options={{
            title: "Siani Web Test",
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}
