import { z } from 'zod';

export const createReferralLoopSchema = z.object({
  userId: z.string().min(1),
  resource: z.string().min(1),
  status: z.string().min(1),
});

export const updateReferralLoopSchema = z
  .object({
    resource: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
