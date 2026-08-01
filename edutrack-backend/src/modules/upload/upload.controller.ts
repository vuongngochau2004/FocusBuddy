// src/modules/upload/upload.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
  Delete,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Upload – Bảng điểm')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // POST /upload/grade-sheet
  //   - Nhận file PDF / Excel / Ảnh từ frontend
  //   - Lưu vào DB với status PENDING
  //   - Kick-off background job: AI trích xuất điểm
  //   - Trả ngay { uploadId } để frontend polling
  // ──────────────────────────────────────────────────────────────────────────
  @Post('grade-sheet')
  @HttpCode(HttpStatus.ACCEPTED)           // 202 – accepted, đang xử lý
  @ApiOperation({
    summary: 'Upload bảng điểm (PDF / Excel / Ảnh)',
    description:
      'Nhận file bảng điểm, lưu vào DB rồi gọi Gemini Vision để trích xuất điểm tự động.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadGradeSheet(
    @CurrentUser('sub') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Không tìm thấy file.');

    // 1. Tạo bản ghi DB + lưu file (base64 hoặc path)
    const upload = await this.uploadService.saveFile(userId, file);

    // 2. Kick-off AI extraction (async – không await ở đây)
    this.uploadService.extractAndSaveGrades(upload.id, userId).catch((err) =>
      console.error(`[Upload] Lỗi trích xuất grade cho ${upload.id}:`, err),
    );

    return {
      message:
        'File đã được nhận. Hệ thống đang trích xuất điểm, vui lòng chờ...',
      uploadId: upload.id,
      status: upload.status,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /upload/:id/status  – Polling endpoint
  // ──────────────────────────────────────────────────────────────────────────
  @Get(':id/status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái trích xuất điểm' })
  @ApiParam({ name: 'id', description: 'Upload ID' })
  getStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') uploadId: string,
  ) {
    return this.uploadService.getStatus(userId, uploadId);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /upload/my-files  – Lịch sử file đã upload
  // ──────────────────────────────────────────────────────────────────────────
  @Get('my-files')
  @ApiOperation({ summary: 'Danh sách file đã upload' })
  getMyFiles(@CurrentUser('sub') userId: string) {
    return this.uploadService.getMyFiles(userId);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DELETE /upload/:id
  // ──────────────────────────────────────────────────────────────────────────
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa file upload và dữ liệu điểm liên quan' })
  @ApiParam({ name: 'id', description: 'Upload ID' })
  remove(
    @CurrentUser('sub') userId: string,
    @Param('id') uploadId: string,
  ) {
    return this.uploadService.remove(userId, uploadId);
  }
}
