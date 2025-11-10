import cron from "node-cron";
import {
  getEngagementsNeedingFollowUp,
  recordFollowUp,
  autoAbandonStaleEngagements,
} from "../../services/resourceEngagement.service";
import { generateFollowUpMessage } from "../../conversationHooks/sdohDetection";

/**
 * Daily scheduler for resource engagement follow-ups
 *
 * This scheduler:
 * 1. Checks for engagements that need follow-up (OFFERED or ACCEPTED status, 3+ days old)
 * 2. Generates natural follow-up messages
 * 3. Marks engagements as followed up
 * 4. Auto-abandons stale engagements (14+ days with no activity)
 */
export function scheduleResourceFollowUps() {
  // Run daily at 10:00 AM
  cron.schedule("0 10 * * *", async () => {
    console.log("[ResourceFollowUp] Running daily follow-up check...");

    try {
      // Get engagements needing follow-up (3+ days since last activity)
      const engagements = await getEngagementsNeedingFollowUp(3);

      console.log(
        `[ResourceFollowUp] Found ${engagements.length} engagements needing follow-up`
      );

      // Process each engagement
      for (const engagement of engagements) {
        try {
          // Generate follow-up message
          const followUpMessage = generateFollowUpMessage(engagement);

          if (followUpMessage) {
            // In production, this would:
            // 1. Send via Siani conversation system
            // 2. Send push notification to mobile app
            // 3. Create a pending message for next conversation
            //
            // For now, we'll just log it and mark as followed up
            console.log(
              `[ResourceFollowUp] Follow-up for user ${engagement.userId}:`,
              followUpMessage
            );

            // TODO: Integrate with your messaging system
            // await sendMessageToUser(engagement.userId, followUpMessage);
            // await sendPushNotification(engagement.userId, {
            //   title: 'Checking in',
            //   body: followUpMessage,
            //   data: { engagementId: engagement.id }
            // });

            // Record that we followed up
            await recordFollowUp(engagement.id);
          }
        } catch (error) {
          console.error(
            `[ResourceFollowUp] Error processing engagement ${engagement.id}:`,
            error
          );
        }
      }

      // Auto-abandon stale engagements (14+ days with no activity)
      console.log(
        "[ResourceFollowUp] Checking for stale engagements to abandon..."
      );
      const abandonResult = await autoAbandonStaleEngagements();
      console.log(
        `[ResourceFollowUp] Auto-abandoned ${abandonResult.total} stale engagements (${abandonResult.abandonedOffered} offered, ${abandonResult.abandonedAccepted} accepted)`
      );
    } catch (error) {
      console.error("[ResourceFollowUp] Error in follow-up scheduler:", error);
    }
  });

  console.log(
    "[ResourceFollowUp] Scheduler initialized - will run daily at 10:00 AM"
  );

  // For development: also run immediately if in dev mode
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[ResourceFollowUp] Running initial check in development mode..."
    );
    setTimeout(async () => {
      try {
        const engagements = await getEngagementsNeedingFollowUp(3);
        console.log(
          `[ResourceFollowUp] Development check: ${engagements.length} engagements need follow-up`
        );
      } catch (error) {
        console.error("[ResourceFollowUp] Development check failed:", error);
      }
    }, 5000); // Run after 5 seconds
  }
}

/**
 * Immediate follow-up check (for testing)
 * Run this manually to trigger follow-ups without waiting for the cron schedule
 */
export async function runFollowUpCheckNow() {
  console.log("[ResourceFollowUp] Running immediate follow-up check...");

  try {
    const engagements = await getEngagementsNeedingFollowUp(3);
    console.log(
      `[ResourceFollowUp] Found ${engagements.length} engagements needing follow-up`
    );

    for (const engagement of engagements) {
      const followUpMessage = generateFollowUpMessage(engagement);
      if (followUpMessage) {
        console.log(
          `[ResourceFollowUp] Would send to user ${engagement.userId}:`,
          followUpMessage
        );
        await recordFollowUp(engagement.id);
      }
    }

    const abandonResult = await autoAbandonStaleEngagements();
    console.log(
      `[ResourceFollowUp] Auto-abandoned ${abandonResult.total} stale engagements`
    );

    return {
      followedUp: engagements.length,
      abandoned: abandonResult.total,
    };
  } catch (error) {
    console.error("[ResourceFollowUp] Error in immediate check:", error);
    throw error;
  }
}
