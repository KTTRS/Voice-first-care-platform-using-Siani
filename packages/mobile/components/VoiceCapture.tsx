import React, { useState } from "react";
import { Button, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Audio } from "expo-av";

interface VoiceCaptureProps {
  onRecordingComplete?: (uri: string) => void;
  style?: any;
}

export default function VoiceCapture({
  onRecordingComplete,
  style,
}: VoiceCaptureProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [status, setStatus] = useState("Not recording");
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      console.log("Requesting permissions...");
      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        setStatus("Permission denied");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setStatus("Recording...");
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      setStatus("Error starting recording");
    }
  };

  const stopRecording = async () => {
    console.log("Stopping recording...");
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      console.log("Recording stopped and stored at", uri);
      setStatus("Recording stopped");
      setIsRecording(false);
      setRecording(null);

      if (uri && onRecordingComplete) {
        onRecordingComplete(uri);
      }

      // TODO: Send to backend for transcription and analysis
      // This will integrate with Siani's emotion + intent analysis
    } catch (err) {
      console.error("Failed to stop recording", err);
      setStatus("Error stopping recording");
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.statusText}>{status}</Text>
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordButtonActive]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <View
          style={[
            styles.recordButtonInner,
            isRecording && styles.recordButtonInnerActive,
          ]}
        />
      </TouchableOpacity>
      <Text style={styles.instructionText}>
        {isRecording ? "Tap to stop" : "Tap to start"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#007AFF",
    marginBottom: 8,
  },
  recordButtonActive: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30",
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
  },
  recordButtonInnerActive: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  instructionText: {
    fontSize: 12,
    color: "#999",
  },
});
