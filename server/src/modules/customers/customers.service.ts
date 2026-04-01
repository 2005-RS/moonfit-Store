import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { toCsv } from '../../common/utils/csv.util';
import { PrismaService } from '../../prisma/prisma.service';
import { RECORD_STATUSES } from '../../common/domain/domain.constants';
import type { AuthenticatedUser } from '../auth/auth.types';
import { hashPassword } from '../auth/utils/password.util';
import { AdminCustomerListQueryDto } from './dto/admin-customer-list-query.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll() {
    return this.prisma.customer.findMany({
      include: {
        user: true,
        orders: {
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAdminList(
    query: AdminCustomerListQueryDto,
  ): Promise<
    PaginatedResponse<
      Awaited<ReturnType<typeof this.prisma.customer.findMany>>[number]
    >
  > {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const search = query.search?.trim();
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDirection = query.sortDirection ?? 'desc';

    const where: Prisma.CustomerWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { city: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        include: {
          user: true,
          orders: {
            select: { id: true },
          },
        },
        orderBy: {
          [sortBy]: sortDirection,
        },
        skip,
        take: pageSize,
      }),
      this.prisma.customer.count({ where }),
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
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: true,
        orders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found.`);
    }

    return customer;
  }

  async findProfileByUserId(userId: string) {
    const customer = await this.findCustomerByUserId(userId);

    return this.prisma.customer.findUniqueOrThrow({
      where: { id: customer.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        favorites: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async updateProfileByUserId(userId: string, body: UpdateCustomerDto) {
    const customer = await this.findCustomerByUserId(userId);
    const normalizedEmail =
      body.email !== undefined ? body.email.trim().toLowerCase() : undefined;

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (normalizedEmail) {
          await tx.user.update({
            where: { id: userId },
            data: { email: normalizedEmail },
          });
        }

        return tx.customer.update({
          where: { id: customer.id },
          data: {
            ...(body.name !== undefined ? { name: body.name.trim() } : {}),
            ...(normalizedEmail !== undefined
              ? { email: normalizedEmail }
              : {}),
            ...(body.phone !== undefined
              ? { phone: this.normalizeOptionalText(body.phone) }
              : {}),
            ...(body.city !== undefined
              ? { city: this.normalizeOptionalText(body.city) }
              : {}),
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        });
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findFavoritesByUserId(userId: string) {
    const customer = await this.findCustomerByUserId(userId);

    return this.prisma.favoriteProduct.findMany({
      where: { customerId: customer.id },
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async addFavoriteByUserId(userId: string, productId: string) {
    const customer = await this.findCustomerByUserId(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found.`);
    }

    await this.prisma.favoriteProduct.upsert({
      where: {
        customerId_productId: {
          customerId: customer.id,
          productId,
        },
      },
      update: {},
      create: {
        customerId: customer.id,
        productId,
      },
    });

    return {
      message: 'Favorite saved successfully.',
    };
  }

  async removeFavoriteByUserId(userId: string, productId: string) {
    const customer = await this.findCustomerByUserId(userId);

    await this.prisma.favoriteProduct.deleteMany({
      where: {
        customerId: customer.id,
        productId,
      },
    });

    return {
      message: 'Favorite removed successfully.',
    };
  }

  async exportCsv() {
    const customers = await this.prisma.customer.findMany({
      include: {
        user: true,
        orders: {
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return toCsv(
      ['id', 'name', 'email', 'phone', 'city', 'status', 'orders'],
      customers.map((customer) => [
        customer.id,
        customer.name,
        customer.email,
        customer.phone ?? '',
        customer.city ?? '',
        customer.status,
        customer.orders.length,
      ]),
    );
  }

  async resetPassword(
    id: string,
    password: string,
    actor?: AuthenticatedUser | null,
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found.`);
    }

    if (!customer.userId) {
      throw new BadRequestException(
        'This customer does not have a web account linked yet.',
      );
    }

    const normalizedPassword = password.trim();

    if (normalizedPassword.length < 6) {
      throw new BadRequestException(
        'Password must contain at least 6 characters.',
      );
    }

    await this.prisma.user.update({
      where: { id: customer.userId },
      data: {
        password: hashPassword(normalizedPassword),
      },
    });

    await this.auditService.log({
      entityType: 'CUSTOMER',
      entityId: customer.id,
      action: 'CUSTOMER_PASSWORD_RESET',
      summary: `Password reset for customer ${customer.email}.`,
      actor,
      metadata: {
        customerEmail: customer.email,
        customerName: customer.name,
      },
    });

    return {
      message: 'Customer password was updated successfully.',
    };
  }

  async create(body: CreateCustomerDto) {
    this.validateCreate(body);
    await this.ensureUserExists(body.userId);

    try {
      return await this.prisma.customer.create({
        data: {
          name: body.name.trim(),
          email: body.email.trim().toLowerCase(),
          phone: this.normalizeOptionalText(body.phone),
          city: this.normalizeOptionalText(body.city),
          status: body.status ?? RECORD_STATUSES[0],
          creditApproved: body.creditApproved ?? false,
          creditLimit: body.creditLimit ?? 0,
          creditDays: body.creditDays ?? 0,
          user: body.userId ? { connect: { id: body.userId } } : undefined,
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: string, body: UpdateCustomerDto) {
    await this.ensureCustomerExists(id);
    await this.ensureUserExists(body.userId);

    try {
      return await this.prisma.customer.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(body.email !== undefined
            ? { email: body.email.trim().toLowerCase() }
            : {}),
          ...(body.phone !== undefined
            ? { phone: this.normalizeOptionalText(body.phone) }
            : {}),
          ...(body.city !== undefined
            ? { city: this.normalizeOptionalText(body.city) }
            : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.creditApproved !== undefined
            ? { creditApproved: body.creditApproved }
            : {}),
          ...(body.creditLimit !== undefined
            ? { creditLimit: body.creditLimit }
            : {}),
          ...(body.creditDays !== undefined
            ? { creditDays: body.creditDays }
            : {}),
          ...(body.userId !== undefined
            ? body.userId
              ? { user: { connect: { id: body.userId } } }
              : { user: { disconnect: true } }
            : {}),
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found.`);
    }

    if (customer.orders.length > 0) {
      throw new BadRequestException(
        'This customer cannot be deleted because it still has orders.',
      );
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return {
      message: `Customer ${id} deleted successfully.`,
    };
  }

  private validateCreate(body: CreateCustomerDto) {
    if (!body.name?.trim()) {
      throw new BadRequestException('Customer name is required.');
    }

    if (!body.email?.trim()) {
      throw new BadRequestException('Customer email is required.');
    }
  }

  private normalizeOptionalText(value?: string | null) {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private async findCustomerByUserId(userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException(
        'The authenticated user does not have a customer profile yet.',
      );
    }

    return customer;
  }

  private async ensureCustomerExists(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found.`);
    }
  }

  private async ensureUserExists(userId?: string | null) {
    if (!userId) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException(`User ${userId} does not exist.`);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'A customer with that unique value already exists.',
      );
    }

    throw error;
  }
}
