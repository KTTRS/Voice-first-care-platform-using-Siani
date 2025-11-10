import cron from "node-cron";
import { streakService } from "../../services/streak.service";

/**
 * Daily Streak Check Scheduler
 * Runs every day at 11:59 PM to check and update user streaks
 */
export function scheduleDailyStreakCheck() {
  // Run at 11:59 PM every day (just before day ends)
  const schedule = "59 23 * * *"; // minute hour day month weekday

  console.log("⏰ Scheduling daily streak check for 11:59 PM...");

  cron.schedule(schedule, async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔥 Daily Streak Check Started: ${timestamp}`);
    console.log("=".repeat(60));

    try {
      await streakService.checkAllUserStreaks();
      console.log("✅ Daily streak check completed successfully");
    } catch (error) {
      console.error("❌ Daily streak check failed:", error);
    }

    console.log("=".repeat(60) + "\n");
  });

  console.log("✅ Daily streak check scheduled successfully");
  console.log("   Schedule: Every day at 11:59 PM");
  console.log("   Next run: Today at 23:59");

  // Optional: Run an immediate check on startup (for testing)
  if (process.env.NODE_ENV === "development") {
    console.log("\n🧪 Running initial streak check (development mode)...");
    setTimeout(async () => {
      try {
        await streakService.checkAllUserStreaks();
        console.log("✅ Initial streak check completed");
      } catch (error) {
        console.error("❌ Initial streak check failed:", error);
      }
    }, 5000); // Wait 5 seconds after startup
  }
}

/**
 * Manual trigger for streak check (useful for testing)
 */
export async function triggerStreakCheckNow() {
  console.log("🔥 Manual streak check triggered");
  await streakService.checkAllUserStreaks();
}
