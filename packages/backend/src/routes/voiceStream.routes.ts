/**
 * Voice Streaming WebSocket
 *
 * Path: /voice-stream
 * Protocol (JSON messages):
 * Client -> Server:
 *  - { type: "start", conversationId?: string }
 *  - { type: "audio_chunk", chunkBase64: string, mimeType?: string }
 *  - { type: "text_chunk", text: string } // optional shortcut for early integration
 *  - { type: "stop" }
 *  - { type: "cancel" }
 *
 * Server -> Client:
 *  - { type: "ack_start", conversationId }
 *  - { type: "partial_transcript", text, isFinal: false }
 *  - { type: "final_transcript", text, isFinal: true }
 *  - { type: "assistant_thinking" }
 *  - { type: "emotion_update", emotion }
 *  - { type: "tts_chunk", seq, audioBase64, isFinal: false }
 *  - { type: "tts_complete", audioUrl, text, relationalContext }
 *  - { type: "error", message }
 *
 * Notes:
 *  - This is an MVP streaming layer; Whisper true streaming is simulated by batching chunks.
 *  - In MOCK_MODE we generate synthetic partial transcripts and TTS chunks.
 */
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { sianiService } from "../services/siani.service";
import { voiceService } from "../services/voice.service";
import { emotionClassifierService } from "../services/emotionClassifier.service";
import { ttsService } from "../services/tts.service";

const JWT_SECRET = process.env.JWT_SECRET!;
const MOCK_MODE = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-openai-api-key";

interface StreamSession {
  userId: string;
  conversationId?: string;
  audioChunks: string[]; // base64 segments
  textAccumulator: string; // aggregated transcript
  lastPartialSent: string;
  closed: boolean;
}

const sessions = new Map<WebSocket, StreamSession>();

export function initVoiceStreamWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/voice-stream" });

  wss.on("connection", (ws, req) => {
    try {
      // Auth via query param token or reject
  // Extract query portion safely (req.url may include path + query)
  const fullUrl = req.url ? `http://localhost${req.url}` : "http://localhost";
  const url = new URL(fullUrl);
      const token = url.searchParams.get("token");
      if (!token) {
        ws.send(JSON.stringify({ type: "error", message: "Missing token" }));
        ws.close();
        return;
      }
      let payload: any;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
        ws.close();
        return;
      }

      const session: StreamSession = {
        userId: payload.userId,
        conversationId: undefined,
        audioChunks: [],
        textAccumulator: "",
        lastPartialSent: "",
        closed: false,
      };
      sessions.set(ws, session);
      ws.send(JSON.stringify({ type: "connected", message: "Voice stream ready" }));
    } catch (err: any) {
      ws.send(JSON.stringify({ type: "error", message: err.message || "Connection error" }));
      ws.close();
      return;
    }

    ws.on("message", async (raw: Buffer) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON message" }));
        return;
      }
      const session = sessions.get(ws);
      if (!session) return;

      switch (msg.type) {
        case "start":
          session.conversationId = msg.conversationId;
          ws.send(
            JSON.stringify({
              type: "ack_start",
              conversationId: session.conversationId || null,
            })
          );
          break;
        case "audio_chunk":
          handleAudioChunk(ws, session, msg.chunkBase64, msg.mimeType);
          break;
        case "text_chunk":
          handleTextChunk(ws, session, msg.text);
          break;
        case "stop":
          await finalizeStream(ws, session);
          break;
        case "cancel":
          ws.send(JSON.stringify({ type: "cancel_ack" }));
          ws.close();
          break;
        default:
          ws.send(JSON.stringify({ type: "error", message: `Unknown message type: ${msg.type}` }));
      }
    });

    ws.on("close", () => {
      sessions.delete(ws);
    });

    ws.on("error", (err) => {
      console.error("[VoiceStream] WebSocket error", err);
      sessions.delete(ws);
    });
  });

  console.log("[VoiceStream] WebSocket server initialized on /voice-stream");
  return wss;
}

