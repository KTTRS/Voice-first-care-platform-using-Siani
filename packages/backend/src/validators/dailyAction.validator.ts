import { z } from 'zod';

export const createDailyActionSchema = z.object({
  userId: z.string().min(1),
  goalId: z.string().min(1).optional().nullable(),
  content: z.string().min(1),
  points: z.number(),
  completed: z.boolean().optional(),
});

export const updateDailyActionSchema = z
  .object({
    goalId: z.string().min(1).optional().nullable(),
    content: z.string().min(1).optional(),
    points: z.number().optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
