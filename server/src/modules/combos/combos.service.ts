import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RECORD_STATUSES } from '../../common/domain/domain.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';

@Injectable()
export class CombosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.combo.findMany({
      include: {
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findActive() {
    return this.prisma.combo.findMany({
      where: {
        status: RECORD_STATUSES[0],
      },
      include: {
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(body: CreateComboDto) {
    this.validateRequiredFields(body);
    await this.ensureProductsExist(body.items);

    try {
      return await this.prisma.combo.create({
        data: this.buildCreateData(body),
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: string, body: UpdateComboDto) {
    await this.ensureComboExists(id);

    if (body.items) {
      await this.ensureProductsExist(body.items);
    }

    try {
      return await this.prisma.combo.update({
        where: { id },
        data: this.buildUpdateData(body),
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await this.ensureComboExists(id);

    await this.prisma.combo.delete({
      where: { id },
    });

    return {
      message: `Combo ${id} deleted successfully.`,
    };
  }

  private validateRequiredFields(body: CreateComboDto) {
    if (!body.title?.trim()) {
      throw new BadRequestException('Combo title is required.');
    }

    if (!body.subtitle?.trim()) {
      throw new BadRequestException('Combo subtitle is required.');
    }

    if (!body.image?.trim()) {
      throw new BadRequestException('Combo image is required.');
    }

    if (!body.ctaLabel?.trim()) {
      throw new BadRequestException('Combo CTA label is required.');
    }

    if (!body.items?.length) {
      throw new BadRequestException('At least one combo item is required.');
    }
  }

  private buildCreateData(body: CreateComboDto): Prisma.ComboCreateInput {
    return {
      slug: this.slugify(body.title),
      title: body.title.trim(),
      subtitle: body.subtitle.trim(),
      image: body.image.trim(),
      price: body.price,
      previousPrice: body.previousPrice ?? null,
      ctaLabel: body.ctaLabel.trim(),
      status: body.status ?? RECORD_STATUSES[0],
      items: {
        create: this.normalizeItems(body.items).map((item) => ({
          quantity: item.quantity,
          product: {
            connect: { id: item.productId },
          },
        })),
      },
    };
  }

  private buildUpdateData(body: UpdateComboDto): Prisma.ComboUpdateInput {
    return {
      ...(body.title !== undefined
        ? {
            title: body.title.trim(),
            slug: this.slugify(body.title),
          }
        : {}),
      ...(body.subtitle !== undefined
        ? { subtitle: body.subtitle.trim() }
        : {}),
      ...(body.image !== undefined ? { image: body.image.trim() } : {}),
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.previousPrice !== undefined
        ? { previousPrice: body.previousPrice }
        : {}),
      ...(body.ctaLabel !== undefined
        ? { ctaLabel: body.ctaLabel.trim() }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.items !== undefined
        ? {
            items: {
              deleteMany: {},
              create: this.normalizeItems(body.items).map((item) => ({
                quantity: item.quantity,
                product: {
                  connect: { id: item.productId },
                },
              })),
            },
          }
        : {}),
    };
  }

  private normalizeItems(items: CreateComboDto['items']) {
    const groupedItems = new Map<string, number>();

    for (const item of items) {
      const productId = item.productId.trim();
      const nextQuantity = (groupedItems.get(productId) ?? 0) + item.quantity;
      groupedItems.set(productId, nextQuantity);
    }

    return Array.from(groupedItems.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private async ensureProductsExist(items: CreateComboDto['items']) {
    const normalizedItems = this.normalizeItems(items);
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: normalizedItems.map((item) => item.productId),
        },
      },
      select: {
        id: true,
      },
    });

    if (products.length !== normalizedItems.length) {
      throw new BadRequestException('One or more combo products do not exist.');
    }
  }

  private async ensureComboExists(id: string) {
    const combo = await this.prisma.combo.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!combo) {
      throw new NotFoundException(`Combo ${id} not found.`);
    }
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'A combo with that unique value already exists.',
      );
    }

    throw error;
  }
}
