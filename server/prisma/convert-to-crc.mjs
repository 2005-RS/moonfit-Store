import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';

const CRC_REFERENCE_RATE = Number(process.env.CRC_REFERENCE_RATE ?? '540');
const CRC_ROUNDING = Number(process.env.CRC_ROUNDING ?? '100');

const adapter = new PrismaMssql({
  server: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? '1433'),
  database: process.env.DB_NAME ?? 'eccomers',
  user: process.env.DB_USER ?? 'eccomers_user',
  password: process.env.DB_PASSWORD ?? '',
  options: {
    encrypt: process.env.DB_ENCRYPT !== 'false',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
  },
  connectionTimeout: 5_000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30_000,
  },
});

const prisma = new PrismaClient({
  adapter,
});

function toColonAmount(value) {
  return Math.max(
    0,
    Math.round((Number(value) * CRC_REFERENCE_RATE) / CRC_ROUNDING) *
      CRC_ROUNDING,
  );
}

function mapNullableAmount(value) {
  return value == null ? null : toColonAmount(value);
}

function shouldConvertAmount(value, threshold = 1000) {
  return Number(value) > 0 && Number(value) < threshold;
}

function shouldConvertCreditLimit(value) {
  return Number(value) > 0 && Number(value) <= 10000;
}

function shouldConvertShipping(value) {
  return Number(value) > 0 && Number(value) <= 20;
}

function normalizePreviousPrice(price, previousPrice) {
  if (previousPrice == null) {
    return null;
  }

  if (previousPrice <= price || previousPrice > price * 3) {
    return null;
  }

  return previousPrice;
}

async function convertProducts() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      price: true,
      previousPrice: true,
    },
  });

  let updatedCount = 0;

  for (const product of products) {
    const nextPrice = shouldConvertAmount(product.price)
      ? toColonAmount(product.price)
      : product.price;
    const nextPreviousPrice =
      product.previousPrice != null && shouldConvertAmount(product.previousPrice)
        ? mapNullableAmount(product.previousPrice)
        : product.previousPrice;
    const normalizedPreviousPrice = normalizePreviousPrice(
      nextPrice,
      nextPreviousPrice,
    );

    if (
      nextPrice === product.price &&
      normalizedPreviousPrice === product.previousPrice
    ) {
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        price: nextPrice,
        previousPrice: normalizedPreviousPrice,
      },
    });

    updatedCount += 1;
  }

  return updatedCount;
}

async function convertCombos() {
  const combos = await prisma.combo.findMany({
    select: {
      id: true,
      price: true,
      previousPrice: true,
    },
  });

  let updatedCount = 0;

  for (const combo of combos) {
    const nextPrice = shouldConvertAmount(combo.price)
      ? toColonAmount(combo.price)
      : combo.price;
    const nextPreviousPrice =
      combo.previousPrice != null && shouldConvertAmount(combo.previousPrice)
        ? mapNullableAmount(combo.previousPrice)
        : combo.previousPrice;
    const normalizedPreviousPrice = normalizePreviousPrice(
      nextPrice,
      nextPreviousPrice,
    );

    if (
      nextPrice === combo.price &&
      normalizedPreviousPrice === combo.previousPrice
    ) {
      continue;
    }

    await prisma.combo.update({
      where: { id: combo.id },
      data: {
        price: nextPrice,
        previousPrice: normalizedPreviousPrice,
      },
    });

    updatedCount += 1;
  }

  return updatedCount;
}

async function convertCustomers() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      creditLimit: true,
    },
  });

  let updatedCount = 0;

  for (const customer of customers) {
    if (!shouldConvertCreditLimit(customer.creditLimit)) {
      continue;
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        creditLimit: toColonAmount(customer.creditLimit),
      },
    });

    updatedCount += 1;
  }

  return updatedCount;
}

async function convertOrderItems() {
  const orderItems = await prisma.orderItem.findMany({
    select: {
      id: true,
      orderId: true,
      unitPrice: true,
      total: true,
    },
  });

  const subtotalByOrderId = new Map();
  let updatedCount = 0;

  for (const orderItem of orderItems) {
    const nextUnitPrice = shouldConvertAmount(orderItem.unitPrice)
      ? toColonAmount(orderItem.unitPrice)
      : orderItem.unitPrice;
    const nextTotal = shouldConvertAmount(orderItem.total)
      ? toColonAmount(orderItem.total)
      : orderItem.total;

    if (
      nextUnitPrice !== orderItem.unitPrice ||
      nextTotal !== orderItem.total
    ) {
      await prisma.orderItem.update({
        where: { id: orderItem.id },
        data: {
          unitPrice: nextUnitPrice,
          total: nextTotal,
        },
      });

      updatedCount += 1;
    }

    subtotalByOrderId.set(
      orderItem.orderId,
      (subtotalByOrderId.get(orderItem.orderId) ?? 0) + nextTotal,
    );
  }

  return {
    count: updatedCount,
    subtotalByOrderId,
  };
}

async function convertOrderPayments() {
  const payments = await prisma.orderPayment.findMany({
    select: {
      id: true,
      amount: true,
    },
  });

  let updatedCount = 0;

  for (const payment of payments) {
    if (!shouldConvertAmount(payment.amount)) {
      continue;
    }

    await prisma.orderPayment.update({
      where: { id: payment.id },
      data: {
        amount: toColonAmount(payment.amount),
      },
    });

    updatedCount += 1;
  }

  return updatedCount;
}

async function convertOrders(subtotalByOrderId) {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      subtotal: true,
      shipping: true,
      total: true,
      amountPaid: true,
      balanceDue: true,
    },
  });

  let updatedCount = 0;

  for (const order of orders) {
    const subtotal = subtotalByOrderId.get(order.id) ?? order.subtotal;
    const shipping = shouldConvertShipping(order.shipping)
      ? toColonAmount(order.shipping)
      : order.shipping;
    const amountPaid = shouldConvertAmount(order.amountPaid)
      ? toColonAmount(order.amountPaid)
      : order.amountPaid;
    const total = subtotal + shipping;
    const balanceDue = Math.max(0, total - amountPaid);

    if (
      subtotal === order.subtotal &&
      shipping === order.shipping &&
      total === order.total &&
      amountPaid === order.amountPaid &&
      balanceDue === order.balanceDue
    ) {
      continue;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        subtotal,
        shipping,
        total,
        amountPaid,
        balanceDue,
      },
    });

    updatedCount += 1;
  }

  return updatedCount;
}

async function main() {
  const products = await convertProducts();
  const combos = await convertCombos();
  const customers = await convertCustomers();
  const { count: orderItems, subtotalByOrderId } = await convertOrderItems();
  const orderPayments = await convertOrderPayments();
  const orders = await convertOrders(subtotalByOrderId);
  const totalUpdated =
    products + combos + customers + orderItems + orderPayments + orders;

  console.log('CRC conversion completed.');
  console.log(`Rate used: ${CRC_REFERENCE_RATE}`);
  console.log(`Rounded to: ${CRC_ROUNDING}`);
  console.log(`Products updated: ${products}`);
  console.log(`Combos updated: ${combos}`);
  console.log(`Customers updated: ${customers}`);
  console.log(`Order items updated: ${orderItems}`);
  console.log(`Order payments updated: ${orderPayments}`);
  console.log(`Orders updated: ${orders}`);
  console.log(`Total updated rows: ${totalUpdated}`);
}

main()
  .catch((error) => {
    console.error('CRC conversion failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
