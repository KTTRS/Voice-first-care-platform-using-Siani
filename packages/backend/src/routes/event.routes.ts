/**
 * Event Routes
 *
 * REST API for the immutable event store.
 * Provides endpoints for writing and querying domain events.
 */

import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";
import { eventService } from "../services/event.service";
import { z } from "zod";

const router = Router();

// Validation schemas
const writeEventSchema = z.object({
  type: z.string().min(1),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  payload: z.any().optional(),
  tags: z.array(z.string()).optional(),
  correlationId: z.string().optional(),
  traceId: z.string().optional(),
});

const writeEventBatchSchema = z.object({
  events: z.array(writeEventSchema),
});

const queryParamsSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 100)),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

/**
 * POST /api/events
 * Write a single event to the event store
 */
router.post("/", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = writeEventSchema.parse(req.body);

    const event = await eventService.writeEvent({
      ...data,
      actorUserId: req.user!.id, // Authenticated user is the actor
    });

    res.status(201).json(event);
  } catch (error: any) {
    console.error("Error writing event:", error);
    res.status(400).json({ error: error.message || "Failed to write event" });
  }
});

/**
 * POST /api/events/batch
 * Write multiple events in a single transaction
 */
router.post("/batch", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { events } = writeEventBatchSchema.parse(req.body);

    // Add actor to all events
    const eventsWithActor = events.map((event) => ({
      ...event,
      actorUserId: req.user!.id,
    }));

    const createdEvents = await eventService.writeEventBatch(eventsWithActor);

    res
      .status(201)
      .json({ count: createdEvents.length, events: createdEvents });
  } catch (error: any) {
    console.error("Error writing event batch:", error);
    res
      .status(400)
      .json({ error: error.message || "Failed to write event batch" });
  }
});

/**
 * GET /api/events/type/:type
 * Get events by type
 */
router.get(
  "/type/:type",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { type } = req.params;
      const { limit } = queryParamsSchema.parse(req.query);

      const events = await eventService.getEventsByType(type, limit);

      res.json({ count: events.length, events });
    } catch (error: any) {
      console.error("Error fetching events by type:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to fetch events" });
    }
  }
);

/**
 * GET /api/events/actor/:actorUserId
 * Get events by actor (user who initiated the event)
 */
router.get(
  "/actor/:actorUserId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { actorUserId } = req.params;
      const { limit } = queryParamsSchema.parse(req.query);

      // Users can only see their own events unless they're ADMIN
      if (req.user!.role !== "ADMIN" && req.user!.id !== actorUserId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const events = await eventService.getEventsByActor(actorUserId, limit);

      res.json({ count: events.length, events });
    } catch (error: any) {
      console.error("Error fetching events by actor:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to fetch events" });
    }
  }
);

/**
 * GET /api/events/entity/:entityType/:entityId
 * Get all events for a specific entity (e.g., all events for a Referral)
 */
router.get(
  "/entity/:entityType/:entityId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { entityType, entityId } = req.params;
      const { limit } = queryParamsSchema.parse(req.query);

      const events = await eventService.getEventsByEntity(
        entityType,
        entityId,
        limit
      );

      res.json({ count: events.length, events });
    } catch (error: any) {
      console.error("Error fetching events by entity:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to fetch events" });
    }
  }
);

/**
 * GET /api/events/correlation/:correlationId
 * Get all events in a single transaction/session
 */
router.get(
  "/correlation/:correlationId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { correlationId } = req.params;
      const { limit } = queryParamsSchema.parse(req.query);

      const events = await eventService.getEventsByCorrelation(
        correlationId,
        limit
      );

      res.json({ count: events.length, events });
    } catch (error: any) {
      console.error("Error fetching events by correlation:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to fetch events" });
    }
  }
);

/**
 * GET /api/events/tag/:tag
 * Get events by compliance tag (HEDIS, STAR, CMS, etc.)
 */
router.get(
  "/tag/:tag",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tag } = req.params;
      const { limit } = queryParamsSchema.parse(req.query);

      // Only ADMIN can access compliance-tagged events
      if (req.user!.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied" });
      }

      const events = await eventService.getEventsByTag(tag, limit);

      res.json({ count: events.length, events });
    } catch (error: any) {
      console.error("Error fetching events by tag:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to fetch events" });
    }
  }
);

/**
 * GET /api/events/range
 * Get events within a time range
 */
router.get("/range", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, limit } = queryParamsSchema.parse(req.query);

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }

    const events = await eventService.getEventsByTimeRange(
      startDate,
      endDate,
      limit
    );

    res.json({ count: events.length, events });
  } catch (error: any) {
    console.error("Error fetching events by time range:", error);
    res.status(400).json({ error: error.message || "Failed to fetch events" });
  }
});

/**
 * GET /api/events/compliance
 * Get events for compliance reporting (HEDIS, STAR, CMS)
 * Requires ADMIN role
 */
router.get(
  "/compliance",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Only ADMIN can access compliance events
      if (req.user!.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { startDate, endDate } = queryParamsSchema.parse(req.query);
      const tags = req.query.tags
        ? String(req.query.tags).split(",")
        : ["HEDIS", "STAR", "CMS"];

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "startDate and endDate are required" });
      }

      const events = await eventService.getComplianceEvents(
        tags,
        startDate,
        endDate
      );

      res.json({ count: events.length, events, tags });
    } catch (error: any) {
      console.error("Error fetching compliance events:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to fetch compliance events" });
    }
  }
);

/**
 * GET /api/events/stats
 * Get event statistics (count by type)
 */
router.get("/stats", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate } = queryParamsSchema.parse(req.query);

    const stats = await eventService.getEventStats(startDate, endDate);

    res.json({ stats, period: { startDate, endDate } });
  } catch (error: any) {
    console.error("Error fetching event stats:", error);
    res
      .status(400)
      .json({ error: error.message || "Failed to fetch event stats" });
  }
});

export default router;
