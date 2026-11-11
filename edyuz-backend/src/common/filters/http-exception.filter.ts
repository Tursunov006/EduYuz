import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Ichki server xatoligi yuz berdi';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' && (res as any).message ? (res as any).message : res;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Ma'lum Prisma xatolarini tushunarli HTTP javoblarga aylantirish
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = "Bunday ma'lumot allaqachon mavjud";
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = "Ma'lumot topilmadi";
      } else if (exception.code === 'P2003') {
        status = HttpStatus.CONFLICT;
        message = "Bu yozuvga bog'langan boshqa ma'lumotlar mavjud, avval ularni o'chiring";
      } else {
        this.logger.error(`${request.method} ${request.url} -> Prisma ${exception.code}: ${exception.message}`);
      }
    } else {
      // Ichki xato tafsilotlari (SQL, stack trace) mijozga yuborilmaydi — faqat logga yoziladi
      const err = exception as Error;
      this.logger.error(`${request.method} ${request.url} -> ${err?.message}`, err?.stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
    });
  }
}
