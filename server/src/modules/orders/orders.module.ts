import { Module } from '@nestjs/common';
import { AuditModule } from '../../common/audit/audit.module';
import { MailModule } from '../../common/mail/mail.module';
import { AuthModule } from '../auth/auth.module';
import { OrderRemindersService } from './order-reminders.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, AuditModule, MailModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRemindersService],
})
export class OrdersModule {}
