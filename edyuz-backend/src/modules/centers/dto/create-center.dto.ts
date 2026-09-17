import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCenterDto {
  @IsNotEmpty({ message: 'Markaz nomi kiritilishi shart' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Markaz telefoni kiritilishi shart' })
  @IsString()
  phone: string;
}
