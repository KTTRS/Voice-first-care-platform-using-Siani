import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

export const reminderQueue = new Queue("reminders", { connection });
export const feedEventsQueue = new Queue("feed-events", { connection });

// Helper functions to enqueue feed events
export const enqueueFeedEvent = {
  goalCreated: (data: {
    userId: string;
    goalId: string;
    title: string;
    points: number;
  }) => {
    return feedEventsQueue.add("goal.created", data);
  },

  goalCompleted: (data: {
    userId: string;
    goalId: string;
    title: string;
    totalPoints: number;
  }) => {
    return feedEventsQueue.add("goal.completed", data);
  },

  dailyActionCompleted: (data: {
    userId: string;
    goalId?: string;
    actionId: string;
    content: string;
    points: number;
  }) => {
    return feedEventsQueue.add("action.completed", data);
  },

  streakMaintained: (data: { userId: string; streakDays: number }) => {
    return feedEventsQueue.add("streak.maintained", data);
  },

  resourceUsed: (data: {
    userId: string;
    resourceName: string;
    resourceId?: string;
  }) => {
    return feedEventsQueue.add("resource.used", data);
  },
};

export default {
  reminderQueue,
  feedEventsQueue,
};
