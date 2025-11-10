import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processUserSignal } from "../../services/signalEngine.service";

const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

/**
 * Signal Processing Worker
 * Processes signal score updates asynchronously
 */
const signalWorker = new Worker(
  "signal-processing",
  async (job) => {
    const { userId, trigger } = job.data;

    console.log(
      `🧠 Processing signal update for user ${userId} (trigger: ${trigger})`
    );

    try {
      await processUserSignal(userId);
      console.log(`✅ Signal score updated for user ${userId}`);
      return { success: true, userId };
    } catch (error) {
      console.error(
        `❌ Failed to update signal score for user ${userId}:`,
        error
      );
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 users simultaneously
    limiter: {
      max: 10,
      duration: 1000, // Max 10 jobs per second
    },
  }
);

signalWorker.on("completed", (job) => {
  console.log(`✓ Signal job ${job.id} completed`);
});

signalWorker.on("failed", (job, err) => {
  console.error(`✗ Signal job ${job?.id} failed:`, err.message);
});

console.log("🧠 Signal processing worker initialized");

export { signalWorker };
