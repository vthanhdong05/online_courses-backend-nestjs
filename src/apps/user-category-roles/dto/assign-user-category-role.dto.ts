import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class AssignUserCategoryRoleDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1', description: 'ID của User' })
  @IsMongoId()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d2', description: 'ID của Category' })
  @IsMongoId()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({
    example: ['course:create', 'course:update', 'course:publish', 'course:delete'],
    description: 'Danh sách các quyền cấp cho User trên Category này',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  permissions!: string[];
}
