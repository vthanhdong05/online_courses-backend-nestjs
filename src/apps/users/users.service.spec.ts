import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { ExcelUtilService } from 'src/common/utils/excel-util/excel-util.service';
import { UserRole, UserStatus } from './schemas/user.schema';
import { UsersService } from './users.service';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;
  let excelUtilService: jest.Mocked<ExcelUtilService>;
  let saveMock: jest.Mock;

  const buildQueryChain = (resolvedValue: unknown) => {
    const chain: any = {
      sort: jest.fn(),
      skip: jest.fn(),
      limit: jest.fn(),
      select: jest.fn().mockResolvedValue(resolvedValue),
      lean: jest.fn(),
      exec: jest.fn().mockResolvedValue(resolvedValue),
    };
    chain.sort.mockReturnValue(chain);
    chain.skip.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    chain.lean.mockReturnValue(chain);
    return chain;
  };

  beforeEach(async () => {
    saveMock = jest.fn().mockResolvedValue({ _id: 'user-id', email: 'staff@eduflow.dev' });

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

    const mockExcelUtilService = {
      generateExcel: jest.fn(),
      read: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          useValue: userModel,
        },
        {
          provide: ExcelUtilService,
          useValue: mockExcelUtilService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    excelUtilService = module.get(ExcelUtilService);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

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
        email: 'Student@EduFlow.dev',
        password: 'plain-password',
        fullName: 'Student Test',
      });

      expect(userModel).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'student@eduflow.dev',
          role: UserRole.STUDENT,
        }),
      );
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
        email: 'staff',
      });

      expect(userModel.find).toHaveBeenCalledWith({
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        email: { $regex: 'staff', $options: 'i' },
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

  describe('findByEmailWithPassword', () => {
    it('tìm kiếm user theo email viết thường và chọn thêm password', async () => {
      const user = { _id: 'id-1', email: 'test@eduflow.dev', password: 'hashed-password' };
      userModel.findOne.mockReturnValue(buildQueryChain(user));

      const result = await service.findByEmailWithPassword(' TEST@EduFlow.dev ');
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@eduflow.dev' });
      expect(result).toBe(user);
    });
  });

  describe('update', () => {
    it('ném NotFoundException nếu không tìm thấy user để cập nhật', async () => {
      userModel.findByIdAndUpdate.mockResolvedValue(null);
      await expect(service.update('missing-id', { fullName: 'New Name' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('cập nhật thành công và trả về user mới', async () => {
      const updatedUser = { _id: 'id-1', fullName: 'New Name' };
      userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.update('id-1', { fullName: 'New Name' });
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id-1',
        { $set: { fullName: 'New Name' } },
        { new: true },
      );
      expect(result).toBe(updatedUser);
    });
  });

  describe('remove', () => {
    it('ném NotFoundException nếu softDeleteById trả null', async () => {
      userModel.softDeleteById.mockResolvedValue(null);
      await expect(service.remove('id-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('xoá mềm thành công và trả về user', async () => {
      const deletedUser = { _id: 'id-1', deletedAt: new Date() };
      userModel.softDeleteById.mockResolvedValue(deletedUser);

      const result = await service.remove('id-1');
      expect(userModel.softDeleteById).toHaveBeenCalledWith('id-1');
      expect(result).toBe(deletedUser);
    });
  });

  describe('restore', () => {
    it('ném NotFoundException nếu restoreById trả null', async () => {
      userModel.restoreById.mockResolvedValue(null);
      await expect(service.restore('id-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('khôi phục thành công và trả về user', async () => {
      const restoredUser = { _id: 'id-1', deletedAt: null };
      userModel.restoreById.mockResolvedValue(restoredUser);

      const result = await service.restore('id-1');
      expect(userModel.restoreById).toHaveBeenCalledWith('id-1');
      expect(result).toBe(restoredUser);
    });
  });

  describe('exportUsers', () => {
    it('lấy danh sách user và gọi excelUtilService.generateExcel', async () => {
      const users = [
        {
          email: 'user1@eduflow.dev',
          fullName: 'User One',
          phone: '0901234567',
          role: UserRole.STAFF,
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
        },
      ];
      userModel.find.mockReturnValue(buildQueryChain(users));
      excelUtilService.generateExcel.mockReturnValue({} as any);

      const result = await service.exportUsers({ page: 1, limit: 10 });

      expect(userModel.find).toHaveBeenCalled();
      expect(excelUtilService.generateExcel).toHaveBeenCalledWith(
        expect.objectContaining({
          worksheets: expect.arrayContaining([
            expect.objectContaining({
              sheetName: 'Users',
            }),
          ]),
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('importUsers', () => {
    it('đọc file excel, tạo user thành công và tổng hợp các hàng lỗi', async () => {
      const mockFile = { buffer: Buffer.from('') } as any;
      const rows = [
        {
          email: 'newstaff@eduflow.dev',
          password: 'pass',
          fullName: 'New Staff',
          role: UserRole.STAFF,
        },
        {
          email: 'existing@eduflow.dev',
          password: 'pass',
          fullName: 'Existing User',
        },
        {
          email: '',
          password: 'pass',
        },
      ];

      excelUtilService.read.mockResolvedValue(rows);
      userModel.findOne
        .mockResolvedValueOnce(null) // cho hàng 1 -> thành công
        .mockResolvedValueOnce({ _id: 'exist' }); // cho hàng 2 -> lỗi trùng email

      const result = await service.importUsers(mockFile);

      expect(excelUtilService.read).toHaveBeenCalledWith(mockFile);
      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].row).toBe(3); // index 1 + 2
      expect(result.errors[1].row).toBe(4); // index 2 + 2
    });
  });
});
