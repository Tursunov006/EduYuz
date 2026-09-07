import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty({ message: 'Markaz ID (centerId) kiritilishi shart' })
  @IsString()
  centerId: string;

  @IsNotEmpty({ message: 'Kurs nomi (title) kiritilishi shart' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Kurs narxi kiritilishi shart' })
  @IsNumber()
  @IsPositive()
  price: number;
}
