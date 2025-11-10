import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

export const feedQueue = new Queue("feed-events", { connection });

export async function trackGoalCreated(data: {
  goalId: string;
  userId: string;
  title: string;
  points: number;
}) {
  await feedQueue.add("goal.created", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
  console.log(`📢 Queued goal creation event: ${data.title}`);
}

export async function trackGoalCompleted(data: {
  goalId: string;
  userId: string;
  title: string;
  totalPoints: number;
}) {
  await feedQueue.add("goal.completed", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
  console.log(`🎉 Queued goal completion event: ${data.title}`);
}

export async function trackDailyActionCompleted(data: {
  actionId: string;
  goalId: string;
  userId: string;
  content: string;
  points: number;
}) {
  await feedQueue.add("action.completed", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
  console.log(`✅ Queued action completion: ${data.content}`);
}

export async function trackStreakMaintained(data: {
  userId: string;
  streakDays: number;
}) {
  await feedQueue.add("streak.maintained", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
  console.log(`🔥 Queued streak maintained event: ${data.streakDays} days`);
}

export async function trackResourceUsed(data: {
  userId: string;
  resourceName: string;
  resourceId?: string;
}) {
  await feedQueue.add("resource.used", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
  console.log(`🔗 Queued resource used event: ${data.resourceName}`);
}
