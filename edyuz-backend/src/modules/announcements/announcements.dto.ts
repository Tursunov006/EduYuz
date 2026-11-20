import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty({ message: 'Sarlavha kiritilishi shart' })
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty({ message: "E'lon matni kiritilishi shart" })
  @MaxLength(4000)
  content: string;

  @IsOptional()
  @IsIn(['all', 'students', 'parents', 'teachers'])
  target?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  @IsBoolean()
  sendTelegram?: boolean;
}

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
