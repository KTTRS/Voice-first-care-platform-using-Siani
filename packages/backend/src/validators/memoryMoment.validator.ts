import { z } from 'zod';

const baseSchema = {
  userId: z.string().min(1),
  content: z.string().min(1),
  emotion: z.string().min(1),
  tone: z.string().min(1),
  vectorId: z.string().min(1),
};

export const createMemoryMomentSchema = z.object(baseSchema);

export const updateMemoryMomentSchema = z
  .object({
    content: z.string().min(1).optional(),
    emotion: z.string().min(1).optional(),
    tone: z.string().min(1).optional(),
    vectorId: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
