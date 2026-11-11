import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';

// BigInt qiymatlarini JSON.stringify qilish uchun
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // rawBody: webhook imzolarini (Instagram HMAC) asl so'rov tanasi bo'yicha tekshirish uchun
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // Render/Nginx kabi proksi ortida haqiqiy mijoz IP sini olish (so'rov chegarasi IP bo'yicha ishlaydi)
  app.set('trust proxy', 1);

  // Xavfsizlik sarlavhalari (X-Content-Type-Options, HSTS va h.k.)
  app.use(helmet());

  // Face-ID rasmi (base64) uchun yetarli, lekin xotirani to'ldirib yuborish (DoS) uchun kam
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '10mb' });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS: CORS_ORIGINS="https://eduyuz.uz,https://www.eduyuz.uz" ko'rinishida cheklash mumkin.
  // Token Authorization sarlavhasida yuboriladi (cookie emas), shuning uchun credentials kerak emas.
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 EduYuz Backend muvaffaqiyatli ishga tushdi: http://localhost:${port}/api/v1`);
}
bootstrap();
