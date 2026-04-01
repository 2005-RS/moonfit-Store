import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { MailService } from '../../common/mail/mail.service';
import { toCsv } from '../../common/utils/csv.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  COLLECTION_STATUSES,
  INVENTORY_MOVEMENT_TYPES,
  ORDER_STATUSES,
  PAYMENT_TYPES,
  type CollectionStatus,
  type OrderStatus,
  type PaymentType,
} from '../../common/domain/domain.constants';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AdminOrderListQueryDto } from './dto/admin-order-list-query.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  ) {}

  findAll() {
    return this.prisma.order.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findForCustomer(userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!customer) {
      return [];
    }

    return this.prisma.order.findMany({
      where: {
        customerId: customer.id,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                goals: {
                  orderBy: {
                    goal: 'asc',
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAdminList(
    query: AdminOrderListQueryDto,
  ): Promise<
    PaginatedResponse<
      Awaited<ReturnType<typeof this.prisma.order.findMany>>[number]
    >
  > {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const search = query.search?.trim();
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDirection = query.sortDirection ?? 'desc';
    const dateFrom = query.dateFrom
      ? new Date(`${query.dateFrom}T00:00:00.000Z`)
      : undefined;
    const dateTo = query.dateTo
      ? new Date(`${query.dateTo}T23:59:59.999Z`)
      : undefined;

    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search } },
              { customerName: { contains: search } },
              { customerEmail: { contains: search } },
              { paymentMethod: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          [sortBy]: sortDirection,
        },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found.`);
    }

    return order;
  }

  async exportCsv() {
    const orders = await this.prisma.order.findMany({
      include: {
        items: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return toCsv(
      [
        'id',
        'orderNumber',
        'customerName',
        'customerEmail',
        'status',
        'paymentType',
        'paymentMethod',
        'total',
        'amountPaid',
        'balanceDue',
        'creditReminderSentAt',
        'collectionStatus',
        'createdAt',
        'items',
        'payments',
      ],
      orders.map((order) => [
        order.id,
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.status,
        order.paymentType,
        order.paymentMethod,
        order.total,
        order.amountPaid,
        order.balanceDue,
        order.creditReminderSentAt?.toISOString() ?? '',
        order.collectionStatus,
        order.createdAt.toISOString(),
        order.items.length,
        order.payments.length,
      ]),
    );
  }

  async create(body: CreateOrderDto, actor?: AuthenticatedUser | null) {
    this.validateOrder(body);
    const normalizedCustomerEmail = body.customerEmail.trim().toLowerCase();

    const order = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: {
            in: body.items.map((item) => item.productId),
          },
        },
      });

      if (products.length !== body.items.length) {
        throw new BadRequestException(
          'One or more products in the order do not exist.',
        );
      }

      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );

      let subtotal = 0;

      for (const item of body.items) {
        const product = productsById.get(item.productId);

        if (!product) {
          throw new BadRequestException(
            `Product ${item.productId} does not exist.`,
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Product ${product.name} does not have enough stock.`,
          );
        }

        subtotal += product.price * item.quantity;
      }

      const paymentType = this.resolvePaymentType(body);
      const shipping =
        paymentType === PAYMENT_TYPES[1] ? 0 : (body.shipping ?? 0);
      const total = subtotal + shipping;
      const amountPaid = Math.min(body.amountPaid ?? 0, total);

      let customerId = body.customerId ?? null;
      let customerCreditDays = 0;

      if (!customerId) {
        customerId = await this.resolveCustomerId(tx, normalizedCustomerEmail);
      }

      if (customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          select: {
            id: true,
            creditApproved: true,
            creditLimit: true,
            creditDays: true,
          },
        });

        if (paymentType === PAYMENT_TYPES[1]) {
          if (!customer?.creditApproved) {
            throw new BadRequestException(
              'This customer is not approved for credit orders.',
            );
          }

          if (customer.creditLimit < total) {
            throw new BadRequestException(
              'This order exceeds the customer credit limit.',
            );
          }
        }

        customerCreditDays = customer?.creditDays ?? 0;
      } else if (paymentType === PAYMENT_TYPES[1]) {
        throw new BadRequestException(
          'Credit orders require a registered customer approved for credit.',
        );
      }

      const balanceDue = Math.max(0, total - amountPaid);
      const dueDate =
        paymentType === PAYMENT_TYPES[1]
          ? this.buildDueDate(customerCreditDays)
          : null;
      const collectionStatus = this.resolveCollectionStatus(
        amountPaid,
        balanceDue,
        dueDate,
      );

      const order = await this.createOrderWithUniqueNumber(
        tx,
        body,
        normalizedCustomerEmail,
        customerId,
        productsById,
        subtotal,
        shipping,
        total,
        paymentType,
        amountPaid,
        balanceDue,
        dueDate,
        collectionStatus,
      );

      for (const item of body.items) {
        const product = productsById.get(item.productId)!;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            product: {
              connect: { id: item.productId },
            },
            type: INVENTORY_MOVEMENT_TYPES[1],
            quantity: item.quantity,
            reason: `Order ${order.orderNumber} - ${product.name}`,
          },
        });
      }

      await this.auditService.log({
        entityType: 'ORDER',
        entityId: order.id,
        action: 'ORDER_CREATED',
        summary: `Order ${order.orderNumber} was created for ${order.customerName}.`,
        actor,
        metadata: {
          total,
          status: order.status,
        },
      });

      return order;
    });

    await this.sendOrderConfirmationSafely(order);

    return order;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    actor?: AuthenticatedUser,
  ) {
    const existingOrder = await this.ensureOrderExists(id);

    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    await this.auditService.log({
      entityType: 'ORDER',
      entityId: order.id,
      action: 'ORDER_STATUS_UPDATED',
      summary: `Order ${order.orderNumber} changed from ${existingOrder.status} to ${status}.`,
      actor,
      metadata: {
        previousStatus: existingOrder.status,
        nextStatus: status,
      },
    });

    return order;
  }

  async reorder(id: string, actor: AuthenticatedUser) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId: actor.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        'The authenticated user does not have a customer profile yet.',
      );
    }

    const order = await this.prisma.order.findFirst({
      where: {
        id,
        customerId: customer.id,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        `Order ${id} was not found for the authenticated customer.`,
      );
    }

    return this.create(
      {
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone ?? undefined,
        customerCity: customer.city ?? undefined,
        paymentType: this.normalizePaymentType(order.paymentType),
        paymentMethod: order.paymentMethod,
        amountPaid: 0,
        shipping: order.shipping,
        notes: `Reorder from ${order.orderNumber}`,
        items: order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
      actor,
    );
  }

  async recordPayment(
    id: string,
    body: CreateOrderPaymentDto,
    actor: AuthenticatedUser | null,
    proofImage?: string | null,
    source: 'ADMIN' | 'CUSTOMER' = 'ADMIN',
  ) {
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException(
        'Payment amount must be greater than zero.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              userId: true,
            },
          },
          payments: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Order ${id} not found.`);
      }

      if (order.paymentType !== PAYMENT_TYPES[1]) {
        throw new BadRequestException(
          'Payments can only be registered for credit orders.',
        );
      }

      if (
        source === 'CUSTOMER' &&
        (!actor || order.customer?.userId !== actor.id)
      ) {
        throw new BadRequestException(
          'You are not allowed to register a payment for this order.',
        );
      }

      if (body.amount > order.balanceDue) {
        throw new BadRequestException(
          'Payment amount cannot be greater than the pending balance.',
        );
      }

      await tx.orderPayment.create({
        data: {
          orderId: order.id,
          customerId: order.customerId ?? null,
          amount: body.amount,
          paymentMethod: body.paymentMethod.trim(),
          reference: this.normalizeOptionalText(body.reference),
          notes: this.normalizeOptionalText(body.notes),
          proofImage: proofImage ?? null,
          source,
        },
      });

      const amountPaid = order.amountPaid + body.amount;
      const balanceDue = Math.max(0, order.total - amountPaid);
      const collectionStatus = this.resolveCollectionStatus(
        amountPaid,
        balanceDue,
        order.dueDate,
      );

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          amountPaid,
          balanceDue,
          collectionStatus,
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      await this.auditService.log({
        entityType: 'ORDER',
        entityId: updatedOrder.id,
        action: 'ORDER_PAYMENT_RECORDED',
        summary: `Payment of ${body.amount} was recorded for order ${updatedOrder.orderNumber}.`,
        actor,
        metadata: {
          balanceDue,
          collectionStatus,
          source,
        },
      });

      return updatedOrder;
    });
  }

  async processDueSoonCreditReminders(actor?: AuthenticatedUser | null) {
    const reminderDays = Math.max(
      1,
      Number(process.env.CREDIT_REMINDER_DAYS_BEFORE ?? 3),
    );

    if (!this.mailService.isConfigured()) {
      return {
        processed: 0,
        sent: 0,
        failed: 0,
        reminderDays,
      };
    }

    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + reminderDays);
    windowEnd.setHours(23, 59, 59, 999);

    const orders = await this.prisma.order.findMany({
      where: {
        paymentType: PAYMENT_TYPES[1],
        balanceDue: {
          gt: 0,
        },
        dueDate: {
          not: null,
          gte: windowStart,
          lte: windowEnd,
        },
        creditReminderSentAt: null,
        status: {
          not: ORDER_STATUSES[5],
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        balanceDue: true,
        dueDate: true,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const order of orders) {
      if (!order.dueDate) {
        continue;
      }

      const daysRemaining = this.calculateDaysUntilDue(order.dueDate);

      try {
        await this.mailService.sendCreditDueReminder({
          to: order.customerEmail,
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          balanceDue: order.balanceDue,
          dueDate: order.dueDate,
          daysRemaining,
        });

        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            creditReminderSentAt: new Date(),
          },
        });

        await this.auditService.log({
          entityType: 'ORDER',
          entityId: order.id,
          action: 'ORDER_CREDIT_REMINDER_SENT',
          summary: `Credit due reminder sent to ${order.customerEmail} for order ${order.orderNumber}.`,
          actor,
          metadata: {
            customerEmail: order.customerEmail,
            daysRemaining,
            balanceDue: order.balanceDue,
          },
        });

        sent += 1;
      } catch (error) {
        failed += 1;
        this.logger.warn(
          `Could not send credit reminder for order ${order.orderNumber}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }

    return {
      processed: orders.length,
      sent,
      failed,
      reminderDays,
    };
  }

  private validateOrder(body: CreateOrderDto) {
    if (!body.customerName?.trim()) {
      throw new BadRequestException('Customer name is required.');
    }

    if (!body.customerEmail?.trim()) {
      throw new BadRequestException('Customer email is required.');
    }

    if (!body.paymentMethod?.trim()) {
      throw new BadRequestException('Payment method is required.');
    }

    if (!body.items?.length) {
      throw new BadRequestException('At least one order item is required.');
    }

    for (const item of body.items) {
      if (!item.productId?.trim()) {
        throw new BadRequestException('Each order item needs a productId.');
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestException(
          'Each order item needs a valid quantity.',
        );
      }
    }
  }

  private resolvePaymentType(body: CreateOrderDto): PaymentType {
    if (body.paymentType) {
      return this.normalizePaymentType(body.paymentType);
    }

    return this.normalizePaymentType(body.paymentMethod);
  }

  private normalizePaymentType(value?: string | null): PaymentType {
    return value?.trim().toUpperCase() === PAYMENT_TYPES[1] ||
      value?.trim().toLowerCase() === 'credito'
      ? PAYMENT_TYPES[1]
      : PAYMENT_TYPES[0];
  }

  private buildDueDate(creditDays: number) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.max(1, creditDays || 30));
    return dueDate;
  }

  private resolveCollectionStatus(
    amountPaid: number,
    balanceDue: number,
    dueDate?: Date | null,
  ): CollectionStatus {
    if (balanceDue <= 0) {
      return COLLECTION_STATUSES[2];
    }

    if (dueDate && dueDate.getTime() < Date.now()) {
      return COLLECTION_STATUSES[3];
    }

    if (amountPaid > 0) {
      return COLLECTION_STATUSES[1];
    }

    return COLLECTION_STATUSES[0];
  }

  private normalizeOptionalText(value?: string | null) {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private async resolveCustomerId(
    tx: Prisma.TransactionClient,
    normalizedCustomerEmail: string,
  ) {
    const existingCustomer = await tx.customer.findUnique({
      where: { email: normalizedCustomerEmail },
      select: { id: true },
    });

    if (existingCustomer) {
      return existingCustomer.id;
    }

    return null;
  }

  private async ensureOrderExists(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, orderNumber: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found.`);
    }
    return order;
  }

  private async createOrderWithUniqueNumber(
    tx: Prisma.TransactionClient,
    body: CreateOrderDto,
    normalizedCustomerEmail: string,
    customerId: string | null,
    productsById: Map<string, { id: string; name: string; price: number }>,
    subtotal: number,
    shipping: number,
    total: number,
    paymentType: PaymentType,
    amountPaid: number,
    balanceDue: number,
    dueDate: Date | null,
    collectionStatus: CollectionStatus,
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await tx.order.create({
          data: {
            orderNumber: this.generateOrderNumber(),
            customerName: body.customerName.trim(),
            customerEmail: normalizedCustomerEmail,
            customerPhone: this.normalizeOptionalText(body.customerPhone),
            customerCity: this.normalizeOptionalText(body.customerCity),
            paymentType,
            paymentMethod: body.paymentMethod.trim(),
            notes: this.normalizeOptionalText(body.notes),
            subtotal,
            shipping,
            total,
            amountPaid,
            balanceDue,
            dueDate,
            creditReminderSentAt: null,
            collectionStatus,
            status: ORDER_STATUSES[0],
            customer: customerId ? { connect: { id: customerId } } : undefined,
            items: {
              create: body.items.map((item) => {
                const product = productsById.get(item.productId)!;

                return {
                  quantity: item.quantity,
                  unitPrice: product.price,
                  total: product.price * item.quantity,
                  product: {
                    connect: { id: item.productId },
                  },
                };
              }),
            },
          },
          include: {
            customer: true,
            items: {
              include: {
                product: {
                  include: {
                    brand: true,
                    category: true,
                    goals: {
                      orderBy: {
                        goal: 'asc',
                      },
                    },
                  },
                },
              },
            },
            payments: true,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < 4
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException('Could not generate a unique order number.');
  }

  private generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${timestamp}-${suffix}`;
  }

  private calculateDaysUntilDue(dueDate: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dueDate);
    targetDate.setHours(0, 0, 0, 0);

    const differenceMs = targetDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(differenceMs / (1000 * 60 * 60 * 24)));
  }

  private async sendOrderConfirmationSafely(order: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    createdAt: Date;
    status: string;
    paymentType: string;
    paymentMethod: string;
    subtotal: number;
    shipping: number;
    total: number;
    customerCity: string | null;
    notes: string | null;
    items: Array<{
      quantity: number;
      unitPrice: number;
      total: number;
      product: {
        name: string;
        description: string | null;
        brand: { name: string } | null;
        category: { name: string } | null;
      };
    }>;
  }) {
    if (!this.mailService.isConfigured()) {
      return;
    }

    try {
      await this.mailService.sendOrderConfirmation({
        to: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        paymentType: order.paymentType,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        customerCity: order.customerCity,
        notes: order.notes,
        items: order.items.map((item) => ({
          name: item.product.name,
          description:
            item.product.description?.trim() ||
            [item.product.brand?.name, item.product.category?.name]
              .filter(Boolean)
              .join(' / '),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      });
    } catch (error) {
      this.logger.warn(
        `Could not send order confirmation for ${order.orderNumber}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
