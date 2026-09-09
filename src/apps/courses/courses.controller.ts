import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { SkipAuth } from '../auth/auth.decorator';
import { CoursesService } from './courses.service';
import { CourseResponseDto, PaginatedCoursesResponseDto } from './dto/course-response.dto';
import { ChangeCourseStatusDto } from './dto/change-course-status.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { GetCoursesQueryDto } from './dto/get-courses.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @SkipAuth()
  @Post()
  @ApiOperation({ summary: 'Tạo Khóa học mới (mặc định trạng thái draft)' })
  async create(@Body() dto: CreateCourseDto): Promise<CourseResponseDto> {
    const course = await this.coursesService.create(dto);
    return CourseResponseDto.fromDocument(course);
  }

  @SkipAuth()
  @Get()
  @ApiOperation({ summary: 'Danh sách Khóa học (có phân trang & filter)' })
  async findAll(@Query() query: GetCoursesQueryDto): Promise<PaginatedCoursesResponseDto> {
    const { items, totalItems, totalPages } = await this.coursesService.findAll(query);
    return {
      items: CourseResponseDto.fromDocuments(items),
      totalItems,
      totalPages,
      page: query.page,
      limit: query.limit,
    };
  }

  @SkipAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết 1 Khóa học' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<CourseResponseDto> {
    const course = await this.coursesService.findOne(id);
    return CourseResponseDto.fromDocument(course);
  }

  @SkipAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin Khóa học (không bao gồm trạng thái status)' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    const course = await this.coursesService.update(id, dto);
    return CourseResponseDto.fromDocument(course);
  }

  @SkipAuth()
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Chuyển trạng thái Khóa học theo State Machine (draft -> ready -> published)',
  })
  async changeStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ChangeCourseStatusDto,
  ): Promise<CourseResponseDto> {
    const course = await this.coursesService.changeStatus(id, dto);
    return CourseResponseDto.fromDocument(course);
  }

  @SkipAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm Khóa học' })
  async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<CourseResponseDto> {
    const course = await this.coursesService.remove(id);
    return CourseResponseDto.fromDocument(course);
  }
}
