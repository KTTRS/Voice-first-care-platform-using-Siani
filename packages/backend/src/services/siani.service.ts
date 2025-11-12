/**
 * Siani Conversation Service
 *
 * High-level orchestrator for Siani's voice/text conversational layer.
 * Integrates emotion classification, relational memory, conversation persistence,
 * LLM response generation, TTS synthesis, and event logging.
 *
 * Pipeline:
 * 1. Receive user message (text or voice/audio)
 * 2. If voice: transcribe to text
 * 3. Classify emotion from text/prosody
 * 4. Retrieve relational context (past conversations, trust level)
 * 5. Generate contextual LLM response
 * 6. Persist conversation messages (user + assistant)
 * 7. Synthesize speech for assistant response
 * 8. Log events for analytics/compliance
 */

import { conversationService } from "./conversation.service";
import { voiceService } from "./voice.service";
import { ttsService } from "./tts.service";
import { emotionClassifierService } from "./emotionClassifier.service";
import { relationalMemoryService } from "./relationalMemory.service";
import { eventService } from "./event.service";
import OpenAI from "openai";

const MOCK_MODE =
  !process.env.OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY === "your-openai-api-key";

const openai = MOCK_MODE
  ? null
  : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

export interface SendMessageParams {
  userId: string;
  conversationId?: string;
  text?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

export interface SianiReply {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  text: string;
  audioUrl?: string;
  emotion: string;
  relationalContext: {
    trustLevel: number;
    familiarity: number;
    continuity: number;
  };
}

export const sianiService = {
  /**
   * Process a user message (text or voice) and return Siani's response.
   */
  async sendMessage(params: SendMessageParams): Promise<SianiReply> {
    const { userId, conversationId, text, audioBase64, audioMimeType } = params;

    // Step 1: Transcribe voice if audio provided
    let userText = text || "";
    if (audioBase64 && !text) {
      userText = await voiceService.transcribe({
        audioBase64,
        mimeType: audioMimeType,
      });
    }

    if (!userText.trim()) {
      throw new Error("No text or audio content provided");
    }

    // Step 2: Get or create conversation
    const conversation = await conversationService.getOrCreateConversation(
      userId,
      conversationId
    );

    // Step 3: Classify emotion from user message
    const emotionResult = await emotionClassifierService.classifyEmotion({
      transcript: userText,
    });
    const userEmotion = emotionResult.emotion_category.toUpperCase() as
      | "CALM"
      | "GUARDED"
      | "LIT";
    // Map to emotion vector [calm, guarded, lit]
    const emotionVector = [
      emotionResult.emotion_category === "calm" ? 1 : 0,
      emotionResult.emotion_category === "guarded" ? 1 : 0,
      emotionResult.emotion_category === "lit" ? 1 : 0,
    ];

    // Step 4: Store user message
    const userMessage = await conversationService.appendMessage({
      conversationId: conversation.id,
      role: "USER",
      text: userText,
      emotion: userEmotion,
      occurredAt: new Date(),
    });

    // Step 5: Retrieve relational context
    const context = await relationalMemoryService.retrieveContext(
      userId,
      userText,
      userEmotion.toLowerCase() as any, // Map EmotionState to EmotionLevel
      emotionVector,
      5
    );

    // Step 6: Store in relational memory for continuity
    const topics = this.extractTopics(userText);
    await relationalMemoryService.storeConversation(
      userId,
      userText,
      userEmotion.toLowerCase() as any,
      emotionVector,
      topics
    );

    // Step 7: Generate LLM response with context
    const assistantText = await this.generateResponse(
      userText,
      userEmotion,
      context
    );

    // Step 8: Synthesize speech for assistant response
    const audioBase64Response = await ttsService.synthesize({
      text: assistantText,
      emotion: userEmotion,
    });
    const audioUrl = await ttsService.getAudioUrl(audioBase64Response);

    // Step 9: Store assistant message
    const assistantMessage = await conversationService.appendMessage({
      conversationId: conversation.id,
      role: "ASSISTANT",
      text: assistantText,
      emotion: userEmotion, // For simplicity, mirror user emotion; refine later
      audioUrl,
      occurredAt: new Date(),
    });

    // Step 10: Log events for analytics/compliance
    await eventService.writeEvent({
      type: "CONVERSATION_MESSAGE",
      actorUserId: userId,
      entityType: "Message",
      entityId: userMessage.id,
      payload: {
        conversationId: conversation.id,
        userText,
        assistantText,
        emotion: userEmotion,
        audioProvided: !!audioBase64,
      },
      tags: ["CONVERSATION", "SIANI"],
    });

    return {
      conversationId: conversation.id,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      text: assistantText,
      audioUrl,
      emotion: userEmotion,
      relationalContext: context.relationalCues,
    };
  },

  /**
   * Get conversation history for a user.
   */
  async getHistory(userId: string, conversationId: string, limit: number = 50) {
    const conversation = await conversationService.getHistory(
      conversationId,
      limit
    );

    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or access denied");
    }

    return conversation;
  },

