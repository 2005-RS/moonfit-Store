import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MailModule } from './common/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CombosModule } from './modules/combos/combos.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    AuthModule,
    CustomersModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    CampaignsModule,
    CombosModule,
    OrdersModule,
    InventoryModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
