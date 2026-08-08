// src/modules/auth/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    code: string,
  ): Promise<void> {
    const from = this.configService.get<string>('MAIL_FROM', 'EduTrack AI <no-reply@edutrack.ai>');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận Email - EduTrack AI</title>
      </head>
      <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:20px;border:1px solid rgba(99,102,241,0.3);overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
                    <div style="font-size:36px;margin-bottom:8px;">🎓</div>
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">EduTrack AI</h1>
                    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Multi-Agent Academic Assistant</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:20px;">Xin chào, ${name}! 👋</h2>
                    <p style="color:#94a3b8;margin:0 0 28px;line-height:1.7;font-size:15px;">
                      Cảm ơn bạn đã đăng ký tài khoản <strong style="color:#a5b4fc;">EduTrack AI</strong>. 
                      Để hoàn tất đăng ký, vui lòng nhập mã xác nhận bên dưới:
                    </p>
                    <!-- OTP Box -->
                    <div style="background:linear-gradient(135deg,rgba(79,70,229,0.2),rgba(124,58,237,0.2));border:2px solid rgba(99,102,241,0.5);border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
                      <p style="color:#94a3b8;margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:2px;">MÃ XÁC NHẬN</p>
                      <div style="display:inline-flex;gap:8px;">
                        <span style="font-size:36px;font-weight:800;letter-spacing:16px;color:#a5b4fc;font-family:'Courier New',monospace;">${code}</span>
                      </div>
                      <p style="color:#64748b;margin:12px 0 0;font-size:12px;">⏰ Mã có hiệu lực trong <strong style="color:#f59e0b;">10 phút</strong></p>
                    </div>
                    <!-- Warning -->
                    <div style="background:rgba(245,158,11,0.1);border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;margin:0 0 24px;">
                      <p style="color:#fbbf24;margin:0;font-size:13px;">
                        ⚠️ Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.
                      </p>
                    </div>
                    <p style="color:#64748b;margin:0;font-size:13px;line-height:1.6;">
                      Nếu bạn gặp khó khăn, hãy liên hệ với chúng tôi qua email hỗ trợ.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                    <p style="color:#475569;margin:0;font-size:12px;">
                      © 2024 EduTrack AI. Được tạo với ❤️ để hỗ trợ sinh viên Việt Nam.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `[EduTrack AI] Mã xác nhận đăng ký: ${code}`,
        html: htmlContent,
        text: `Xin chào ${name},\n\nMã xác nhận của bạn là: ${code}\nMã có hiệu lực trong 10 phút.\n\nEduTrack AI`,
      });
      this.logger.log(`✅ Email xác nhận đã gửi đến: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Lỗi gửi email đến ${to}:`, error);
      throw new Error('Không thể gửi email xác nhận. Vui lòng thử lại.');
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const from = this.configService.get<string>('MAIL_FROM', 'EduTrack AI <no-reply@edutrack.ai>');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:20px;border:1px solid rgba(99,102,241,0.3);overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
                  <div style="font-size:48px;margin-bottom:8px;">🎉</div>
                  <h1 style="color:#fff;margin:0;font-size:24px;">Chào mừng đến với EduTrack AI!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#e2e8f0;margin:0 0 16px;">Xin chào, ${name}!</h2>
                  <p style="color:#94a3b8;line-height:1.7;font-size:15px;margin:0 0 20px;">
                    Tài khoản của bạn đã được xác nhận thành công. Bây giờ bạn có thể đăng nhập và trải nghiệm đầy đủ tính năng của <strong style="color:#a5b4fc;">EduTrack AI</strong>.
                  </p>
                  <div style="background:rgba(79,70,229,0.1);border-radius:12px;padding:20px;margin-bottom:24px;">
                    <p style="color:#a5b4fc;margin:0 0 12px;font-weight:600;">🚀 Những gì bạn có thể làm:</p>
                    <ul style="color:#94a3b8;margin:0;padding-left:20px;line-height:2;">
                      <li>📊 Theo dõi điểm số và GPA</li>
                      <li>🤖 Chat với AI Chatbot học thuật</li>
                      <li>🧠 Ghi nhật ký tâm lý hàng ngày</li>
                      <li>📁 Upload bảng điểm tự động</li>
                    </ul>
                  </div>
                  <p style="color:#64748b;font-size:13px;margin:0;">Chúc bạn học tập hiệu quả! 📚</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: '🎉 Chào mừng đến với EduTrack AI!',
        html: htmlContent,
      });
    } catch (error) {
      this.logger.warn(`Không gửi được welcome email đến ${to}:`, error);
    }
  }
}
