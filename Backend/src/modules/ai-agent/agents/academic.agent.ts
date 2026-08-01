// src/modules/ai-agent/agents/academic.agent.ts
/**
 * AcademicAgent
 * ─────────────────────────────────────────────────────────────────────────────
 * Nhận context học tập của sinh viên + câu hỏi → phân tích + tư vấn học tập.
 *
 * Context được inject:
 *   - Danh sách điểm hiện tại (từ DB)
 *   - Thống kê GPA, tín chỉ
 *   - Lịch sử chat session
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AcademicContext {
  studentName?: string;
  grades: Array<{
    courseName: string;
    courseCode: string;
    totalScore?: number | null;
    gpa?: number | null;
    letterGrade?: string | null;
    status: string;
    semester: string;
  }>;
  cumulativeGpa?: number;
  earnedCredits?: number;
  chatHistory: Array<{ role: 'user' | 'model'; parts: string }>;
}

const SYSTEM_INSTRUCTION = `
Bạn là Academic Agent - chuyên gia tư vấn học tập cho sinh viên.

Nhiệm vụ:
1. Phân tích kết quả học tập dựa trên dữ liệu điểm số được cung cấp.
2. Xác định lỗ hổng kiến thức (môn điểm thấp, môn cần retake).
3. Gợi ý lộ trình cải thiện cụ thể, có thứ tự ưu tiên.
4. Tư vấn phương pháp học tập phù hợp từng môn.
5. Đưa ra dự báo GPA nếu sinh viên cải thiện các môn cụ thể.

Phong cách: Chuyên nghiệp, khuyến khích, dùng dữ liệu thực tế để lập luận.
Ngôn ngữ: Tiếng Việt, thân thiện nhưng súc tích.
Format: Dùng markdown (bullet, bold) để dễ đọc.
`;

@Injectable()
export class AcademicAgent {
  private readonly logger = new Logger(AcademicAgent.name);
  private readonly gemini: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    this.gemini = new GoogleGenerativeAI(
      this.config.getOrThrow('GEMINI_API_KEY'),
    );
  }

  async chat(
    userMessage: string,
    context: AcademicContext,
  ): Promise<{ reply: string; tokensUsed?: number }> {
    const model = this.gemini.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    });

    // Build context prompt
    const contextPrompt = this.buildContextPrompt(context);

    // Reconstruct chat history
    const chat = model.startChat({
      history: context.chatHistory.map((h) => ({
        role: h.role,
        parts: [{ text: h.parts }],
      })),
    });

    const fullMessage = `${contextPrompt}\n\n---\nCâu hỏi của sinh viên: ${userMessage}`;

    this.logger.debug(`Academic Agent xử lý: "${userMessage.substring(0, 60)}..."`);

    const result = await chat.sendMessage(fullMessage);
    const response = result.response;

    return {
      reply: response.text(),
      tokensUsed: response.usageMetadata?.totalTokenCount,
    };
  }

  private buildContextPrompt(context: AcademicContext): string {
    const gradesText = context.grades
      .map(
        (g) =>
          `- ${g.courseName} (${g.courseCode}): ${g.totalScore ?? 'N/A'}/10 | GPA: ${g.gpa ?? 'N/A'} | ${g.letterGrade ?? ''} | ${g.status}`,
      )
      .join('\n');

    return `
[DỮ LIỆU HỌC TẬP CỦA SINH VIÊN]
Tên: ${context.studentName ?? 'Sinh viên'}
GPA tích lũy: ${context.cumulativeGpa ?? 'Chưa có dữ liệu'}
Tín chỉ tích lũy: ${context.earnedCredits ?? 0}

Bảng điểm:
${gradesText || 'Chưa có điểm nào được nhập.'}
`.trim();
  }
}
