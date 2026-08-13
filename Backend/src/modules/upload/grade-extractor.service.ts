// src/modules/upload/grade-extractor.service.ts
/**
 * GradeExtractorService
 * ─────────────────────────────────────────────────────────────────────────────
 * Nhận Buffer (PDF / Excel / Ảnh) → gọi Gemini Vision → parse JSON điểm.
 *
 * Strategy:
 *  - PDF / Ảnh  → chuyển sang base64, gửi lên Gemini 1.5 Pro (multimodal)
 *  - Excel      → dùng `xlsx` để parse ra text rồi gửi Gemini text-only
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

export interface ExtractedGrade {
  courseCode: string;
  courseName?: string;
  credits?: number;
  attendanceScore?: number;
  midtermScore?: number;
  finalScore?: number;
  totalScore?: number;
  letterGrade?: string;
  gpa?: number;
}

export interface ExtractedGradeSheet {
  studentName?: string;
  studentId?: string;
  semester?: string;
  year?: number;
  institution?: string;
  grades: ExtractedGrade[];
  rawText?: string;
}

const EXTRACTION_PROMPT = `
Bạn là một hệ thống OCR chuyên trích xuất điểm số từ bảng điểm học sinh/sinh viên.

Hãy phân tích tài liệu/ảnh bảng điểm và trả về JSON theo đúng cấu trúc sau (KHÔNG thêm bất kỳ text nào khác ngoài JSON):

{
  "studentName": "Tên sinh viên (nếu có)",
  "studentId": "Mã sinh viên (nếu có)",
  "semester": "Học kỳ, ví dụ: 2024-1",
  "year": 2024,
  "institution": "Tên trường (nếu có)",
  "grades": [
    {
      "courseCode": "Mã môn học (bắt buộc)",
      "courseName": "Tên môn học",
      "credits": 3,
      "attendanceScore": 9.0,
      "midtermScore": 7.5,
      "finalScore": 8.0,
      "totalScore": 8.1,
      "letterGrade": "B+",
      "gpa": 3.2
    }
  ]
}

Quy tắc:
- courseCode: nếu không có mã, tạo mã từ chữ cái đầu tên môn
- totalScore: thang 10
- gpa: thang 4 (nếu không có, để null)
- letterGrade: A+, A, B+, B, C+, C, D+, D, F
- Bỏ qua các hàng header, tổng kết, ghi chú
- Chỉ trả về JSON thuần, không markdown
`;

@Injectable()
export class GradeExtractorService {
  private readonly logger = new Logger(GradeExtractorService.name);
  private readonly gemini: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY chưa được cấu hình');
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  // ── Public entry point ────────────────────────────────────────────────────
  async extract(
    buffer: Buffer,
    mimeType: string,
    fileName: string,
  ): Promise<ExtractedGradeSheet> {
    this.logger.log(
      `Đang trích xuất: ${fileName} (${mimeType}, ${buffer.length} bytes)`,
    );

    const isExcel =
      mimeType.includes('spreadsheetml') || mimeType.includes('ms-excel');

    if (isExcel) {
      return this.extractFromExcel(buffer);
    } else {
      // PDF hoặc ảnh → multimodal Gemini
      return this.extractFromImageOrPdf(buffer, mimeType);
    }
  }

  // ── Image / PDF → Gemini Vision ───────────────────────────────────────────
  private async extractFromImageOrPdf(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ExtractedGradeSheet> {
    const model = this.gemini.getGenerativeModel({
      model: 'gemini-1.5-pro',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const base64 = buffer.toString('base64');

    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          mimeType: mimeType as any,
          data: base64,
        },
      },
    ]);

    const text = result.response.text().trim();
    this.logger.debug(`Gemini raw response: ${text.substring(0, 200)}...`);

    return this.parseJson(text);
  }

  // ── Excel → xlsx parse → Gemini text ─────────────────────────────────────
  private async extractFromExcel(
    buffer: Buffer,
  ): Promise<ExtractedGradeSheet> {
    // Lazy import xlsx để tránh nặng bundle nếu không dùng
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require('xlsx') as typeof import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const csvText = XLSX.utils.sheet_to_csv(sheet);

    const model = this.gemini.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const prompt = `${EXTRACTION_PROMPT}\n\nDữ liệu CSV từ file Excel:\n\`\`\`\n${csvText.substring(0, 8000)}\n\`\`\``;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return this.parseJson(text);
  }

  // ── Safe JSON parse ───────────────────────────────────────────────────────
  private parseJson(raw: string): ExtractedGradeSheet {
    try {
      // Loại bỏ markdown code fence nếu model trả về
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed.grades)) parsed.grades = [];
      return parsed as ExtractedGradeSheet;
    } catch (e) {
      this.logger.error(`Không parse được JSON từ Gemini: ${e}`);
      // Trả về rỗng để không crash toàn bộ pipeline
      return { grades: [], rawText: raw };
    }
  }
}
