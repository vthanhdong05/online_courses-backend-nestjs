import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from './schemas/user.schema';
import { UsersService } from './users.service';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;
  let saveMock: jest.Mock;

  const buildQueryChain = (resolvedValue: unknown) => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedValue),
  });

  beforeEach(() => {
    saveMock = jest.fn().mockResolvedValue({ _id: 'user-id' });

    // userModel vừa đóng vai trò constructor (`new this.userModel(...)`)
    // vừa có các static method (`this.userModel.findOne(...)`), nên mock ở
    // đây phải là 1 jest.fn() constructor kèm các method gắn thêm vào.
    userModel = jest.fn().mockImplementation((doc: Record<string, unknown>) => ({
      ...doc,
      save: saveMock,
    }));
    userModel.findOne = jest.fn();
    userModel.findById = jest.fn();
    userModel.find = jest.fn();
    userModel.countDocuments = jest.fn();
    userModel.findByIdAndUpdate = jest.fn();
    userModel.softDeleteById = jest.fn();
    userModel.restoreById = jest.fn();

    service = new UsersService(userModel);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = {
      email: 'Staff@EduFlow.dev',
      password: 'plain-password',
      fullName: 'Staff Test',
      role: UserRole.STAFF,
    };

    it('từ chối tạo user với role STUDENT qua endpoint admin', async () => {
      await expect(service.create({ ...dto, role: UserRole.STUDENT })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it('ném ConflictException nếu email đã tồn tại', async () => {
      userModel.findOne.mockResolvedValue({ _id: 'existing' });
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('hash password và lowercase email trước khi lưu', async () => {
      userModel.findOne.mockResolvedValue(null);
      await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(userModel).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'staff@eduflow.dev',
          password: 'hashed-password',
          role: UserRole.STAFF,
        }),
      );
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('registerStudent', () => {
    it('luôn ép role = STUDENT bất kể input', async () => {
      userModel.findOne.mockResolvedValue(null);
      await service.registerStudent({
        email: 'student@eduflow.dev',
        password: 'plain-password',
        fullName: 'Student Test',
      });

      expect(userModel).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.STUDENT }));
    });
  });

  describe('findAll', () => {
    it('trả về danh sách kèm phân trang, filter được build từ query', async () => {
      const items = [{ _id: '1' }, { _id: '2' }];
      userModel.find.mockReturnValue(buildQueryChain(items));
      userModel.countDocuments.mockResolvedValue(2);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
      });

      expect(userModel.find).toHaveBeenCalledWith({
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
      });
      expect(result).toEqual({ items, totalItems: 2, totalPages: 1 });
    });
  });

  describe('findOne', () => {
    it('ném NotFoundException nếu không tìm thấy user', async () => {
      userModel.findById.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('trả về user nếu tìm thấy', async () => {
      const user = { _id: 'id-1' };
      userModel.findById.mockResolvedValue(user);
      await expect(service.findOne('id-1')).resolves.toBe(user);
    });
  });

  describe('remove / restore', () => {
    it('remove: ném NotFoundException nếu softDeleteById trả null', async () => {
      userModel.softDeleteById.mockResolvedValue(null);
      await expect(service.remove('id-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('restore: ném NotFoundException nếu restoreById trả null', async () => {
      userModel.restoreById.mockResolvedValue(null);
      await expect(service.restore('id-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
