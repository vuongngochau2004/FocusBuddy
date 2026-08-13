// src/modules/ai-agent/ai-agent.service.ts
/**
 * AiAgentService – LangGraph-style StateGraph Orchestrator
 * ─────────────────────────────────────────────────────────────────────────────
 * Luồng xử lý (mô phỏng LangGraph StateGraph):
 *
 *   [START]
 *      │
 *      ▼
 *  [SUPERVISOR]  ←── classify intent
 *      │
 *  ┌───┴──────────┐
 *  │              │
 *  ▼              ▼
 * [ACADEMIC]  [PSYCHOLOGY]
 *  │              │
 *  └────────┬─────┘
 *           │
 *           ▼
 *      [SAVE & RETURN]
 *           │
 *          [END]
 *
 * Khi LangGraph.js được cài, thay thế class này bằng StateGraph thực.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupervisorAgent } from './agents/supervisor.agent';
import { AcademicAgent } from './agents/academic.agent';
import { PsychologyAgent } from './agents/psychology.agent';

export interface ChatMessageDto {
  sessionId?: string; // nếu không có → tạo session mới
  message: string;
}

export interface ChatResponse {
  sessionId: string;
  agentType: string;
  intent: string;
  intentScore: Record<string, number>;
  reply: string;
  latencyMs: number;
}

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supervisor: SupervisorAgent,
    private readonly academic: AcademicAgent,
    private readonly psychology: PsychologyAgent,
  ) {}

  // ── Main Chat Entry ────────────────────────────────────────────────────────
  async chat(userId: string, dto: ChatMessageDto): Promise<ChatResponse> {
    const startTime = Date.now();

    // ── NODE 1: Resolve/Create Session ──────────────────────────────────────
    const session = await this.resolveSession(userId, dto.sessionId);

    // ── NODE 2: Load last N chat messages (context window) ──────────────────
    const recentMessages = await this.prisma.chatHistory.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 10, // last 10 messages
    });

    const chatHistory = recentMessages.map((m) => ({
      role: m.role === 'USER' ? ('user' as const) : ('model' as const),
      parts: m.content,
    }));

    // ── NODE 3: Save user message ────────────────────────────────────────────
    await this.prisma.chatHistory.create({
      data: {
        sessionId: session.id,
        role: 'USER',
        content: dto.message,
      },
    });

    // ── NODE 4: SUPERVISOR – Classify Intent ─────────────────────────────────
    const intentResult = await this.supervisor.classify(dto.message);

    // ── NODE 5: Route to Sub-Agent ───────────────────────────────────────────
    let reply: string;
    let tokensUsed: number | undefined;
    const agentType = intentResult.intent;

    if (agentType === 'ACADEMIC') {
      const context = await this.buildAcademicContext(userId, chatHistory);
      const res = await this.academic.chat(dto.message, context);
      reply = res.reply;
      tokensUsed = res.tokensUsed;
    } else if (agentType === 'PSYCHOLOGY') {
      const context = await this.buildPsychologyContext(userId, chatHistory);
      const res = await this.psychology.chat(dto.message, context);
      reply = res.reply;
      tokensUsed = res.tokensUsed;
    } else {
      // GENERAL – trả lời đơn giản
      reply = await this.handleGeneral(dto.message);
    }

    const latencyMs = Date.now() - startTime;

    // ── NODE 6: Save assistant message ──────────────────────────────────────
    await this.prisma.chatHistory.create({
      data: {
        sessionId: session.id,
        role: 'ASSISTANT',
        content: reply,
        agentType: agentType as any,
        intentScore: intentResult.confidence as any,
        tokensUsed: tokensUsed ?? null,
        latencyMs,
      },
    });

    // Cập nhật session title nếu là tin nhắn đầu tiên
    if (recentMessages.length === 0) {
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: {
          title: dto.message.substring(0, 60),
        },
      });
    }

    return {
      sessionId: session.id,
      agentType,
      intent: intentResult.intent,
      intentScore: intentResult.confidence,
      reply,
      latencyMs,
    };
  }

  // ── Get chat history ───────────────────────────────────────────────────────
  async getHistory(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên chat.');

    return this.prisma.chatHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── List sessions ──────────────────────────────────────────────────────────
  async getSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async resolveSession(userId: string, sessionId?: string) {
    if (sessionId) {
      const s = await this.prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });
      if (!s) throw new NotFoundException('Session không tồn tại.');
      return s;
    }
    return this.prisma.chatSession.create({
      data: { userId, isActive: true },
    });
  }

  private async buildAcademicContext(
    userId: string,
    chatHistory: Array<{ role: 'user' | 'model'; parts: string }>,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const grades = await this.prisma.grade.findMany({
      where: { userId },
      include: { course: true },
      orderBy: [{ year: 'desc' }, { semester: 'desc' }],
    });

    // Calculate GPA
    let totalWeighted = 0,
      totalCredits = 0,
      earnedCredits = 0;
    for (const g of grades) {
      if (g.gpa != null) {
        totalWeighted += g.gpa * g.course.credits;
        totalCredits += g.course.credits;
      }
      if (g.status === 'PASSED') earnedCredits += g.course.credits;
    }
    const cumulativeGpa =
      totalCredits > 0
        ? Math.round((totalWeighted / totalCredits) * 100) / 100
        : undefined;

    return {
      studentName: user?.name,
      grades: grades.map((g) => ({
        courseName: g.course.name,
        courseCode: g.course.code,
        totalScore: g.totalScore,
        gpa: g.gpa,
        letterGrade: g.letterGrade,
        status: g.status,
        semester: g.semester,
      })),
      cumulativeGpa,
      earnedCredits,
      chatHistory,
    };
  }

  private async buildPsychologyContext(
    userId: string,
    chatHistory: Array<{ role: 'user' | 'model'; parts: string }>,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const logs = await this.prisma.psychologyLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7,
    });

    return {
      studentName: user?.name,
      recentLogs: logs,
      chatHistory,
    };
  }

  private async handleGeneral(message: string): Promise<string> {
    // Simple response cho GENERAL intent
    const greetings = ['xin chào', 'hello', 'hi', 'chào'];
    const lower = message.toLowerCase();
    if (greetings.some((g) => lower.includes(g))) {
      return 'Xin chào! Tôi là EduTrack AI 🎓. Tôi có thể giúp bạn:\n- **Phân tích kết quả học tập** và đề xuất lộ trình cải thiện\n- **Hỗ trợ tâm lý** khi bạn cảm thấy áp lực hay mệt mỏi\n\nBạn muốn nói chuyện về điều gì?';
    }
    return 'Tôi hiểu câu hỏi của bạn. Hãy cho tôi biết bạn muốn tư vấn về **học tập** hay về **tâm lý/cảm xúc** để tôi hỗ trợ tốt hơn nhé!';
  }
}
