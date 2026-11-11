import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CentersModule } from './modules/centers/centers.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { GroupsModule } from './modules/groups/groups.module';
import { StudentsModule } from './modules/students/students.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { LmsModule } from './modules/lms/lms.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { SmsModule } from './modules/sms/sms.module';
import { AiModule } from './modules/ai/ai.module';
import { GamesModule } from './modules/games/games.module';
import { InstagramModule } from './modules/instagram/instagram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Umumiy so'rovlar chegarasi: bitta IP dan daqiqasiga 300 ta so'rov
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    SmsModule,
    TelegramModule,
    LmsModule,
    GamificationModule,
    CertificatesModule,
    TeachersModule,
    ExpensesModule,
    AiModule,
    GamesModule,
    InstagramModule,
    AuthModule,
    CentersModule,
    UsersModule,
    CoursesModule,
    GroupsModule,
    StudentsModule,
    AttendanceModule,
    PaymentsModule,
  ],
  providers: [
    // Tartib muhim: avval so'rovlar chegarasi, keyin autentifikatsiya, keyin rol tekshiruvi.
    // Barcha endpointlar sukut bo'yicha himoyalangan; ochiq qilish uchun @Public() qo'yiladi.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
