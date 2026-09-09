import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { SkipAuth } from '../auth/auth.decorator';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @SkipAuth()
  @Post()
  @ApiOperation({ summary: 'Tạo Category mới' })
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.create(dto);
    return CategoryResponseDto.fromDocument(category);
  }

  @SkipAuth()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả Category' })
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesService.findAll();
    return CategoryResponseDto.fromDocuments(categories);
  }

  @SkipAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết 1 Category' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.findOne(id);
    return CategoryResponseDto.fromDocument(category);
  }

  @SkipAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật Category' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.update(id, dto);
    return CategoryResponseDto.fromDocument(category);
  }

  @SkipAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm Category' })
  async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.remove(id);
    return CategoryResponseDto.fromDocument(category);
  }
}
