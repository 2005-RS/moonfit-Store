import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('system')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get API summary information' })
  getApiInfo() {
    return {
      name: 'eccomers-api',
      status: 'ok',
      message: 'NestJS backend base for ecommerce is running.',
      modules: [
        'auth',
        'customers',
        'products',
        'categories',
        'brands',
        'orders',
        'inventory',
      ],
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get API health status' })
  async getHealth() {
    const database = await this.prisma.getHealthStatus();

    return {
      status: database.status === 'ok' ? 'ok' : 'degraded',
      service: 'eccomers-api',
      database,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
