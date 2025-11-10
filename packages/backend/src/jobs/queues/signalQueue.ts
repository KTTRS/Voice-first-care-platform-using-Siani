import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

/**
 * Signal Score Processing Queue
 * Handles async signal score updates triggered by user events
 */
export const signalQueue = new Queue("signal-processing", {
  connection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 86400, // Keep failed jobs for 7 days
    },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

/**
 * Add a signal processing job for a user
 */
export async function triggerSignalUpdate(
  userId: string,
  trigger: string
): Promise<void> {
  await signalQueue.add(
    "process-user-signal",
    {
      userId,
      trigger,
      timestamp: new Date().toISOString(),
    },
    {
      jobId: `signal-${userId}-${Date.now()}`,
    }
  );

  console.log(
    `🎯 Signal update queued for user ${userId} (trigger: ${trigger})`
  );
}

/**
 * Add bulk signal processing jobs
 */
export async function triggerBulkSignalUpdate(
  userIds: string[],
  trigger: string
): Promise<void> {
  const jobs = userIds.map((userId) => ({
    name: "process-user-signal",
    data: {
      userId,
      trigger,
      timestamp: new Date().toISOString(),
    },
    opts: {
      jobId: `signal-${userId}-${Date.now()}`,
    },
  }));

  await signalQueue.addBulk(jobs);

  console.log(
    `🎯 Bulk signal update queued for ${userIds.length} users (trigger: ${trigger})`
  );
}
