import { ApiProperty } from '@nestjs/swagger';

export class ImportUserErrorDto {
  @ApiProperty({ example: 2, description: 'Số thứ tự dòng trong file Excel (tính cả header)' })
  row!: number;

  @ApiProperty({ example: 'staff.english@eduflow.dev' })
  email!: string;

  @ApiProperty({ example: 'Email đã được sử dụng' })
  reason!: string;
}

export class ImportUsersResultDto {
  @ApiProperty({ example: 8 })
  successCount!: number;

  @ApiProperty({ example: 2 })
  failedCount!: number;

  @ApiProperty({ type: [ImportUserErrorDto] })
  errors!: ImportUserErrorDto[];
}
