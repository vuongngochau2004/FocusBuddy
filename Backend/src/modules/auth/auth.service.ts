// src/modules/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { MailService } from './mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ─── Tạo mã OTP 6 số ngẫu nhiên ──────────────────────────────────────────
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ─── ĐĂNG KÝ ──────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const { email, fullName, password } = dto;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      if (existingUser.isVerified) {
        throw new ConflictException('Email này đã được đăng ký và xác thực. Vui lòng đăng nhập.');
      }
      // Nếu chưa xác thực → gửi lại OTP mới
      const otp = this.generateOtp();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

      await this.prisma.user.update({
        where: { email },
        data: {
          verificationCode: otp,
          verificationCodeExpires: expires,
          name: fullName,
        },
      });

      await this.mailService.sendVerificationEmail(email, fullName, otp);

      return {
        message: 'Mã xác nhận mới đã được gửi đến email của bạn.',
        email,
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Tạo OTP
    const otp = this.generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    // Tạo user mới (chưa xác thực)
    await this.prisma.user.create({
      data: {
        email,
        name: fullName,
        passwordHash,
        isVerified: false,
        verificationCode: otp,
        verificationCodeExpires: expires,
      },
    });

    // Gửi email OTP
    await this.mailService.sendVerificationEmail(email, fullName, otp);

    return {
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác nhận.',
      email,
    };
  }

  // ─── XÁC NHẬN EMAIL ────────────────────────────────────────────────────────
  async verifyEmail(dto: VerifyEmailDto) {
    const { email, code } = dto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống.');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email này đã được xác thực rồi. Hãy đăng nhập.');
    }

    if (!user.verificationCode || !user.verificationCodeExpires) {
      throw new BadRequestException('Không tìm thấy mã xác nhận. Vui lòng đăng ký lại.');
    }

    // Kiểm tra mã hết hạn chưa
    if (new Date() > user.verificationCodeExpires) {
      throw new BadRequestException('Mã xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại.');
    }

    // Kiểm tra mã OTP
    if (user.verificationCode !== code) {
      throw new BadRequestException('Mã xác nhận không chính xác.');
    }

    // Cập nhật: xác thực thành công → xóa OTP
    await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    // Gửi email chào mừng (không blocking)
    this.mailService.sendWelcomeEmail(email, user.name).catch(() => {});

    return {
      message: 'Xác nhận email thành công! Bạn có thể đăng nhập ngay bây giờ.',
    };
  }

  // ─── ĐĂNG NHẬP ─────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // Kiểm tra xác thực email
    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Tài khoản chưa được xác thực. Vui lòng kiểm tra email và nhập mã OTP.',
      );
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // Tạo JWT tokens
    const payload = { sub: user.id, email: user.email, name: user.name };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    // Hash refresh token trước khi lưu vào DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      message: 'Đăng nhập thành công!',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ─── ĐĂNG XUẤT ─────────────────────────────────────────────────────────────
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Đăng xuất thành công.' };
  }

  // ─── GỬI LẠI OTP ───────────────────────────────────────────────────────────
  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống.');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email này đã được xác thực rồi.');
    }

    const otp = this.generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: {
        verificationCode: otp,
        verificationCodeExpires: expires,
      },
    });

    await this.mailService.sendVerificationEmail(email, user.name, otp);

    return { message: 'Mã xác nhận mới đã được gửi đến email của bạn.' };
  }

  // ─── LẤY THÔNG TIN USER HIỆN TẠI ─────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        studentId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng.');
    }

    return user;
  }
}
