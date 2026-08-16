import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserDocument, UserRole, UserStatus } from '../schemas/user.schema';

export class UserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() fullName!: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() avatar?: string;
  @ApiProperty({ enum: UserRole }) role!: UserRole;
  @ApiProperty({ enum: UserStatus }) status!: UserStatus;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static fromDocument(doc: UserDocument): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = doc._id.toString();
    dto.email = doc.email;
    dto.fullName = doc.fullName;
    dto.phone = doc.phone;
    dto.avatar = doc.avatar;
    dto.role = doc.role;
    dto.status = doc.status;
    dto.createdAt = (doc as any).createdAt;
    dto.updatedAt = (doc as any).updatedAt;
    return dto;
  }

  static fromDocuments(docs: UserDocument[]): UserResponseDto[] {
    return docs.map((doc) => UserResponseDto.fromDocument(doc));
  }
}
