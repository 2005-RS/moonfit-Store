import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MailService } from '../../common/mail/mail.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { OrdersService } from './orders.service';

@Injectable()
export class OrderRemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderRemindersService.name);
  private intervalHandle?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly ordersService: OrdersService,
    private readonly mailService: MailService,
  ) {}

  onModuleInit() {
    if (!this.mailService.isConfigured()) {
      return;
    }

    void this.runSweep('startup');

    const intervalHours = Math.max(
      1,
      Number(process.env.CREDIT_REMINDER_INTERVAL_HOURS ?? 6),
    );

    this.intervalHandle = setInterval(
      () => {
        void this.runSweep('interval');
      },
      intervalHours * 60 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  async runManualSweep(actor?: AuthenticatedUser | null) {
    return this.runSweep('manual', actor);
  }

  private async runSweep(
    trigger: 'startup' | 'interval' | 'manual',
    actor?: AuthenticatedUser | null,
  ) {
    if (this.isRunning) {
      return {
        trigger,
        processed: 0,
        sent: 0,
        failed: 0,
        skipped: true,
      };
    }

    this.isRunning = true;

    try {
      const result =
        await this.ordersService.processDueSoonCreditReminders(actor);

      this.logger.log(
        `Credit reminder sweep (${trigger}) processed=${result.processed} sent=${result.sent} failed=${result.failed}.`,
      );

      return {
        trigger,
        ...result,
        skipped: false,
      };
    } finally {
      this.isRunning = false;
    }
  }
}
