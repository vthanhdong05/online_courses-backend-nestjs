import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Workbook } from 'exceljs';
import type { QueryFilter } from 'mongoose';
import { ExcelUtilService } from 'src/common/utils/excel-util/excel-util.service';
import type { File } from '../../common/utils/excel-util/dto/excel-util.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersQueryDto } from './dto/get-users.dto';
import { ImportUserErrorDto, ImportUsersResultDto } from './dto/import-users-result.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { UserModel } from './schemas/user.schema';
import { User, UserDocument, UserProvider, UserRole, UserStatus } from './schemas/user.schema';

const SALT_ROUNDS = 10;

const EXPORT_FIELDS = ['email', 'fullName', 'phone', 'role', 'status', 'createdAt'];
interface ImportUserRow {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  role?: string;
}
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: UserModel,
    private readonly excelUtilService: ExcelUtilService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    if (dto.role === UserRole.STUDENT) {
      throw new ConflictException(
        'Student phải tự đăng ký qua /auth/sign-up, không tạo qua endpoint này',
      );
    }
    return this.createUserDocument(dto, dto.role);
  }

  async registerStudent(dto: RegisterStudentDto): Promise<UserDocument> {
    return this.createUserDocument(dto, UserRole.STUDENT);
  }

  private async createUserDocument(
    dto: CreateUserDto | RegisterStudentDto,
    role: UserRole,
  ): Promise<UserDocument> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException(`Email ${email} đã được sử dụng`);
    }
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const created = new this.userModel({
      ...dto,
      email,
      password: hashedPassword,
      role,
    });
    return created.save();
  }

  async findAll(
    query: GetUsersQueryDto,
  ): Promise<{ items: UserDocument[]; totalItems: number; totalPages: number }> {
    const { page, limit, role, status, email } = query;
    const filter: QueryFilter<UserDocument> = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (email) filter.email = { $regex: email.trim(), $options: 'i' };

    const skip = (page - 1) * limit;
    const [items, totalItems] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filter),
    ]);

    return { items, totalItems, totalPages: Math.ceil(totalItems / limit) || 1 };
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy user với id ${id}`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).select('+password');
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    return user?.role === UserRole.ADMIN;
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId });
  }

  async findOrCreateFromGoogle(profile: {
    googleId: string;
    email: string;
    fullName?: string;
    avatar?: string;
  }): Promise<UserDocument> {
    const email = profile.email.toLowerCase().trim();
    const user = await this.userModel.findOne({
      $or: [{ googleId: profile.googleId }, { email }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.googleId;
        user.provider = UserProvider.GOOGLE;
        if (profile.avatar && !user.avatar) user.avatar = profile.avatar;
        await user.save();
      }
      return user;
    }

    const created = new this.userModel({
      email,
      fullName: profile.fullName || email.split('@')[0],
      avatar: profile.avatar,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      provider: UserProvider.GOOGLE,
      googleId: profile.googleId,
    });
    return created.save();
  }

  async setResetToken(userId: string, token: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { resetToken: token });
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ resetToken: token }).select('+resetToken');
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      resetToken: null,
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy user với id ${id}`);
    }
    return user;
  }

  async remove(id: string): Promise<UserDocument> {
    const user = await this.userModel.softDeleteById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy user với id ${id} (hoặc đã bị xoá trước đó)`);
    }
    return user;
  }

  async restore(id: string): Promise<UserDocument> {
    const user = await this.userModel.restoreById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy user với id ${id} (hoặc chưa từng bị xoá)`);
    }
    return user;
  }

  private buildFilter({ role, status, email }: GetUsersQueryDto): QueryFilter<UserDocument> {
    const filter: QueryFilter<UserDocument> = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (email) filter.email = { $regex: email.trim(), $options: 'i' };
    return filter;
  }

  async exportUsers(query: GetUsersQueryDto): Promise<Workbook> {
    const filter = this.buildFilter(query);
    const users = await this.userModel.find(filter).sort({ createdAt: -1 }).lean().exec();

    return this.excelUtilService.generateExcel({
      worksheets: [
        {
          sheetName: 'Users',
          data: users.map((user) => ({
            email: user.email,
            fullName: user.fullName,
            phone: user.phone ?? '',
            role: user.role,
            status: user.status,
            createdAt: (user as any).createdAt,
          })),
          fieldsInclude: EXPORT_FIELDS,
        },
      ],
    });
  }

  async importUsers(file: File): Promise<ImportUsersResultDto> {
    const rows = (await this.excelUtilService.read(file)) as ImportUserRow[];

    const errors: ImportUserErrorDto[] = [];
    let successCount = 0;

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2; // +2: bù dòng header + index 0-based
      const email = row.email?.toLowerCase().trim();

      try {
        if (!email || !row.password || !row.fullName) {
          throw new Error('Thiếu email, password hoặc fullName');
        }
        const role =
          row.role && Object.values(UserRole).includes(row.role as UserRole)
            ? (row.role as UserRole)
            : UserRole.STAFF;

        const existing = await this.userModel.findOne({ email });
        if (existing) {
          throw new Error(`Email ${email} đã được sử dụng`);
        }

        const hashedPassword = await bcrypt.hash(row.password, SALT_ROUNDS);
        await new this.userModel({
          email,
          password: hashedPassword,
          fullName: row.fullName,
          phone: row.phone,
          role,
          status: UserStatus.ACTIVE,
        }).save();

        successCount += 1;
      } catch (error) {
        errors.push({
          row: rowNumber,
          email: email ?? '(không có email)',
          reason: error instanceof Error ? error.message : 'Lỗi không xác định',
        });
      }
    }

    return { successCount, failedCount: errors.length, errors };
  }
}
