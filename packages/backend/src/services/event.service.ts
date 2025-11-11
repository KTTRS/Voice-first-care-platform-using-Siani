/**
 * Event Service
 *
 * Immutable event store for foundational event-sourcing bridge.
 * Captures all domain events (check_in, referral_initiated, signal_scored, memory_created, etc.)
 * Append-only: never update, only create. Use timestamp ordering for reconstruction.
 */

import prisma from "../utils/db";

export interface EventData {
  type: string; // e.g., CHECK_IN, REFERRAL_INITIATED, SIGNAL_SCORED, MEMORY_CREATED
  actorUserId?: string; // user initiating (nullable for system events)
  entityType?: string; // e.g., "Referral", "Signal", "MemoryMoment"
  entityId?: string; // ID of the entity affected
  payload?: any; // Arbitrary payload (must be redacted before insert)
  tags?: string[]; // Compliance & classification tags (HEDIS, STAR, CMS, SDOH, PRIVACY)
  correlationId?: string; // For grouping events in a single logical transaction/session
  traceId?: string; // For distributed tracing (future use)
  schemaVersion?: number; // Version for evolution of event structure
}

/**
 * Event Service
 * Provides methods to write immutable events to the event store
 */
export class EventService {
  /**
   * Write an event to the event store
   * Events are immutable and append-only
   */
  async writeEvent(data: EventData): Promise<any> {
    try {
      const event = await prisma.event.create({
        data: {
          type: data.type,
          actorUserId: data.actorUserId,
          entityType: data.entityType,
          entityId: data.entityId,
          payload: data.payload || {},
          tags: data.tags || [],
          correlationId: data.correlationId || "",
          traceId: data.traceId || "",
          schemaVersion: data.schemaVersion || 1,
        },
      });

      console.log(`✅ Event written: ${data.type} (ID: ${event.id})`);
      return event;
    } catch (error) {
      console.error(`❌ Failed to write event (${data.type}):`, error);
      throw error;
    }
  }

  /**
   * Write multiple events in a batch (single transaction)
   */
  async writeEventBatch(events: EventData[]): Promise<any[]> {
    try {
      const createdEvents = await prisma.$transaction(
        events.map((data) =>
          prisma.event.create({
            data: {
              type: data.type,
              actorUserId: data.actorUserId,
              entityType: data.entityType,
              entityId: data.entityId,
              payload: data.payload || {},
              tags: data.tags || [],
              correlationId: data.correlationId || "",
              traceId: data.traceId || "",
              schemaVersion: data.schemaVersion || 1,
            },
          })
        )
      );

      console.log(`✅ Batch of ${events.length} events written`);
      return createdEvents;
    } catch (error) {
      console.error(`❌ Failed to write event batch:`, error);
      throw error;
    }
  }

  /**
   * Get events by type
   */
  async getEventsByType(type: string, limit: number = 100): Promise<any[]> {
    return prisma.event.findMany({
      where: { type },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get events by actor (user)
   */
  async getEventsByActor(
    actorUserId: string,
    limit: number = 100
  ): Promise<any[]> {
    return prisma.event.findMany({
      where: { actorUserId },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get events by entity (e.g., all events for a specific Referral)
   */
  async getEventsByEntity(
    entityType: string,
    entityId: string,
    limit: number = 100
  ): Promise<any[]> {
    return prisma.event.findMany({
      where: { entityType, entityId },
      orderBy: { occurredAt: "asc" }, // Chronological order for entity history
      take: limit,
    });
  }

  /**
   * Get events by correlation ID (all events in a single transaction/session)
   */
  async getEventsByCorrelation(
    correlationId: string,
    limit: number = 100
  ): Promise<any[]> {
    return prisma.event.findMany({
      where: { correlationId },
      orderBy: { occurredAt: "asc" },
      take: limit,
    });
  }

  /**
   * Get events by compliance tags (e.g., all HEDIS-tagged events)
   */
  async getEventsByTag(tag: string, limit: number = 100): Promise<any[]> {
    return prisma.event.findMany({
      where: {
        tags: {
          has: tag,
        },
      },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get all events in a time range
   */
  async getEventsByTimeRange(
    startDate: Date,
    endDate: Date,
    limit: number = 1000
  ): Promise<any[]> {
    return prisma.event.findMany({
      where: {
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { occurredAt: "asc" },
      take: limit,
    });
  }

  /**
   * Compliance-specific: Get all events for audit/export
   * Filters by tags (HEDIS, STAR, CMS, etc.)
   */
  async getComplianceEvents(
    tags: string[],
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    return prisma.event.findMany({
      where: {
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
        tags: {
          hasSome: tags,
        },
      },
      orderBy: { occurredAt: "asc" },
    });
  }

  /**
   * Get event statistics (count by type)
   */
  async getEventStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, number>> {
    const where: any = {};
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = startDate;
      if (endDate) where.occurredAt.lte = endDate;
    }

    const events = await prisma.event.findMany({
      where,
      select: { type: true },
    });

    const stats: Record<string, number> = {};
    events.forEach((event) => {
      stats[event.type] = (stats[event.type] || 0) + 1;
    });

    return stats;
  }
}

export const eventService = new EventService();
