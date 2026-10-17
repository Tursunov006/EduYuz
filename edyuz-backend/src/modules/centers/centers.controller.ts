import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('centers')
export class CentersController {
  constructor(private readonly centersService: CentersService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateCenterDto) {
    return this.centersService.create(dto);
  }

  @Public()
  @Get()
  findAll() {
    return this.centersService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.centersService.findOne(id);
  }

  @Public()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCenterDto) {
    return this.centersService.update(id, dto);
  }

  @Public()
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'trial' | 'expired',
    @Body('days') days?: number,
  ) {
    return this.centersService.updateStatus(id, status, days ?? 30);
  }

  @Public()
  @Post(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body('password') password?: string,
  ) {
    return this.centersService.resetDirectorPassword(id, password || 'admin123');
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.centersService.remove(id);
  }
}
