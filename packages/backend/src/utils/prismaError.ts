import { Prisma } from '@prisma/client';
import { NextFunction, Response } from 'express';

export function handlePrismaError(
  error: unknown,
  res: Response,
  next: NextFunction,
  notFoundMessage: string,
) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return res.status(404).json({ error: notFoundMessage });
  }

  return next(error);
}
