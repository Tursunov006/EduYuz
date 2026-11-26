import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  Headers,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { InstagramService } from './instagram.service';
import { CreateLeadDto, InstagramAiChatDto, UpdateLeadStageDto } from './dto/lead.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

@Controller('instagram')
export class InstagramController {
  constructor(
    private readonly instagramService: InstagramService,
    private readonly access: AccessService,
  ) {}

  // 1. Meta (Facebook/Instagram) Webhook Verification (GET)
  @Public()
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN;
    if (verifyToken && mode === 'subscribe' && token === verifyToken) {
      // Challenge oddiy matn sifatida qaytariladi (HTML sifatida talqin qilinmasligi uchun)
      return res.status(HttpStatus.OK).type('text/plain').send(String(challenge ?? ''));
    }
    // Avval xato javobida kutilayotgan maxfiy token ("expectedVerifyToken") ochiq qaytarilardi
    return res.status(HttpStatus.FORBIDDEN).json({ message: 'Verify token mos kelmadi' });
  }

  // 2. Meta Instagram Direct / ManyChat Webhook (POST)
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    // INSTAGRAM_APP_SECRET sozlangan bo'lsa, Meta imzosi (HMAC-SHA256) majburiy tekshiriladi —
    // aks holda istalgan odam soxta webhook yuborib, bot nomidan DM jo'nattira olardi.
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    if (appSecret) {
      const expected =
        'sha256=' + createHmac('sha256', appSecret).update(req.rawBody ?? Buffer.alloc(0)).digest('hex');
      const a = Buffer.from(expected);
      const b = Buffer.from(String(signature || ''));
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new ForbiddenException("Webhook imzosi noto'g'ri");
      }
    }
    return this.instagramService.handleMetaWebhook(body, Boolean(appSecret));
  }

  // 3. Instagram AI Sotuv Konsultanti bilan suhbat (/insta ochiq sahifasi)
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  @Post('ai-chat')
  async aiChat(@Body() dto: InstagramAiChatDto) {
    return this.instagramService.chatInstagramSales(dto.message, dto.senderName, dto.igUsername);
  }

  // 4. Lidlar ro'yxati (Kanban doska) — faqat xodimlar, faqat o'z markazi lidlari
  @Get('leads')
  async getLeads(@CurrentUser() user: AuthUser) {
    return this.instagramService.getAllLeads(this.access.scopeCenter(user));
  }

  // Aksioma o'quv markazi veb-saytidan kelgan ariza: lid markaz CRM'iga biriktiriladi.
  // Markaz serverda aniqlanadi (WEBSITE_CENTER_ID yoki nomi "Aksioma" bo'lgan markaz),
  // so'rovdan centerId qabul qilinmaydi — begona markazga lid yozib bo'lmaydi.
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('site-lead')
  async createSiteLead(@Body() dto: CreateLeadDto) {
    const centerId = await this.instagramService.resolveWebsiteCenterId();
    if (!centerId) throw new BadRequestException('Markaz topilmadi');
    await this.instagramService.createLead({
      fullName: dto.fullName,
      phone: dto.phone,
      course: dto.course,
      note: dto.note,
      source: 'Sayt',
      stage: 'new',
      centerId,
    });
    return { ok: true };
  }

  // 5. Yangi lid qo'shish: /insta ochiq sahifasidan (anonim) yoki CRM ichidan (xodim)
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('lead')
  async createLead(@Body() dto: CreateLeadDto, @CurrentUser() user?: AuthUser) {
    // Anonim so'rov bosqichni o'zi belgilay olmaydi va markazga biriktirilmaydi
    if (!user) {
      return this.instagramService.createLead({ ...dto, stage: 'new' });
    }
    return this.instagramService.createLead({ ...dto, centerId: user.centerId });
  }

  // 6. Lid bosqichini yangilash
  @Patch('leads/:id')
  async updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStageDto,
    @CurrentUser() user: AuthUser,
  ) {
    const { stage, ...fields } = dto;
    const hasFields = Object.values(fields).some((v) => v !== undefined);
    if (hasFields) return this.instagramService.updateLead(id, dto, this.access.scopeCenter(user));
    if (!stage) throw new BadRequestException("O'zgartirish uchun ma'lumot yuborilmadi");
    return this.instagramService.updateLeadStage(id, stage, this.access.scopeCenter(user));
  }

  // 7. Lidni o'chirish
  @Delete('leads/:id')
  async deleteLead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.instagramService.deleteLead(id, this.access.scopeCenter(user));
  }
}
