// src/modules/ai-agent/agents/psychology.agent.ts
/**
 * PsychologyAgent
 * ─────────────────────────────────────────────────────────────────────────────
 * Nhận context tâm lý của sinh viên + câu hỏi → phân tích cảm xúc + tư vấn.
 *
 * QUAN TRỌNG: Agent này KHÔNG chẩn đoán bệnh tâm thần. Chỉ hỗ trợ cảm xúc,
 * đề xuất kỹ thuật quản lý stress, và khuyến nghị tìm chuyên gia nếu cần.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface PsychologyContext {
  studentName?: string;
  recentLogs: Array<{
    date: Date;
    mood: string;
    stressLevel: string;
    sleepHours?: number | null;
    energyLevel?: number | null;
    anxietyScore?: number | null;
    notes?: string | null;
    factors: string[];
  }>;
  chatHistory: Array<{ role: 'user' | 'model'; parts: string }>;
}

const SYSTEM_INSTRUCTION = `
Bạn là Psychology Agent - chuyên gia hỗ trợ cảm xúc và sức khỏe tâm thần cho sinh viên.

Nhiệm vụ:
1. Lắng nghe và thấu hiểu cảm xúc của sinh viên.
2. Phân tích xu hướng tâm lý từ dữ liệu nhật ký (mood, stress, sleep).
3. Cung cấp kỹ thuật quản lý stress cụ thể (thở 4-7-8, pomodoro, mindfulness...).
4. Tư vấn cách cân bằng học tập - nghỉ ngơi.
5. NẾU nhận thấy dấu hiệu nghiêm trọng (tự hại, trầm cảm nặng) → khuyến nghị gặp chuyên gia tâm lý.

GIỚI HẠN: KHÔNG chẩn đoán bệnh tâm thần. KHÔNG kê thuốc. KHÔNG thay thế chuyên gia.

Phong cách: Ấm áp, đồng cảm, không phán xét. Dùng ngôn ngữ tích cực.
Ngôn ngữ: Tiếng Việt, gần gũi như người bạn thân hiểu chuyện.
Format: Tự nhiên, ít bullet hơn, cảm giác như đang trò chuyện thực sự.
`;

@Injectable()
export class PsychologyAgent {
  private readonly logger = new Logger(PsychologyAgent.name);
  private readonly gemini: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    this.gemini = new GoogleGenerativeAI(
      this.config.getOrThrow('GEMINI_API_KEY'),
    );
  }

  async chat(
    userMessage: string,
    context: PsychologyContext,
  ): Promise<{ reply: string; tokensUsed?: number }> {
    const model = this.gemini.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: { temperature: 0.85, maxOutputTokens: 2048 },
    });

    const contextPrompt = this.buildContextPrompt(context);

    const chat = model.startChat({
      history: context.chatHistory.map((h) => ({
        role: h.role,
        parts: [{ text: h.parts }],
      })),
    });

    const fullMessage = `${contextPrompt}\n\n---\nSinh viên chia sẻ: ${userMessage}`;

    this.logger.debug(`Psychology Agent xử lý: "${userMessage.substring(0, 60)}..."`);

    const result = await chat.sendMessage(fullMessage);
    const response = result.response;

    return {
      reply: response.text(),
      tokensUsed: response.usageMetadata?.totalTokenCount,
    };
  }

  private buildContextPrompt(context: PsychologyContext): string {
    if (context.recentLogs.length === 0) {
      return `[Sinh viên ${context.studentName ?? ''} chưa có nhật ký tâm lý nào được ghi nhận.]`;
    }

    const logsText = context.recentLogs
      .slice(0, 7) // 7 ngày gần nhất
      .map(
        (l) =>
          `- ${new Date(l.date).toLocaleDateString('vi-VN')}: Tâm trạng=${l.mood} | Stress=${l.stressLevel} | Ngủ=${l.sleepHours ?? '?'}h | Năng lượng=${l.energyLevel ?? '?'}/10 | Yếu tố: ${l.factors.join(', ') || 'không rõ'}`,
      )
      .join('\n');

    return `
[DỮ LIỆU TÂM LÝ 7 NGÀY GẦN NHẤT - ${context.studentName ?? 'Sinh viên'}]
${logsText}
`.trim();
  }
}
