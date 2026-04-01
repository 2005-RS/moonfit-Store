import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CombosService } from './combos.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';

@ApiTags('combos')
@Controller('combos')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List combos (admin only)' })
  findAll() {
    return this.combosService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'List active combos for the storefront' })
  findActive() {
    return this.combosService.findActive();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create a combo (admin only)' })
  create(@Body() body: CreateComboDto) {
    return this.combosService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update a combo (admin only)' })
  update(@Param('id') id: string, @Body() body: UpdateComboDto) {
    return this.combosService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete a combo (admin only)' })
  remove(@Param('id') id: string) {
    return this.combosService.remove(id);
  }
}
