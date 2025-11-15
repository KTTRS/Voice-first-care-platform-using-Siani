import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { login, register, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      await login(email, password);
      router.replace("/");
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.message || "Invalid credentials");
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert("Error", "Please complete all fields");
      return;
    }

    setErrorMessage(null);
    try {
      await register({ email, password, firstName, lastName });
      router.replace("/");
    } catch (error: any) {
      const message = error?.message || "Unable to sign up";
      console.error("Signup error:", error);
      setErrorMessage(message);
      Alert.alert("Sign Up Failed", message);
    }
  };

  const handleSubmit = () => {
    if (mode === "login") {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🏥 Sainte</Text>
          <Text style={styles.subtitle}>Voice-First Care Platform</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.modeSwitcher}>
            <TouchableOpacity
              style={[styles.modeButton, mode === "login" && styles.modeActive]}
              onPress={() => setMode("login")}
              disabled={loading}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === "login" && styles.modeButtonTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === "signup" && styles.modeActive]}
              onPress={() => setMode("signup")}
              disabled={loading}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === "signup" && styles.modeButtonTextActive,
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "signup" && (
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jane"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!loading}
                />
              </View>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!loading}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </Text>
          </TouchableOpacity>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Test Credentials:</Text>
          <Text style={styles.testCredentials}>
            Email: john.doe@example.com
          </Text>
          <Text style={styles.testCredentials}>Password: patient123</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modeSwitcher: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  modeActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  modeButtonTextActive: {
    color: "#111827",
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#93c5fd",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 12,
    color: "#dc2626",
    fontSize: 13,
    textAlign: "center",
  },
  footer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 4,
  },
  testCredentials: {
    fontSize: 12,
    color: "#856404",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
