import { Worker } from "bullmq";
import IORedis from "ioredis";
import { feedService } from "../../services/feed.service";
import { broadcastFeedEvent } from "../../services/websocket.service";
import { createFeedEvent } from "../../services/feedEvent.service";

const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

export const feedWorker = new Worker(
  "feed-events",
  async (job) => {
    console.log(`Processing feed event: ${job.name}`, job.data);

    switch (job.name) {
      case "goal.created":
        // Create old feed item for compatibility
        await feedService.createFeedItem({
          type: "GOAL_CREATED",
          userId: job.data.userId,
          content: `Set a new goal: "${job.data.title}" (${job.data.points} points)`,
          metadata: {
            goalId: job.data.goalId,
            title: job.data.title,
            points: job.data.points,
          },
        });

        // Create new FeedEvent record
        await createFeedEvent({
          type: "GOAL_CREATED",
          userId: job.data.userId,
          goalId: job.data.goalId,
          message: `Set a new goal: "${job.data.title}"`,
        });

        // Broadcast via WebSocket
        broadcastFeedEvent({
          type: "GOAL_CREATED",
          userId: job.data.userId,
          content: `Set a new goal: "${job.data.title}"`,
          metadata: { ...job.data },
        });
        break;

      case "goal.completed":
        await feedService.createFeedItem({
          type: "GOAL_COMPLETED",
          userId: job.data.userId,
          content: `Completed goal: "${job.data.title}" (${job.data.totalPoints} points earned!)`,
          metadata: {
            goalId: job.data.goalId,
            title: job.data.title,
            totalPoints: job.data.totalPoints,
          },
        });

        // Create new FeedEvent record
        await createFeedEvent({
          type: "GOAL_COMPLETED",
          userId: job.data.userId,
          goalId: job.data.goalId,
          message: `Completed goal: "${job.data.title}"`,
        });

        broadcastFeedEvent({
          type: "GOAL_COMPLETED",
          userId: job.data.userId,
          content: `Completed goal: "${job.data.title}"`,
          metadata: { ...job.data },
        });
        break;

      case "action.completed":
        await feedService.createFeedItem({
          type: "DAILY_ACTION_COMPLETED",
          userId: job.data.userId,
          content: `Completed: ${job.data.content} (+${job.data.points} points)`,
          metadata: {
            actionId: job.data.actionId,
            goalId: job.data.goalId,
            points: job.data.points,
          },
        });

        // Create new FeedEvent record
        await createFeedEvent({
          type: "DAILY_ACTION_COMPLETED",
          userId: job.data.userId,
          goalId: job.data.goalId,
          message: `Completed: ${job.data.content}`,
        });

        broadcastFeedEvent({
          type: "DAILY_ACTION_COMPLETED",
          userId: job.data.userId,
          content: `Completed: ${job.data.content}`,
          metadata: { ...job.data },
        });
        break;

      case "streak.maintained":
        await feedService.createFeedItem({
          type: "STREAK_MAINTAINED",
          userId: job.data.userId,
          content: `🔥 Maintained a ${job.data.streakDays}-day streak!`,
          metadata: {
            streakDays: job.data.streakDays,
          },
        });

        await createFeedEvent({
          type: "STREAK_MAINTAINED",
          userId: job.data.userId,
          message: `🔥 Maintained a ${job.data.streakDays}-day streak!`,
        });

        broadcastFeedEvent({
          type: "STREAK_MAINTAINED",
          userId: job.data.userId,
          content: `🔥 Maintained a ${job.data.streakDays}-day streak!`,
          metadata: { ...job.data },
        });
        break;

      case "resource.used":
        await feedService.createFeedItem({
          type: "RESOURCE_USED",
          userId: job.data.userId,
          content: `🔗 Used a resource: "${job.data.resourceName}"`,
          metadata: {
            resourceName: job.data.resourceName,
            resourceId: job.data.resourceId,
          },
        });

        await createFeedEvent({
          type: "RESOURCE_USED",
          userId: job.data.userId,
          message: `🔗 Used a resource: "${job.data.resourceName}"`,
        });

        broadcastFeedEvent({
          type: "RESOURCE_USED",
          userId: job.data.userId,
          content: `🔗 Used a resource: "${job.data.resourceName}"`,
          metadata: { ...job.data },
        });
        break;

      default:
        console.warn(`Unknown feed event type: ${job.name}`);
    }

    return { success: true, eventType: job.name };
  },
  {
    connection,
    concurrency: 5,
  }
);

feedWorker.on("completed", (job) => {
  console.log(`✅ Feed event processed: ${job.name} (${job.id})`);
});

feedWorker.on("failed", (job, err) => {
  console.error(`❌ Feed event failed: ${job?.name} (${job?.id})`, err.message);
});

console.log("🔄 Feed worker started");
