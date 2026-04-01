import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get inventory overview (admin only)' })
  getOverview() {
    return this.inventoryService.getOverview();
  }

  @Patch('adjust')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Adjust product stock (admin only)' })
  adjustStock(
    @Body() body: AdjustInventoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.adjustStock(body, user);
  }
}
