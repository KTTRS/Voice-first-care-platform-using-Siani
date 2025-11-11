/**
 * Siani Conversation Routes
 *
 * Endpoints:
 * POST /api/siani/message - Send a message (text or voice) and get Siani's response
 * GET /api/siani/history/:conversationId - Get conversation history
 * GET /api/siani/conversations - List user's conversations
 */

import { Router } from "express";
import { sianiService } from "../services/siani.service";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";
import { sendMessageSchema } from "../validators/siani.validator";

const router = Router();

/**
 * POST /api/siani/message
 * Send a message to Siani (text or voice) and receive response
 */
router.post(
  "/message",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const data = sendMessageSchema.parse(req.body);
      const userId = req.user!.id;

      const reply = await sianiService.sendMessage({
        userId,
        conversationId: data.conversationId,
        text: data.text,
        audioBase64: data.audioBase64,
        audioMimeType: data.audioMimeType,
      });

      res.json(reply);
    } catch (error: any) {
      console.error("Error in /api/siani/message:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/siani/history/:conversationId
 * Retrieve conversation history
 */
router.get(
  "/history/:conversationId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const history = await sianiService.getHistory(
        userId,
        conversationId,
        limit
      );

      res.json(history);
    } catch (error: any) {
      console.error("Error in /api/siani/history:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/siani/conversations
 * List user's conversations
 */
router.get(
  "/conversations",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const conversations = await sianiService.listConversations(userId, limit);

      res.json(conversations);
    } catch (error: any) {
      console.error("Error in /api/siani/conversations:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
