import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { File as MulterFile } from 'multer';
import { paymentProofStorage } from '../../common/uploads/uploads.util';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AdminOrderListQueryDto } from './dto/admin-order-list-query.dto';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { OrderRemindersService } from './order-reminders.service';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderRemindersService: OrderRemindersService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List orders for the authenticated customer' })
  findMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findForCustomer(user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List orders (admin only)' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List orders with admin filters and pagination' })
  findAdminList(@Query() query: AdminOrderListQueryDto) {
    return this.ordersService.findAdminList(query);
  }

  @Get('admin/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="orders.csv"')
  @ApiOperation({ summary: 'Export orders as CSV (admin only)' })
  exportCsv() {
    return this.ordersService.exportCsv();
  }

  @Post('admin/credit-reminders/run')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Run credit due reminder emails manually (admin only)',
  })
  runCreditReminders(@CurrentUser() user: AuthenticatedUser) {
    return this.orderRemindersService.runManualSweep(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get an order by id (admin only)' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  create(@Body() body: CreateOrderDto) {
    return this.ordersService.create(body, null);
  }

  @Post(':id/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Create a reorder from a previous authenticated customer order',
  })
  reorder(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.reorder(id, user);
  }

  @Post(':id/payments')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('proof', {
      storage: paymentProofStorage(),
    }),
  )
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateOrderPaymentDto })
  @ApiOperation({ summary: 'Register an order payment (admin only)' })
  createPayment(
    @Param('id') id: string,
    @Body() body: CreateOrderPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() proof?: MulterFile,
  ) {
    const proofPath = proof?.filename
      ? `/uploads/payment-proofs/${proof.filename}`
      : null;

    return this.ordersService.recordPayment(id, body, user, proofPath, 'ADMIN');
  }

  @Post(':id/report-payment')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('proof', {
      storage: paymentProofStorage(),
    }),
  )
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateOrderPaymentDto })
  @ApiOperation({ summary: 'Report a customer payment with proof' })
  reportPayment(
    @Param('id') id: string,
    @Body() body: CreateOrderPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() proof?: MulterFile,
  ) {
    const proofPath = proof?.filename
      ? `/uploads/payment-proofs/${proof.filename}`
      : null;

    return this.ordersService.recordPayment(
      id,
      body,
      user,
      proofPath,
      'CUSTOMER',
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update order status (admin only)' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateStatus(id, body.status ?? 'PENDING', user);
  }
}
