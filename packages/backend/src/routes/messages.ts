import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";
import { runSDOHDetection } from "../conversationHooks/sdohDetection";

const router = Router();

/**
 * POST /api/messages
 * Process user messages with SDOH detection
 * This endpoint should be called by Siani voice interface or chat client
 *
 * Body:
 * - message: string - The user's message text
 * - conversationId: string (optional) - For tracking conversation context
 */
router.post("/", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Run SDOH detection on the message
    const sdohResults = await runSDOHDetection(userId, message);

    // Here you would also:
    // 1. Process the message through your main conversation handler
    // 2. Generate Siani's response
    // 3. Store the conversation in memory
    //
    // For now, we'll return a simple response with SDOH detection results

    // Extract offer message if any needs should be offered
    const offerMessage = sdohResults.detectedNeeds.find(
      (n) => n.shouldOffer
    )?.offerMessage;

    const response = {
      // This would be Siani's actual response from your AI/conversation engine
      reply: offerMessage || generateSimpleResponse(sdohResults),

      // SDOH detection results for mobile app
      sdoh: {
        detectedNeeds: sdohResults.detectedNeeds,
        newEngagements: sdohResults.newEngagements,
        hasNewOffers: sdohResults.newEngagements.length > 0,
      },

      // Metadata
      conversationId,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Helper to generate a simple response based on SDOH detection
 * In production, this would be replaced by your actual Siani conversation engine
 */
function generateSimpleResponse(sdohResults: any): string {
  // Generic acknowledgment
  return "I'm here listening. Keep talking — I'm always ready to help.";
}

/**
 * GET /api/messages/pending-engagements
 * Get pending resource engagements that need follow-up
 * Used by Siani to proactively bring up resources in conversation
 */
router.get(
  "/pending-engagements",
  authenticate,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { getPendingEngagementsForUser } = await import(
        "../conversationHooks/sdohDetection"
      );
      const pendingEngagements = await getPendingEngagementsForUser(userId);

      res.json({
        engagements: pendingEngagements,
        count: pendingEngagements.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
