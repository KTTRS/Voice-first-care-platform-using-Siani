import { Prisma, ReferralLoop } from '@prisma/client';
import prisma from '../utils/db';

export async function listReferralLoops(
  params?: { skip?: number; take?: number },
): Promise<ReferralLoop[]> {
  const { skip, take } = params || {};
  return prisma.referralLoop.findMany({ skip, take });
}

export async function getReferralLoopById(id: string): Promise<ReferralLoop | null> {
  return prisma.referralLoop.findUnique({ where: { id } });
}

export async function createReferralLoop(
  data: Prisma.ReferralLoopUncheckedCreateInput,
): Promise<ReferralLoop> {
  return prisma.referralLoop.create({ data });
}

export async function updateReferralLoop(
  id: string,
  data: Prisma.ReferralLoopUncheckedUpdateInput,
): Promise<ReferralLoop> {
  return prisma.referralLoop.update({ where: { id }, data });
}

export async function deleteReferralLoop(id: string): Promise<ReferralLoop> {
  return prisma.referralLoop.delete({ where: { id } });
}