function handleAudioChunk(ws: WebSocket, session: StreamSession, chunkBase64: string, mimeType?: string) {
  if (session.closed) return;
  session.audioChunks.push(chunkBase64);

  // Simulate partial transcription every N chunks
  const CHUNK_BATCH = 2;
  if (session.audioChunks.length % CHUNK_BATCH === 0) {
    if (MOCK_MODE) {
      const partial = `mock transcript part ${session.audioChunks.length / CHUNK_BATCH}`;
      session.textAccumulator = `${session.textAccumulator} ${partial}`.trim();
      if (partial !== session.lastPartialSent) {
        session.lastPartialSent = partial;
        ws.send(
          JSON.stringify({ type: "partial_transcript", text: session.textAccumulator, isFinal: false })
        );
      }
    } else {
      // Assemble current buffer for pseudo-partial
      const combined = session.audioChunks.join("");
      voiceService
        .transcribe({ audioBase64: combined, mimeType: mimeType || "audio/webm" })
        .then((text) => {
          session.textAccumulator = text;
          if (text !== session.lastPartialSent) {
            session.lastPartialSent = text;
            ws.send(
              JSON.stringify({ type: "partial_transcript", text, isFinal: false })
            );
          }
        })
        .catch((err) => {
          ws.send(JSON.stringify({ type: "error", message: `Partial transcription failed: ${err.message}` }));
        });
    }
  }
}

function handleTextChunk(ws: WebSocket, session: StreamSession, text: string) {
  if (session.closed) return;
  session.textAccumulator = `${session.textAccumulator} ${text}`.trim();
  ws.send(
    JSON.stringify({ type: "partial_transcript", text: session.textAccumulator, isFinal: false })
  );
}

async function finalizeStream(ws: WebSocket, session: StreamSession) {
  if (session.closed) return;
  session.closed = true;
  const userText = session.textAccumulator.trim();
  if (!userText) {
    ws.send(JSON.stringify({ type: "final_transcript", text: "", isFinal: true }));
    ws.send(JSON.stringify({ type: "error", message: "No transcript captured" }));
    ws.close();
    return;
  }
  ws.send(JSON.stringify({ type: "final_transcript", text: userText, isFinal: true }));
  ws.send(JSON.stringify({ type: "assistant_thinking" }));

  // Emotion classification
  let emotionCategory = "calm";
  try {
    const emotionResult = await emotionClassifierService.classifyEmotion({ transcript: userText });
    emotionCategory = emotionResult.emotion_category;
    ws.send(JSON.stringify({ type: "emotion_update", emotion: emotionCategory.toUpperCase() }));
  } catch (e: any) {
    ws.send(JSON.stringify({ type: "error", message: `Emotion classification failed: ${e.message}` }));
  }

  // Generate assistant response (reuse sianiService path without audio)
  let assistantText = "I'm here with you.";
  let relationalContext: any = {};
  try {
    // Use internal generateResponse to avoid double persistence; we'll rely on standard send later if needed.
    const context = await (sianiService as any).generateResponse(userText, emotionCategory.toUpperCase(), {
      relationalCues: { trustLevel: 0.5, familiarity: 0.5, continuity: 0.5 },
      emotionalContext: {},
      contextPrompt: "(Streaming mode simplified context)"
    });
    assistantText = context;
    relationalContext = { trustLevel: 0.5, familiarity: 0.5, continuity: 0.5 };
  } catch (e: any) {
    ws.send(JSON.stringify({ type: "error", message: `LLM generation failed: ${e.message}` }));
  }

  // TTS synthesis -> stream chunks
  try {
    const audioBase64 = await ttsService.synthesize({ text: assistantText, emotion: emotionCategory.toUpperCase() as any });
    const CHUNK_SIZE = 8000; // characters of base64
    let seq = 0;
    for (let i = 0; i < audioBase64.length; i += CHUNK_SIZE) {
      const slice = audioBase64.slice(i, i + CHUNK_SIZE);
      ws.send(
        JSON.stringify({ type: "tts_chunk", seq: seq++, audioBase64: slice, isFinal: false })
      );
    }
    const audioUrl = await ttsService.getAudioUrl(audioBase64);
    ws.send(
      JSON.stringify({
        type: "tts_complete",
        audioUrl,
        text: assistantText,
        relationalContext,
      })
    );
    ws.close();
  } catch (e: any) {
    ws.send(JSON.stringify({ type: "error", message: `TTS failed: ${e.message}` }));
    ws.close();
  }
}

export default {};
