import { z } from "zod";

export const createGoalSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  points: z.number(),
  isActive: z.boolean().optional(),
});

export const updateGoalSchema = z
  .object({
    title: z.string().min(1).optional(),
    points: z.number().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const queryGoalsSchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  userId: z.string().optional(),
  isActive: z.string().optional(),
  search: z.string().optional(),
});
