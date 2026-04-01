import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../common/audit/audit.service';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            isConfigured: jest.fn(() => false),
            sendOrderConfirmation: jest.fn(),
            sendCreditDueReminder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('generates unique order numbers without querying the latest persisted order', () => {
    const firstOrderNumber = (
      service as never as { generateOrderNumber: () => string }
    ).generateOrderNumber();
    const secondOrderNumber = (
      service as never as { generateOrderNumber: () => string }
    ).generateOrderNumber();

    expect(firstOrderNumber).toMatch(/^ORD-[A-Z0-9]+-[A-F0-9]{6}$/);
    expect(secondOrderNumber).toMatch(/^ORD-[A-Z0-9]+-[A-F0-9]{6}$/);
    expect(firstOrderNumber).not.toBe(secondOrderNumber);
  });
});
