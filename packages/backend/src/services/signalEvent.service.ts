import { Prisma, SignalEvent } from '@prisma/client';
import prisma from '../utils/db';

export async function listSignalEvents(
  params?: { skip?: number; take?: number },
): Promise<SignalEvent[]> {
  const { skip, take } = params || {};
  return prisma.signalEvent.findMany({ skip, take });
}

export async function getSignalEventById(id: string): Promise<SignalEvent | null> {
  return prisma.signalEvent.findUnique({ where: { id } });
}

export async function createSignalEvent(
  data: Prisma.SignalEventUncheckedCreateInput,
): Promise<SignalEvent> {
  return prisma.signalEvent.create({ data });
}

export async function updateSignalEvent(
  id: string,
  data: Prisma.SignalEventUncheckedUpdateInput,
): Promise<SignalEvent> {
  return prisma.signalEvent.update({ where: { id }, data });
}

export async function deleteSignalEvent(id: string): Promise<SignalEvent> {
  return prisma.signalEvent.delete({ where: { id } });
}
