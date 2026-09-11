import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { Roles, SkipAuth } from '../auth/auth.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { SubscriptionPlanResponseDto } from './dto/subscription-plan-response.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlansService } from './subscription-plans.service';

@ApiTags('subscription-plans')
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly plansService: SubscriptionPlansService) {}

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post()
  @ApiOperation({ summary: 'Tạo Gói VIP mới (Admin/Staff)' })
  async create(@Body() dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.plansService.create(dto);
    return SubscriptionPlanResponseDto.fromDocument(plan);
  }

  @SkipAuth()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các Gói VIP' })
  async findAll(): Promise<SubscriptionPlanResponseDto[]> {
    const plans = await this.plansService.findAll();
    return SubscriptionPlanResponseDto.fromDocuments(plans);
  }

  @SkipAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 Gói VIP' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.plansService.findOne(id);
    return SubscriptionPlanResponseDto.fromDocument(plan);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật Gói VIP (Admin/Staff)' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.plansService.update(id, dto);
    return SubscriptionPlanResponseDto.fromDocument(plan);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm Gói VIP (Admin/Staff)' })
  async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.plansService.remove(id);
    return SubscriptionPlanResponseDto.fromDocument(plan);
  }
}
