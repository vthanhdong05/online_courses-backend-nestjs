import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo Đơn hàng mua Khóa học (Server tự động lấy giá từ DB)' })
  async create(
    @CurrentUser('userId') studentId: string,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.create(studentId, dto);
    return OrderResponseDto.fromDocument(order);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy danh sách Đơn hàng của Học viên đang đăng nhập' })
  async findMyOrders(@CurrentUser('userId') studentId: string): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.findByStudentId(studentId);
    return OrderResponseDto.fromDocuments(orders);
  }

  @Post(':id/confirm-payment')
  @ApiOperation({
    summary: 'Giả lập webhook xác nhận thanh toán Đơn hàng (Idempotent - Nối Order -> Enrollment)',
  })
  async confirmPayment(@Param('id', ParseObjectIdPipe) id: string): Promise<OrderResponseDto> {
    // TODO: Xác thực chữ ký checksum/HMAC của cổng thanh toán thật (VNPay/Momo) tại đây
    const order = await this.ordersService.confirmPayment(id);
    return OrderResponseDto.fromDocument(order);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng chưa thanh toán' })
  async cancelOrder(@Param('id', ParseObjectIdPipe) id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.cancelOrder(id);
    return OrderResponseDto.fromDocument(order);
  }
}
