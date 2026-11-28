import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { RoleType } from '@prisma/client';
import { AuthService } from './auth.service';
import { TurnstileService } from './turnstile.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { DisableTwoFactorDto, VerifyCodeDto } from './dto/two-factor.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/access/access.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private turnstile: TurnstileService,
  ) {}

  // Avval bu endpoint ochiq edi: istalgan odam o'ziga superadmin hisob yarata olardi.
  // Endi faqat tizimga kirgan admin o'z markaziga xodim qo'sha oladi.
  @Roles(RoleType.admin)
  @Post('register')
  register(@Body() dto: RegisterDto, @CurrentUser() user: AuthUser) {
    return this.authService.register(dto, user);
  }

  // Parolni taxmin qilish (brute-force) hujumiga qarshi: bitta IP dan daqiqasiga 10 ta urinish
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    await this.turnstile.verify(dto.turnstileToken, req.ip);
    return this.authService.login(dto);
  }

  // 2 bosqichli kirishning 2-bosqichi: Telegramga kelgan kodni tasdiqlash
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login/verify')
  loginVerify(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyLogin(dto.challengeId, dto.code);
  }

  // Parolni unutgan xodim: Telegram botga tiklash kodi yuboriladi
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    await this.turnstile.verify(dto.turnstileToken, req.ip);
    return this.authService.forgotPassword(dto.phone);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('password/reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.challengeId, dto.code, dto.newPassword);
  }

  // --- Xodimning o'z 2 bosqichli kirish sozlamalari ---
  @Get('2fa')
  twoFactorStatus(@CurrentUser() user: AuthUser) {
    return this.authService.twoFactorStatus(user.id);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('2fa/enable')
  twoFactorEnable(@CurrentUser() user: AuthUser) {
    return this.authService.twoFactorStartEnable(user.id);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('2fa/confirm')
  twoFactorConfirm(@CurrentUser() user: AuthUser, @Body() dto: VerifyCodeDto) {
    return this.authService.twoFactorConfirmEnable(user.id, dto.challengeId, dto.code);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('2fa/disable')
  twoFactorDisable(@CurrentUser() user: AuthUser, @Body() dto: DisableTwoFactorDto) {
    return this.authService.twoFactorDisable(user.id, dto.password);
  }

  // Telegramga kira olmay qolgan xodim uchun (superadmin): 2 bosqichli kirishni o'chirib, ulanishni bekor qiladi
  @Roles(RoleType.superadmin)
  @Post('2fa/reset/:userId')
  twoFactorReset(@Param('userId') userId: string) {
    return this.authService.twoFactorReset(userId);
  }

  // Joriy foydalanuvchining yangi ma'lumotlari (markaz nomi/rasmi o'zgarsa, qayta login qilmasdan yangilanadi)
  @Get('me')
  async getProfile(@CurrentUser() user: AuthUser) {
    return {
      success: true,
      user: await this.authService.profile(user.id),
    };
  }
}
