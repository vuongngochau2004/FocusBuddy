// src/modules/upload/upload.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GradeExtractorService } from './grade-extractor.service';
import { UploadStatus } from '@prisma/client';

@Injectable()
export class UploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly extractor: GradeExtractorService,
  ) {}

  // ── Save raw file to DB ───────────────────────────────────────────────────
  async saveFile(userId: string, file: Express.Multer.File) {
    return this.prisma.uploadedFile.create({
      data: {
        userId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        // MVP: lưu base64 trong DB. Production → upload lên S3 rồi lưu key
        storagePath: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        status: UploadStatus.PENDING,
      },
    });
  }

  // ── Background: AI extraction + save grades ───────────────────────────────
  async extractAndSaveGrades(uploadId: string, userId: string): Promise<void> {
    // Đánh dấu PROCESSING
    await this.prisma.uploadedFile.update({
      where: { id: uploadId },
      data: { status: UploadStatus.PROCESSING },
    });

    try {
      // Lấy lại file để có buffer
      const record = await this.prisma.uploadedFile.findUniqueOrThrow({
        where: { id: uploadId },
      });

      // Decode base64 → buffer
      const base64 = record.storagePath.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');

      // Gọi Gemini Vision / PDF parser
      const extracted = await this.extractor.extract(
        buffer,
        record.mimeType,
        record.originalName,
      );

      // Lưu extracted data
      await this.prisma.uploadedFile.update({
        where: { id: uploadId },
        data: {
          status: UploadStatus.DONE,
          extractedData: extracted as any,
        },
      });

      // Upsert grades từ extracted data
      if (extracted.grades && Array.isArray(extracted.grades)) {
        for (const g of extracted.grades) {
          try {
            // Upsert course
            const course = await this.prisma.course.upsert({
              where: { code: g.courseCode },
              create: {
                code: g.courseCode,
                name: g.courseName ?? g.courseCode,
                credits: g.credits ?? 3,
              },
              update: {
                name: g.courseName ?? undefined,
              },
            });

            // Upsert grade
            await this.prisma.grade.upsert({
              where: {
                userId_courseId_semester_year: {
                  userId,
                  courseId: course.id,
                  semester: extracted.semester ?? 'Unknown',
                  year: extracted.year ?? new Date().getFullYear(),
                },
              },
              create: {
                userId,
                courseId: course.id,
                semester: extracted.semester ?? 'Unknown',
                year: extracted.year ?? new Date().getFullYear(),
                attendanceScore: g.attendanceScore,
                midtermScore: g.midtermScore,
                finalScore: g.finalScore,
                totalScore: g.totalScore,
                letterGrade: g.letterGrade,
                gpa: g.gpa,
                status: this.determineStatus(g.totalScore, g.gpa),
                sourceFileId: uploadId,
              },
              update: {
                attendanceScore: g.attendanceScore,
                midtermScore: g.midtermScore,
                finalScore: g.finalScore,
                totalScore: g.totalScore,
                letterGrade: g.letterGrade,
                gpa: g.gpa,
                status: this.determineStatus(g.totalScore, g.gpa),
                sourceFileId: uploadId,
              },
            });
          } catch (err) {
            console.error(`[Upload] Bỏ qua môn lỗi ${g.courseCode}:`, err);
          }
        }
      }
    } catch (err) {
      await this.prisma.uploadedFile.update({
        where: { id: uploadId },
        data: {
          status: UploadStatus.ERROR,
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }
  }

  // ── Get status ────────────────────────────────────────────────────────────
  async getStatus(userId: string, uploadId: string) {
    const record = await this.prisma.uploadedFile.findFirst({
      where: { id: uploadId, userId },
      select: {
        id: true,
        originalName: true,
        status: true,
        errorMessage: true,
        extractedData: true,
        createdAt: true,
        updatedAt: true,
        grades: {
          select: {
            id: true,
            course: { select: { code: true, name: true } },
            totalScore: true,
            gpa: true,
            letterGrade: true,
            status: true,
          },
        },
      },
    });

    if (!record) throw new NotFoundException('Không tìm thấy file upload.');
    return record;
  }

  // ── List my files ─────────────────────────────────────────────────────────
  async getMyFiles(userId: string) {
    return this.prisma.uploadedFile.findMany({
      where: { userId },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        _count: { select: { grades: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async remove(userId: string, uploadId: string) {
    const record = await this.prisma.uploadedFile.findFirst({
      where: { id: uploadId, userId },
    });
    if (!record) throw new NotFoundException('Không tìm thấy file upload.');

    // Cascade xóa grades có sourceFileId = uploadId (set null)
    await this.prisma.grade.updateMany({
      where: { sourceFileId: uploadId },
      data: { sourceFileId: null },
    });

    await this.prisma.uploadedFile.delete({ where: { id: uploadId } });
    return { message: 'Đã xóa file và dữ liệu liên quan.' };
  }

  // ── Helper ────────────────────────────────────────────────────────────────
  private determineStatus(
    totalScore?: number | null,
    gpa?: number | null,
  ): 'PASSED' | 'FAILED' | 'PENDING' {
    if (totalScore != null) return totalScore >= 5 ? 'PASSED' : 'FAILED';
    if (gpa != null) return gpa >= 1.0 ? 'PASSED' : 'FAILED';
    return 'PENDING';
  }
}
