import { Router } from "express";
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { ProsodyAnalyzer } from "../services/prosody.service";

const router = Router();

/**
 * WebSocket Prosody Stream Endpoint
 *
 * Provides real-time prosody data (pitch, energy) from TTS output
 * to mobile clients for avatar animation synchronization.
 */

// Store active prosody analyzers per connection
const analyzers = new Map<WebSocket, ProsodyAnalyzer>();

/**
 * Initialize WebSocket server for prosody streaming
 */
export function initProsodyWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: "/prosody",
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[Prosody] Client connected");

    // Create prosody analyzer for this connection
    const analyzer = new ProsodyAnalyzer(16000, 1024, 512);
    analyzers.set(ws, analyzer);

    // Send initial connection confirmation
    ws.send(
      JSON.stringify({
        type: "connected",
        timestamp: Date.now(),
        message: "Prosody stream ready",
      })
    );

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        // Handle different message types
        switch (message.type) {
          case "audio_chunk":
            handleAudioChunk(ws, analyzer, message.data);
            break;
          case "reset":
            analyzer.reset();
            ws.send(
              JSON.stringify({ type: "reset_ack", timestamp: Date.now() })
            );
            break;
          default:
            console.warn("[Prosody] Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("[Prosody] Error processing message:", error);
      }
    });

    ws.on("close", () => {
      console.log("[Prosody] Client disconnected");
      analyzers.delete(ws);
    });

    ws.on("error", (error: Error) => {
      console.error("[Prosody] WebSocket error:", error);
      analyzers.delete(ws);
    });
  });

  console.log("[Prosody] WebSocket server initialized on /prosody");
  return wss;
}

/**
 * Process audio chunk and stream prosody data
 */
function handleAudioChunk(
  ws: WebSocket,
  analyzer: ProsodyAnalyzer,
  audioData: number[]
): void {
  try {
    const float32Array = new Float32Array(audioData);
    const prosodyFrames = analyzer.processChunk(float32Array);

    // Stream each prosody frame to client
    prosodyFrames.forEach((frame) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "prosody",
            ...frame,
          })
        );
      }
    });
  } catch (error) {
    console.error("[Prosody] Error processing audio chunk:", error);
  }
}

/**
 * Broadcast prosody data to all connected clients
 */
export function broadcastProsody(
  wss: WebSocketServer,
  pitchHz: number,
  energy: number
): void {
  const message = JSON.stringify({
    type: "prosody",
    pitchHz,
    energy,
    timestamp: Date.now(),
  });

  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export default router;
