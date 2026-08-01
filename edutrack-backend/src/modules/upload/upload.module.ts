// src/modules/upload/upload.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { GradeExtractorService } from './grade-extractor.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: memoryStorage(), // giữ file trong RAM, không ghi disk
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `Định dạng không hỗ trợ: ${file.mimetype}. Chỉ chấp nhận PDF, Excel, JPEG, PNG, WEBP.`,
            ),
            false,
          );
        }
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, GradeExtractorService],
  exports: [UploadService],
})
export class UploadModule {}
