import { IsNotEmpty, IsString } from 'class-validator';

export class AddStudentToGroupDto {
  @IsNotEmpty({ message: 'O\'quvchi ID kiritilishi shart' })
  @IsString()
  studentId: string;
}
