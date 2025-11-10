import { z } from 'zod';

export const createSignalEventSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  delta: z.number(),
});

export const updateSignalEventSchema = z
  .object({
    type: z.string().min(1).optional(),
    delta: z.number().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
