import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AdminCustomerListQueryDto } from './dto/admin-customer-list-query.dto';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ResetCustomerPasswordDto } from './dto/reset-customer-password.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get the authenticated customer profile' })
  findMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.findProfileByUserId(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update the authenticated customer profile' })
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateCustomerDto,
  ) {
    return this.customersService.updateProfileByUserId(user.id, body);
  }

  @Get('me/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'List favorite products for the authenticated customer',
  })
  findMyFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.findFavoritesByUserId(user.id);
  }

  @Post('me/favorites/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Add a favorite product for the authenticated customer',
  })
  addFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
  ) {
    return this.customersService.addFavoriteByUserId(user.id, productId);
  }

  @Delete('me/favorites/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Remove a favorite product for the authenticated customer',
  })
  removeFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
  ) {
    return this.customersService.removeFavoriteByUserId(user.id, productId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List customers (admin only)' })
  findAll() {
    return this.customersService.findAll();
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List customers with admin filters and pagination' })
  findAdminList(@Query() query: AdminCustomerListQueryDto) {
    return this.customersService.findAdminList(query);
  }

  @Get('admin/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="customers.csv"')
  @ApiOperation({ summary: 'Export customers as CSV (admin only)' })
  exportCsv() {
    return this.customersService.exportCsv();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get a customer by id (admin only)' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create a customer (admin only)' })
  create(@Body() body: CreateCustomerDto) {
    return this.customersService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update a customer (admin only)' })
  update(@Param('id') id: string, @Body() body: UpdateCustomerDto) {
    return this.customersService.update(id, body);
  }

  @Patch(':id/password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Reset a customer password from the admin panel (admin only)',
  })
  resetPassword(
    @Param('id') id: string,
    @Body() body: ResetCustomerPasswordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customersService.resetPassword(id, body.password, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete a customer (admin only)' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
