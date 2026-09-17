import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceRecordDto {
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase() : value)
  @IsEnum(AttendanceStatus, { message: 'Holat present, absent yoki late bo\'lishi kerak' })
  status: AttendanceStatus;
}

export class MarkAttendanceDto {
  @IsNotEmpty({ message: 'Guruh ID kiritilishi shart' })
  @IsString()
  groupId: string;

  @IsNotEmpty({ message: 'Sana kiritilishi shart' })
  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