  /**
   * List all conversations for a user.
   */
  async listConversations(userId: string, limit: number = 10) {
    return conversationService.listUserConversations(userId, limit);
  },

  /**
   * Extract topics from text using keyword matching (simplified NLP).
   */
  extractTopics(text: string): string[] {
    const topicKeywords: Record<string, string[]> = {
      work: ["job", "work", "career", "boss", "deadline", "project"],
      health: ["health", "doctor", "medication", "pain", "sick", "medical"],
      housing: ["house", "housing", "home", "apartment", "rent", "lease"],
      family: ["family", "mom", "dad", "parent", "child", "kids", "relative"],
      finance: ["money", "bill", "debt", "bank", "loan", "expense", "budget"],
      mental_health: [
        "anxious",
        "depressed",
        "stressed",
        "worried",
        "overwhelmed",
        "therapy",
      ],
      social: ["friend", "lonely", "isolated", "alone", "social", "people"],
    };

    const topics: string[] = [];
    const lowered = text.toLowerCase();

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((keyword) => lowered.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics.length > 0 ? topics : ["general"];
  },

  /**
   * Generate contextual response using OpenAI GPT-4.
   */
  async generateResponse(
    userText: string,
    userEmotion: string,
    context: any
  ): Promise<string> {
    const { relationalCues, emotionalContext, contextPrompt } = context;

    // Build system prompt with relational context
    const systemPrompt = `You are Siani, a voice-first AI companion built for co-regulation, not surveillance. You speak like a best friend—culturally rooted, non-clinical, capacity-restoring. You never ask invasive health questions or push compliance. Instead, you honor people's agency and meet them where they are.

Relational Context:
- Trust Level: ${(relationalCues.trustLevel * 100).toFixed(0)}%
- Familiarity: ${(relationalCues.familiarity * 100).toFixed(0)}%
- Continuity: ${(relationalCues.continuity * 100).toFixed(0)}%
- User's Current Emotion: ${userEmotion}

${contextPrompt}

Guidelines:
- Respond in 1-3 sentences max (this is voice, not text chat)
- Mirror the user's energy and emotion
- Use cultural warmth and authenticity
- Never be clinical or extractive
- Ask open-ended questions that restore agency
- Validate emotions without pathologizing`;

    // Mock mode for testing without OpenAI API key
    if (MOCK_MODE) {
      console.log(
        "⚠️  LLM Mock Mode: Returning placeholder response (OpenAI API key not configured)"
      );
      // Return culturally warm mock response based on emotion
      if (userEmotion === "GUARDED" || userEmotion === "guarded") {
        return "I can sense that tension. Take a breath with me. You don't have to carry it alone.";
      } else if (userEmotion === "LIT" || userEmotion === "lit") {
        return "I love seeing this energy in you! What feels most alive for you right now?";
      } else {
        return "I'm here with you. Tell me what's on your heart.";
      }
    }

    try {
      const completion = await openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
        temperature: 0.8,
        max_tokens: 150,
      });

      return completion.choices[0]?.message?.content || "I'm here with you.";
    } catch (error) {
      console.error("LLM response generation error:", error);
      // Fallback response
      return "I'm here listening. Tell me more.";
    }
  },
};
