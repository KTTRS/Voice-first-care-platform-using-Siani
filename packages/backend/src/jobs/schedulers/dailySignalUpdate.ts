import cron from "node-cron";
import prisma from "../../utils/db";
import { processUserSignal } from "../../services/signalEngine.service";
import { triggerBulkSignalUpdate } from "../queues/signalQueue";

/**
 * Daily Signal Score Update Job
 * Runs every day at midnight to update all user signal scores
 */
export function scheduleDailySignalUpdate() {
  // Run at midnight every day
  cron.schedule("0 0 * * *", async () => {
    console.log("🧠 Starting daily signal score update...");

    try {
      // Get all active users (patients)
      const users = await prisma.user.findMany({
        where: {
          role: "PATIENT",
        },
        select: {
          id: true,
          email: true,
        },
      });

      console.log(
        `📊 Queueing signal score updates for ${users.length} users...`
      );

      const userIds = users.map((u) => u.id);

      // Queue all updates via BullMQ for parallel processing
      await triggerBulkSignalUpdate(userIds, "daily_batch_update");

      console.log(
        `✅ Daily signal score update queued for ${users.length} users (processing in background)`
      );
    } catch (error) {
      console.error("❌ Failed to queue daily signal score updates:", error);
    }
  });

  console.log("📅 Daily signal score update scheduled (midnight daily)");

  // For development: also run 30 seconds after startup
  if (process.env.NODE_ENV === "development") {
    setTimeout(async () => {
      console.log("🧪 Running initial signal score update (dev mode)...");
      try {
        const users = await prisma.user.findMany({
          where: { role: "PATIENT" },
          select: { id: true },
          take: 5, // Only process first 5 users in dev mode
        });

        const userIds = users.map((u) => u.id);
        await triggerBulkSignalUpdate(userIds, "dev_mode_initial_update");

        console.log(
          `✅ Initial signal score update queued for ${users.length} users`
        );
      } catch (error) {
        console.error("❌ Initial signal score update failed:", error);
      }
    }, 30000); // 30 seconds after startup
  }
}
