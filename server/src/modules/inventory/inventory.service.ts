import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { INVENTORY_MOVEMENT_TYPES } from '../../common/domain/domain.constants';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getOverview() {
    const [lowStock, recentMovements, productSummary] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          stock: {
            lte: 10,
          },
        },
        orderBy: {
          stock: 'asc',
        },
        take: 10,
      }),
      this.prisma.inventoryMovement.findMany({
        include: {
          product: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 15,
      }),
      this.prisma.product.aggregate({
        _count: {
          _all: true,
        },
        _sum: {
          stock: true,
        },
      }),
    ]);

    return {
      summary: {
        totalProducts: productSummary._count._all,
        totalUnits: productSummary._sum.stock ?? 0,
        lowStockCount: lowStock.length,
      },
      lowStock,
      recentMovements,
    };
  }

  async adjustStock(body: AdjustInventoryDto, actor?: AuthenticatedUser) {
    if (!body.productId?.trim()) {
      throw new BadRequestException('Product id is required.');
    }

    if (!body.quantity || body.quantity === 0) {
      throw new BadRequestException('Adjustment quantity is required.');
    }

    if (!body.reason?.trim()) {
      throw new BadRequestException('Adjustment reason is required.');
    }

    const quantity = body.quantity;
    const reason = body.reason.trim();

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: body.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${body.productId} not found.`);
      }

      const nextStock = product.stock + quantity;

      if (nextStock < 0) {
        throw new BadRequestException(
          `Product ${product.name} cannot go below zero stock.`,
        );
      }

      const updatedProduct = await tx.product.update({
        where: { id: body.productId },
        data: {
          stock: nextStock,
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          product: {
            connect: { id: body.productId },
          },
          type:
            quantity > 0
              ? INVENTORY_MOVEMENT_TYPES[0]
              : INVENTORY_MOVEMENT_TYPES[1],
          quantity: Math.abs(quantity),
          reason,
        },
        include: {
          product: true,
        },
      });

      await this.auditService.log({
        entityType: 'INVENTORY',
        entityId: movement.id,
        action: 'INVENTORY_ADJUSTED',
        summary: `Stock for ${product.name} changed by ${quantity}.`,
        actor,
        metadata: {
          productId: product.id,
          previousStock: product.stock,
          nextStock,
          reason,
        },
      });

      return {
        message: `Stock updated for ${product.name}.`,
        product: updatedProduct,
        movement,
      };
    });
  }
}
