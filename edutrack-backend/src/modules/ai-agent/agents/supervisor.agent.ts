// src/modules/ai-agent/agents/supervisor.agent.ts
/**
 * SupervisorAgent
 * ─────────────────────────────────────────────────────────────────────────────
 * Phân loại intent của câu hỏi người dùng thành:
 *   - ACADEMIC    : câu hỏi về điểm số, học tập, lộ trình học
 *   - PSYCHOLOGY  : câu hỏi về tâm lý, stress, cảm xúc
 *   - GENERAL     : chào hỏi, hội thoại thông thường
 *
 * Được thiết kế theo pattern LangGraph StateGraph để dễ mở rộng.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type Intent = 'ACADEMIC' | 'PSYCHOLOGY' | 'GENERAL';

export interface IntentResult {
  intent: Intent;
  confidence: { academic: number; psychology: number; general: number };
  reasoning: string;
}

const CLASSIFY_PROMPT = `
Bạn là Supervisor Agent của hệ thống hỗ trợ học sinh. Nhiệm vụ của bạn là phân loại câu hỏi.

Phân loại vào đúng MỘT trong các nhóm sau:
- ACADEMIC: Liên quan đến điểm số, môn học, thi cử, kiến thức, phương pháp học, lộ trình học tập, bảng điểm.
- PSYCHOLOGY: Liên quan đến cảm xúc, stress, lo lắng, áp lực thi cử, sức khỏe tâm thần, động lực, mệt mỏi.
- GENERAL: Chào hỏi, hội thoại thông thường, không thuộc 2 nhóm trên.

Hãy trả về JSON:
{
  "intent": "ACADEMIC|PSYCHOLOGY|GENERAL",
  "confidence": {
    "academic": 0.0,
    "psychology": 0.0,
    "general": 0.0
  },
  "reasoning": "Lý do ngắn gọn (1 câu)"
}

Chỉ trả JSON thuần, không thêm gì khác.
`;

@Injectable()
export class SupervisorAgent {
  private readonly logger = new Logger(SupervisorAgent.name);
  private readonly gemini: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    this.gemini = new GoogleGenerativeAI(
      this.config.getOrThrow('GEMINI_API_KEY'),
    );
  }

  async classify(userMessage: string): Promise<IntentResult> {
    try {
      const model = this.gemini.getGenerativeModel({
        model: 'gemini-1.5-flash', // Flash đủ nhanh cho classification
        generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
      });

      const result = await model.generateContent([
        CLASSIFY_PROMPT,
        `Câu hỏi của người dùng: "${userMessage}"`,
      ]);

      const raw = result.response
        .text()
        .trim()
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/i, '')
        .trim();

      const parsed = JSON.parse(raw) as IntentResult;
      this.logger.debug(
        `Intent: ${parsed.intent} (${JSON.stringify(parsed.confidence)})`,
      );
      return parsed;
    } catch (err) {
      this.logger.warn(`Supervisor classify lỗi, fallback GENERAL: ${err}`);
      return {
        intent: 'GENERAL',
        confidence: { academic: 0, psychology: 0, general: 1 },
        reasoning: 'Fallback do lỗi phân loại.',
      };
    }
  }
}
