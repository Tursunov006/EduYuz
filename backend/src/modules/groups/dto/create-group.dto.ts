import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateGroupDto {
  @IsOptional()
  @IsString()
  centerId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsNotEmpty({ message: 'Guruh nomi kiritilishi shart' })
  @IsString()
  name: string;

  @IsOptional()
  days?: any;

  @IsNotEmpty({ message: 'Dars boshlanish vaqti kiritilishi shart (masalan: 14:00)' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Vaqt formati noto\'g\'ri (HH:mm)' })
  startTime: string;

  @IsNotEmpty({ message: 'Dars tugash vaqti kiritilishi shart (masalan: 16:00)' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Vaqt formati noto\'g\'ri (HH:mm)' })
  endTime: string;
}
