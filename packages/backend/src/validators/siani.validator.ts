import { z } from "zod";

// Accept either text or base64 audio; require at least one
export const sendMessageSchema = z
  .object({
    conversationId: z.string().optional(),
    text: z.string().trim().min(1).optional(),
    audioBase64: z.string().trim().min(1).optional(),
    audioMimeType: z.string().optional(),
    emotionHint: z.string().optional(),
  })
  .refine((data) => !!data.text || !!data.audioBase64, {
    message: "Provide either text or audioBase64",
    path: ["text"],
  });

export const historyQuerySchema = z.object({
  conversationId: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 50)),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
