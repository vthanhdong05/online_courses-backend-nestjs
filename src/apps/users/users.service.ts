import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import type { QueryFilter } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersQueryDto } from './dto/get-users.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { UserModel } from './schemas/user.schema';
import { User, UserDocument, UserRole } from './schemas/user.schema';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: UserModel) {}

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

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).select('+password');
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
}
