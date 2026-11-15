import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateNewsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title: string;

  @IsString()
  @MinLength(2)
  @MaxLength(5000)
  body: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] }, { message: "Havola https:// bilan boshlanishi kerak" })
  @MaxLength(500)
  link?: string;
}
