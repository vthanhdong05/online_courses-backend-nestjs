import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  items!: UserResponseDto[];

  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
}
