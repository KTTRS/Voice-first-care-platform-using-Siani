import React, { useState } from "react";
// Declare window to satisfy TypeScript in React Native web builds
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  text: string;
  emotion?: string;
  audioUrl?: string;
}

export default function SianiWeb() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(true);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

  async function handleSetToken() {
    if (token.trim()) {
      await AsyncStorage.setItem("authToken", token);
      setShowTokenInput(false);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken && Platform.OS === "web") {
        if (typeof window !== "undefined" && window?.alert) {
          window.alert("Not authenticated. Please set token first.");
        }
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_URL}/api/siani/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ text: input, conversationId }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      const data = await res.json();
      // Add user + assistant messages
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { id: data.userMessageId, role: "USER", text: input },
        {
          id: data.assistantMessageId,
          role: "ASSISTANT",
          text: data.text,
          emotion: data.emotion,
          audioUrl: data.audioUrl,
        },
      ]);
      setInput("");
      if (data.audioUrl) {
        try {
          const { sound } = await Audio.Sound.createAsync({
            uri: data.audioUrl,
          });
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
            }
          });
        } catch (e) {
          console.warn("Audio playback failed", e);
        }
      }
    } catch (e: any) {
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        window?.alert
      ) {
        window.alert(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Siani Web Conversation</Text>
      {showTokenInput && (
        <View style={styles.tokenBox}>
          <Text style={styles.tokenLabel}>Enter JWT Token:</Text>
          <TextInput
            style={styles.tokenInput}
            placeholder="Paste your JWT token here..."
            placeholderTextColor="#666"
            value={token}
            onChangeText={setToken}
            multiline
          />
          <Button title="Set Token" onPress={handleSetToken} />
          <Text style={styles.hint}>
            Get token: Login at /login or run test-auth-system.sh
          </Text>
        </View>
      )}
      {!showTokenInput && (
        <Button title="Change Token" onPress={() => setShowTokenInput(true)} />
      )}
      <View style={styles.messages}>
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              m.role === "USER" ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={styles.bubbleText}>{m.text}</Text>
            {m.emotion && <Text style={styles.emotionTag}>{m.emotion}</Text>}
          </View>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Type your message..."
        value={input}
        onChangeText={setInput}
      />
      <Button
        title={loading ? "Sending..." : "Send"}
        disabled={loading}
        onPress={sendMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#111" },
  title: { fontSize: 22, fontWeight: "600", color: "#fff", marginBottom: 12 },
  tokenBox: {
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  tokenLabel: { color: "#fff", marginBottom: 8, fontWeight: "600" },
  tokenInput: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    minHeight: 60,
  },
  hint: { color: "#666", fontSize: 12, marginTop: 8 },
  messages: { flex: 1, marginBottom: 16 },
  bubble: { padding: 12, borderRadius: 12, marginVertical: 6 },
  userBubble: { backgroundColor: "#2d2d44", alignSelf: "flex-end" },
  assistantBubble: {
    backgroundColor: "#1e1e30",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#444",
  },
  bubbleText: { color: "#eee" },
  emotionTag: { marginTop: 4, fontSize: 10, color: "#a78bfa" },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
});
