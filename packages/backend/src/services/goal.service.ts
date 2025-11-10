import { Goal, Prisma } from "@prisma/client";
import prisma from "../utils/db";

export interface ListGoalsParams {
  skip?: number;
  take?: number;
  userId?: string;
  isActive?: boolean;
  search?: string;
}

export interface ListGoalsResult {
  data: Goal[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function listGoals(
  params?: ListGoalsParams
): Promise<ListGoalsResult> {
  const { skip = 0, take = 20, userId, isActive, search } = params || {};

  // Build where clause
  const where: Prisma.GoalWhereInput = {};

  if (userId) {
    where.userId = userId;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (search) {
    where.title = {
      contains: search,
      mode: "insensitive",
    };
  }

  // Get total count for pagination
  const total = await prisma.goal.count({ where });

  // Get goals
  const goals = await prisma.goal.findMany({
    where,
    include: { dailyActions: true },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

  // Calculate pagination metadata
  const page = Math.floor(skip / take) + 1;
  const pageSize = take;
  const totalPages = Math.ceil(total / take);

  return {
    data: goals,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

export async function getGoalById(id: string): Promise<Goal | null> {
  return prisma.goal.findUnique({
    where: { id },
    include: { dailyActions: true },
  });
}

export async function createGoal(
  data: Prisma.GoalUncheckedCreateInput
): Promise<Goal> {
  return prisma.goal.create({ data });
}

export async function updateGoal(
  id: string,
  data: Prisma.GoalUncheckedUpdateInput
): Promise<Goal> {
  return prisma.goal.update({ where: { id }, data });
}

export async function deleteGoal(id: string): Promise<Goal> {
  return prisma.goal.delete({ where: { id } });
}
