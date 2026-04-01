import 'dotenv/config';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createMssqlAdapter } from './mssql.adapter';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      adapter: createMssqlAdapter(),
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to SQL Server.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma connection closed.');
  }

  async getHealthStatus() {
    try {
      await this.$queryRawUnsafe('SELECT 1');

      return {
        status: 'ok',
        provider: 'sqlserver',
      } as const;
    } catch (error) {
      this.logger.error('Database health check failed.', error);

      return {
        status: 'error',
        provider: 'sqlserver',
      } as const;
    }
  }
}
