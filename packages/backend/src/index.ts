import "./config/env";
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "fs";
import { authRouter } from "./routes/auth";
import { patientRouter } from "./routes/patients";
import { signalRouter } from "./routes/signals";
import { signalRouter as signalScoreRouter } from "./routes/signalScores";
import { referralRouter } from "./routes/referrals";
import { memoryRouter } from "./routes/memory";
import { errorHandler } from "./middleware/errorHandler";
import userRouter from "./routes/users";
import memoryMomentsRouter from "./routes/memoryMoments";
import goalsRouter from "./routes/goals-simple"; // Using simple version for testing
import dailyActionsRouter from "./routes/dailyActions";
import referralLoopsRouter from "./routes/referralLoops";
import signalEventsRouter from "./routes/signalEvents";
import webhooksRouter from "./routes/webhooks";
import feedRouter from "./routes/feed";
import streaksRouter from "./routes/streaks";
import sdohRouter from "./routes/sdoh";
import resourceEngagementsRouter from "./routes/resourceEngagements";
import messagesRouter from "./routes/messages";
import voiceRouter from "./routes/voice";
import ttsRouter from "./routes/tts.routes";
import { initProsodyWebSocket } from "./routes/prosody.routes";
import { initVoiceStreamWebSocket } from "./routes/voiceStream.routes";
import { initTTSService } from "./routes/tts.routes";
import emotionClassifierRouter from "./routes/emotionClassifier.routes";
import relationalMemoryRouter from "./routes/relationalMemory.routes";
import sianiIntelligenceRouter from "./routes/sianiIntelligence.routes";
import sianiRouter from "./routes/siani.routes";
import eventRouter from "./routes/event.routes";
import { scheduleDailyCheckins } from "./jobs/schedulers/dailyCheckins";
import { scheduleDailyStreakCheck } from "./jobs/schedulers/dailyStreakCheck";
import { scheduleDailySignalUpdate } from "./jobs/schedulers/dailySignalUpdate";
import { scheduleResourceFollowUps } from "./jobs/schedulers/resourceFollowUp";
import "./jobs/workers/feed.worker"; // Initialize feed worker
import "./jobs/workers/signal.worker"; // Initialize signal worker
import { initializeWebSocket } from "./services/websocket.service";

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Revert to standard Helmet configuration (remove unsafe-inline allowances)
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NOTE: Removed /test static route used for temporary web fallback (voice-first product should not expose text chat test page)
// Logging middleware disabled temporarily due to file descriptor issues
// app.use((req, _res, next) => {
//   const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n`;
//   try {
//     fs.appendFileSync('analytics.log', logEntry);
//   } catch (error) {
//     console.error('Failed to write analytics log', error);
//   }
//   next();
// });

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (_req, res) => {
  res.send("Siani API is live");
});
app.post("/webhook", express.json(), (req, res) => {
  const event = req.body;
  console.log("Received webhook:", event);
  res.status(200).send("Webhook received");
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/patients", patientRouter);
app.use("/api/signals", signalRouter);
app.use("/api/signal-scores", signalScoreRouter); // New signal intelligence routes
app.use("/api/referrals", referralRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/users", userRouter);
app.use("/api/users", sdohRouter); // SDOH + Resource Intelligence routes (nested under /api/users/:id/...)
app.use("/api/resource-engagements", resourceEngagementsRouter); // Resource engagement API
app.use("/api/messages", messagesRouter); // Message processing with SDOH detection
app.use("/api/voice", voiceRouter); // Voice analysis and transcription
app.use("/api/tts", ttsRouter); // Text-to-speech with prosody
app.use("/api/emotion", emotionClassifierRouter); // Emotion classification (Calm, Guarded, Lit)
app.use("/api/memory/relational", relationalMemoryRouter); // Relational memory with emotional context
app.use("/api/siani/intelligence", sianiIntelligenceRouter); // Integrated intelligence pipeline
app.use("/api/siani", sianiRouter); // Siani conversation endpoints
app.use("/api/memory-moments", memoryMomentsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/daily-actions", dailyActionsRouter);
app.use("/api/referral-loops", referralLoopsRouter);
app.use("/api/signal-events", signalEventsRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/feed", feedRouter);
app.use("/api/streaks", streaksRouter);
app.use("/api/events", eventRouter); // Immutable event store

// scheduleDailyCheckins(); // Temporarily disabled
scheduleDailyStreakCheck(); // Enable daily streak tracking
scheduleDailySignalUpdate(); // Enable daily signal score updates
scheduleResourceFollowUps(); // Enable resource engagement follow-ups

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Sainte backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Initialize WebSocket
initializeWebSocket(server);

// Initialize Prosody WebSocket
const prosodyWss = initProsodyWebSocket(server);
initVoiceStreamWebSocket(server);
initTTSService(prosodyWss);
console.log(`🎵 Prosody WebSocket available at ws://localhost:${PORT}/prosody`);

export default app;
