import { Module } from '@nestjs/common';
import { AuditModule } from '../../common/audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ProductImageAiService } from './product-image-ai.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductImageAiService],
})
export class ProductsModule {}
