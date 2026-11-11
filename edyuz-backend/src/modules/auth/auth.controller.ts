import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RoleType } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/access/access.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  getProfile(@CurrentUser() user: AuthUser) {
    return {
      success: true,
      user,
    };
  }
}
