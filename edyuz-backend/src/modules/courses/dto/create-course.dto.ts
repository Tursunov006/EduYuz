import { IsOptional, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateCourseDto {
  // Markaz serverda foydalanuvchi tokenidan aniqlanadi; bu maydon faqat superadmin uchun
  @IsOptional()
  @IsString()
  centerId?: string;

  @IsNotEmpty({ message: 'Kurs nomi (title) kiritilishi shart' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Kurs narxi kiritilishi shart' })
  @IsNumber()
  @IsPositive()
  price: number;
}
