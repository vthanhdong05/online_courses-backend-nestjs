import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { SkipAuth } from '../auth/auth.decorator';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { InstructorResponseDto } from './dto/instructor-response.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { InstructorsService } from './instructors.service';

@ApiTags('instructors')
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @SkipAuth()
  @Post()
  @ApiOperation({ summary: 'Tạo Giảng viên mới' })
  async create(@Body() dto: CreateInstructorDto): Promise<InstructorResponseDto> {
    const instructor = await this.instructorsService.create(dto);
    return InstructorResponseDto.fromDocument(instructor);
  }

  @SkipAuth()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả Giảng viên' })
  async findAll(): Promise<InstructorResponseDto[]> {
    const instructors = await this.instructorsService.findAll();
    return InstructorResponseDto.fromDocuments(instructors);
  }

  @SkipAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết 1 Giảng viên' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<InstructorResponseDto> {
    const instructor = await this.instructorsService.findOne(id);
    return InstructorResponseDto.fromDocument(instructor);
  }

  @SkipAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin Giảng viên' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateInstructorDto,
  ): Promise<InstructorResponseDto> {
    const instructor = await this.instructorsService.update(id, dto);
    return InstructorResponseDto.fromDocument(instructor);
  }

  @SkipAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm Giảng viên' })
  async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<InstructorResponseDto> {
    const instructor = await this.instructorsService.remove(id);
    return InstructorResponseDto.fromDocument(instructor);
  }
}
