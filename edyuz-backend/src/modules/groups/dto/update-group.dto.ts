import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  // Kunlar matn ("Dush-Chor-Jum") yoki ro'yxat ko'rinishida kelishi mumkin
  @IsOptional()
  days?: any;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Vaqt formati noto\'g\'ri (HH:mm)' })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Vaqt formati noto\'g\'ri (HH:mm)' })
  endTime?: string;
}
