import "./config/env";
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "fs";
import { authRouter } from "./routes/auth";
import { patientRouter } from "./routes/patients";
import { signalRouter } from "./routes/signals";
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
import { scheduleDailyCheckins } from "./jobs/schedulers/dailyCheckins";
import { scheduleDailyStreakCheck } from "./jobs/schedulers/dailyStreakCheck";
import "./jobs/workers/feed.worker"; // Initialize feed worker
import { initializeWebSocket } from "./services/websocket.service";

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
app.use("/api/referrals", referralRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/users", userRouter);
app.use("/api/memory-moments", memoryMomentsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/daily-actions", dailyActionsRouter);
app.use("/api/referral-loops", referralLoopsRouter);
app.use("/api/signal-events", signalEventsRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/feed", feedRouter);
app.use("/api/streaks", streaksRouter);

// scheduleDailyCheckins(); // Temporarily disabled
scheduleDailyStreakCheck(); // Enable daily streak tracking

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Sainte backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Initialize WebSocket
initializeWebSocket(server);

export default app;
