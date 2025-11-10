import { DailyAction, Prisma } from '@prisma/client';
import prisma from '../utils/db';

export async function listDailyActions(
  params?: { skip?: number; take?: number },
): Promise<DailyAction[]> {
  const { skip, take } = params || {};
  return prisma.dailyAction.findMany({ skip, take });
}

export async function getDailyActionById(id: string): Promise<DailyAction | null> {
  return prisma.dailyAction.findUnique({ where: { id } });
}

export async function createDailyAction(
  data: Prisma.DailyActionUncheckedCreateInput,
): Promise<DailyAction> {
  return prisma.dailyAction.create({ data });
}

export async function updateDailyAction(
  id: string,
  data: Prisma.DailyActionUncheckedUpdateInput,
): Promise<DailyAction> {
  return prisma.dailyAction.update({ where: { id }, data });
}

export async function deleteDailyAction(id: string): Promise<DailyAction> {
  return prisma.dailyAction.delete({ where: { id } });
}
