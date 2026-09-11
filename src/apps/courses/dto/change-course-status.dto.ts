import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { CourseStatus } from '../schemas/course.schema';

export class ChangeCourseStatusDto {
  @ApiProperty({ enum: CourseStatus, example: CourseStatus.READY })
  @IsEnum(CourseStatus)
  @IsNotEmpty()
  status!: CourseStatus;
}
