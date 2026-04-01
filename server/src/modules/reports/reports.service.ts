import { Injectable } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';

const COSTA_RICA_TIMEZONE = 'America/Costa_Rica';
const DAY_IN_MS = 1000 * 60 * 60 * 24;

function formatDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: COSTA_RICA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
}

function shiftDateKey(value: Date, offsetDays: number) {
  const nextDate = new Date(value);
  nextDate.setUTCDate(nextDate.getUTCDate() + offsetDays);
  return formatDateKey(nextDate);
}

function diffDateKeys(target: string, base: string) {
  const [targetYear, targetMonth, targetDay] = target.split('-').map(Number);
  const [baseYear, baseMonth, baseDay] = base.split('-').map(Number);
  const targetUtc = Date.UTC(targetYear, targetMonth - 1, targetDay);
  const baseUtc = Date.UTC(baseYear, baseMonth - 1, baseDay);
  return Math.round((targetUtc - baseUtc) / DAY_IN_MS);
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getDashboardOverview() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const todayKey = formatDateKey(now);
    const nextFifteenDaysKey = shiftDateKey(now, 15);
    const trendRangeStart = new Date();
    trendRangeStart.setUTCDate(trendRangeStart.getUTCDate() - 6);
    trendRangeStart.setUTCHours(0, 0, 0, 0);

    const [
      orderSummary,
      customerSummary,
      productSummary,
      lowStockProducts,
      inventoryProducts,
      orderStatusSummary,
      recentOrders,
      orderItems,
      recentActivity,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _count: { _all: true },
        _sum: { total: true },
      }),
      this.prisma.customer.aggregate({
        _count: { _all: true },
      }),
      this.prisma.product.aggregate({
        _count: { _all: true },
        _sum: { stock: true },
      }),
      this.prisma.product.count({
        where: {
          stock: {
            lte: 10,
          },
        },
      }),
      this.prisma.product.findMany({
        where: {
          stock: {
            gt: 0,
          },
        },
        select: {
          id: true,
          name: true,
          stock: true,
          expirationDate: true,
          brand: {
            select: {
              name: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
      }),
      this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: trendRangeStart,
          },
        },
        select: {
          createdAt: true,
          total: true,
        },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.auditService.listRecent(12),
    ]);

    const expirationSnapshots = inventoryProducts
      .map((product) => {
        if (
          typeof product.expirationDate !== 'string' ||
          product.expirationDate.length === 0
        ) {
          return null;
        }

        return {
        id: product.id,
        name: product.name,
        stock: product.stock,
        brand: product.brand?.name ?? null,
        category: product.category?.name ?? null,
        expirationDate: product.expirationDate,
        daysUntilExpiration: diffDateKeys(product.expirationDate, todayKey),
        };
      })
      .filter((product): product is NonNullable<typeof product> => Boolean(product));

    const expiredProducts = expirationSnapshots
      .filter((product) => product.expirationDate < todayKey)
      .sort((left, right) =>
        left.expirationDate.localeCompare(right.expirationDate),
      );

    const expiringSoonProducts = expirationSnapshots
      .filter(
        (product) =>
          product.expirationDate >= todayKey &&
          product.expirationDate <= nextFifteenDaysKey,
      )
      .sort((left, right) =>
        left.expirationDate.localeCompare(right.expirationDate),
      );

    const healthyInventoryCount = inventoryProducts.filter((product) => {
      const expirationSnapshot = expirationSnapshots.find(
        (entry) => entry.id === product.id,
      );

      if (product.stock <= 10) {
        return false;
      }

      if (!expirationSnapshot) {
        return true;
      }

      return (
        expirationSnapshot.expirationDate > nextFifteenDaysKey &&
        expirationSnapshot.daysUntilExpiration > 15
      );
    }).length;

    const orderStatusBreakdown = orderStatusSummary
      .map((entry) => ({
        status: entry.status,
        count: entry._count._all,
      }))
      .sort((left, right) => right.count - left.count);

    const trends = Array.from({ length: 7 }, (_, index) => {
      const key = shiftDateKey(now, index - 6);

      const dayOrders = recentOrders.filter(
        (order) => formatDateKey(order.createdAt) === key,
      );

      return {
        date: key,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
      };
    });

    const topProductsMap = new Map<
      string,
      { productId: string; name: string; quantity: number; revenue: number }
    >();

    orderItems.forEach((item) => {
      const current = topProductsMap.get(item.productId) ?? {
        productId: item.productId,
        name: item.product.name,
        quantity: 0,
        revenue: 0,
      };

      current.quantity += item.quantity;
      current.revenue += item.total;
      topProductsMap.set(item.productId, current);
    });

    const topProducts = Array.from(topProductsMap.values())
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5);

    const revenueTotal = orderSummary._sum.total ?? 0;
    const totalOrders = orderSummary._count._all;
    const revenueLast7Days = recentOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );

    return {
      metrics: {
        revenueTotal,
        totalOrders,
        totalCustomers: customerSummary._count._all,
        totalProducts: productSummary._count._all,
        totalUnits: productSummary._sum.stock ?? 0,
        lowStockProducts,
        averageOrderValue: totalOrders > 0 ? revenueTotal / totalOrders : 0,
        ordersLast7Days: recentOrders.length,
        revenueLast7Days,
        expiringSoonProducts: expiringSoonProducts.length,
        expiredProducts: expiredProducts.length,
      },
      trends,
      topProducts,
      inventoryHealth: [
        {
          label: 'Estables',
          count: healthyInventoryCount,
        },
        {
          label: 'Stock bajo',
          count: lowStockProducts,
        },
        {
          label: 'Por vencer',
          count: expiringSoonProducts.length,
        },
        {
          label: 'Vencidos',
          count: expiredProducts.length,
        },
      ],
      orderStatusBreakdown,
      expiringProducts: [...expiredProducts, ...expiringSoonProducts]
        .slice(0, 8)
        .map((product) => ({
          id: product.id,
          name: product.name,
          stock: product.stock,
          brand: product.brand,
          category: product.category,
          expirationDate: product.expirationDate,
          daysUntilExpiration: product.daysUntilExpiration,
          severity: product.daysUntilExpiration < 0 ? 'expired' : 'warning',
        })),
      recentActivity: recentActivity.map((entry) => ({
        id: entry.id,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        summary: entry.summary,
        actorEmail: entry.actorEmail,
        actorRole: entry.actorRole,
        createdAt: entry.createdAt,
      })),
    };
  }
}
