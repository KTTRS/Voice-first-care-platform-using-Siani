import prisma from "../utils/db";
import { FeedEvent } from "@prisma/client";

export async function createFeedEvent({
  type,
  userId,
  goalId,
  message,
}: {
  type: string;
  userId: string;
  goalId?: string;
  message: string;
}): Promise<FeedEvent> {
  return prisma.feedEvent.create({
    data: {
      type,
      userId,
      goalId,
      message,
    },
  });
}

export async function getFeedEvents({
  page = 1,
  pageSize = 10,
  userId,
}: {
  page?: number;
  pageSize?: number;
  userId?: string;
} = {}) {
  const skip = (page - 1) * pageSize;
  const where = userId ? { userId } : {};

  const [events, total] = await Promise.all([
    prisma.feedEvent.findMany({
      skip,
      take: pageSize,
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, id: true } },
        goal: { select: { title: true, points: true } },
      },
    }),
    prisma.feedEvent.count({ where }),
  ]);

  return {
    events,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
