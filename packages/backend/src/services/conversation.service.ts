import prisma from "../utils/db";
import { EmotionState, MessageRole } from "@prisma/client";

export interface AppendMessageParams {
  conversationId: string;
  role: MessageRole;
  text: string;
  emotion?: EmotionState | null;
  audioUrl?: string | null;
  occurredAt?: Date;
}

export const conversationService = {
  async startConversation(userId: string) {
    return prisma.conversation.create({
      data: { userId },
    });
  },

  async getOrCreateConversation(userId: string, conversationId?: string) {
    if (conversationId) {
      const convo = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (!convo) throw new Error("Conversation not found or access denied");
      return convo;
    }
    // Create a new conversation if not provided
    return this.startConversation(userId);
  },

  async appendMessage(params: AppendMessageParams) {
    const { conversationId, role, text, emotion, audioUrl, occurredAt } =
      params;
    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        text,
        emotion: emotion ?? null,
        audioUrl: audioUrl ?? null,
        occurredAt: occurredAt ?? new Date(),
      },
    });

    // Touch conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  },

  async getHistory(conversationId: string, limit: number = 50) {
    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { occurredAt: "asc" },
          take: limit,
        },
      },
    });
    return convo;
  },

  async listUserConversations(userId: string, limit: number = 10) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  },
};
