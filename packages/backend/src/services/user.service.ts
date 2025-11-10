import { Prisma, User } from '@prisma/client';
import prisma from '../utils/db';
import { reminderQueue } from '../jobs/queues';

export async function listUsers(params?: { skip?: number; take?: number }): Promise<User[]> {
  const { skip, take } = params || {};
  return prisma.user.findMany({ skip, take });
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: Prisma.UserCreateInput): Promise<User> {
  const user = await prisma.user.create({ data });
  await reminderQueue.add('sendReminder', { userId: user.id });
  return user;
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
  return prisma.user.update({ where: { id }, data });
}

export async function deleteUser(id: string): Promise<User> {
  return prisma.user.delete({ where: { id } });
}
