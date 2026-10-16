import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { InstagramService } from './instagram.service';

@Controller('instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  // 1. Meta (Facebook/Instagram) Webhook Verification (GET)
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || 'eduyuz_insta_2026';
    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(HttpStatus.OK).send(challenge);
    }
    return res.status(HttpStatus.FORBIDDEN).json({
      message: 'Verify token mos kelmadi',
      expectedVerifyToken: 'eduyuz_insta_2026',
    });
  }

  // 2. Meta Instagram Direct / ManyChat Webhook (POST)
  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    return this.instagramService.handleMetaWebhook(body);
  }

  // 3. Instagram AI Sotuv Konsultanti bilan suhbat (@eduyuzcrmuz)
  @Post('ai-chat')
  async aiChat(
    @Body() dto: { message: string; senderName?: string; igUsername?: string },
  ) {
    return this.instagramService.chatInstagramSales(
      dto.message,
      dto.senderName,
      dto.igUsername,
    );
  }

  // 4. Barcha lidlarni olish (Kanban doska uchun)
  @Get('leads')
  async getLeads() {
    return this.instagramService.getAllLeads();
  }

  // 5. Yangi lid qo'shish (eduyuz.uz/insta sahifasidan yoki CRM ichidan)
  @Post('lead')
  async createLead(
    @Body()
    dto: {
      fullName: string;
      phone: string;
      course?: string;
      source?: string;
      stage?: string;
      note?: string;
      igUsername?: string;
    },
  ) {
    return this.instagramService.createLead(dto);
  }

  // 6. Lid bosqichini yangilash
  @Patch('leads/:id')
  async updateStage(
    @Param('id') id: string,
    @Body() dto: { stage: string },
  ) {
    return this.instagramService.updateLeadStage(id, dto.stage);
  }

  // 7. Lidni o'chirish
  @Delete('leads/:id')
  async deleteLead(@Param('id') id: string) {
    return this.instagramService.deleteLead(id);
  }
}
