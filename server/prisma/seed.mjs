import 'dotenv/config';
import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';

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

const CRC_REFERENCE_RATE = Number(process.env.CRC_REFERENCE_RATE ?? '540');
const CRC_ROUNDING = 100;

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${hash}`;
}

function toColonAmount(value) {
  return Math.max(
    0,
    Math.round((Number(value) * CRC_REFERENCE_RATE) / CRC_ROUNDING) *
      CRC_ROUNDING,
  );
}

function resolveSeedAdminPassword() {
  const configuredPassword = process.env.SEED_ADMIN_PASSWORD?.trim();

  if (configuredPassword) {
    return configuredPassword;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SEED_ADMIN_PASSWORD is required when running the seed in production.',
    );
  }

  return 'Admin123..';
}

async function main() {
  const adminPlainPassword = resolveSeedAdminPassword();
  const adminPassword = hashPassword(adminPlainPassword);

  await prisma.user.upsert({
    where: { email: 'admin@eccomers.dev' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@eccomers.dev',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const audioCategory = await prisma.category.upsert({
    where: { slug: 'audio' },
    update: {
      name: 'Audio',
      description: 'Audifonos, parlantes y accesorios de sonido.',
      status: 'ACTIVE',
    },
    create: {
      name: 'Audio',
      slug: 'audio',
      description: 'Audifonos, parlantes y accesorios de sonido.',
      status: 'ACTIVE',
    },
  });

  const wearablesCategory = await prisma.category.upsert({
    where: { slug: 'wearables' },
    update: {
      name: 'Wearables',
      description: 'Relojes inteligentes y accesorios conectados.',
      status: 'ACTIVE',
    },
    create: {
      name: 'Wearables',
      slug: 'wearables',
      description: 'Relojes inteligentes y accesorios conectados.',
      status: 'ACTIVE',
    },
  });

  const combosCategory = await prisma.category.upsert({
    where: { slug: 'combos' },
    update: {
      name: 'Combos',
      description: 'Packs y promociones listas para vender.',
      status: 'ACTIVE',
    },
    create: {
      name: 'Combos',
      slug: 'combos',
      description: 'Packs y promociones listas para vender.',
      status: 'ACTIVE',
    },
  });

  const novaSoundBrand = await prisma.brand.upsert({
    where: { slug: 'novasound' },
    update: {
      name: 'NovaSound',
      description: 'Marca enfocada en audio premium.',
      status: 'ACTIVE',
    },
    create: {
      name: 'NovaSound',
      slug: 'novasound',
      description: 'Marca enfocada en audio premium.',
      status: 'ACTIVE',
    },
  });

  const kronoBrand = await prisma.brand.upsert({
    where: { slug: 'krono' },
    update: {
      name: 'Krono',
      description: 'Marca de wearables y accesorios inteligentes.',
      status: 'ACTIVE',
    },
    create: {
      name: 'Krono',
      slug: 'krono',
      description: 'Marca de wearables y accesorios inteligentes.',
      status: 'ACTIVE',
    },
  });

  const studioBrand = await prisma.brand.upsert({
    where: { slug: 'workspace-studio' },
    update: {
      name: 'Workspace Studio',
      description: 'Marca para combos de productividad.',
      status: 'ACTIVE',
    },
    create: {
      name: 'Workspace Studio',
      slug: 'workspace-studio',
      description: 'Marca para combos de productividad.',
      status: 'ACTIVE',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'audifonos-wave-pro' },
    update: {
      name: 'Audifonos Wave Pro',
      price: toColonAmount(89),
      previousPrice: toColonAmount(109),
      stock: 14,
      badge: 'Mas vendido',
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
      description: 'Audifonos inalambricos con cancelacion de ruido.',
      status: 'ACTIVE',
      brandId: novaSoundBrand.id,
      categoryId: audioCategory.id,
    },
    create: {
      name: 'Audifonos Wave Pro',
      slug: 'audifonos-wave-pro',
      price: toColonAmount(89),
      previousPrice: toColonAmount(109),
      stock: 14,
      badge: 'Mas vendido',
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
      description: 'Audifonos inalambricos con cancelacion de ruido.',
      status: 'ACTIVE',
      brand: { connect: { id: novaSoundBrand.id } },
      category: { connect: { id: audioCategory.id } },
    },
  });

  await prisma.product.upsert({
    where: { slug: 'smartwatch-pulse-x' },
    update: {
      name: 'Smartwatch Pulse X',
      price: toColonAmount(129),
      previousPrice: toColonAmount(149),
      stock: 8,
      badge: 'Nuevo',
      image:
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
      description: 'Reloj inteligente con monitoreo de salud.',
      status: 'ACTIVE',
      brandId: kronoBrand.id,
      categoryId: wearablesCategory.id,
    },
    create: {
      name: 'Smartwatch Pulse X',
      slug: 'smartwatch-pulse-x',
      price: toColonAmount(129),
      previousPrice: toColonAmount(149),
      stock: 8,
      badge: 'Nuevo',
      image:
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
      description: 'Reloj inteligente con monitoreo de salud.',
      status: 'ACTIVE',
      brand: { connect: { id: kronoBrand.id } },
      category: { connect: { id: wearablesCategory.id } },
    },
  });

  await prisma.product.upsert({
    where: { slug: 'combo-home-office' },
    update: {
      name: 'Combo Home Office',
      price: toColonAmount(215),
      previousPrice: toColonAmount(259),
      stock: 5,
      badge: 'Oferta',
      image:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
      description: 'Combo con teclado, mouse y soporte para escritorio.',
      status: 'ACTIVE',
      brandId: studioBrand.id,
      categoryId: combosCategory.id,
    },
    create: {
      name: 'Combo Home Office',
      slug: 'combo-home-office',
      price: toColonAmount(215),
      previousPrice: toColonAmount(259),
      stock: 5,
      badge: 'Oferta',
      image:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
      description: 'Combo con teclado, mouse y soporte para escritorio.',
      status: 'ACTIVE',
      brand: { connect: { id: studioBrand.id } },
      category: { connect: { id: combosCategory.id } },
    },
  });

  const comboProducts = await prisma.product.findMany({
    where: {
      slug: {
        in: ['audifonos-wave-pro', 'smartwatch-pulse-x'],
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const comboProductsBySlug = new Map(
    comboProducts.map((product) => [product.slug, product.id]),
  );

  await prisma.combo.upsert({
    where: { slug: 'combo-rendimiento-digital' },
    update: {
      title: 'Combo rendimiento digital',
      subtitle:
        'Paquete listo para vender una compra guiada con mejor ticket promedio.',
      image:
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
      price: toColonAmount(199),
      previousPrice: toColonAmount(238),
      ctaLabel: 'Agregar combo',
      status: 'ACTIVE',
      items: {
        deleteMany: {},
        create: [
          {
            quantity: 1,
            product: {
              connect: { id: comboProductsBySlug.get('audifonos-wave-pro') },
            },
          },
          {
            quantity: 1,
            product: {
              connect: { id: comboProductsBySlug.get('smartwatch-pulse-x') },
            },
          },
        ],
      },
    },
    create: {
      slug: 'combo-rendimiento-digital',
      title: 'Combo rendimiento digital',
      subtitle:
        'Paquete listo para vender una compra guiada con mejor ticket promedio.',
      image:
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
      price: toColonAmount(199),
      previousPrice: toColonAmount(238),
      ctaLabel: 'Agregar combo',
      status: 'ACTIVE',
      items: {
        create: [
          {
            quantity: 1,
            product: {
              connect: { id: comboProductsBySlug.get('audifonos-wave-pro') },
            },
          },
          {
            quantity: 1,
            product: {
              connect: { id: comboProductsBySlug.get('smartwatch-pulse-x') },
            },
          },
        ],
      },
    },
  });

  await prisma.campaign.upsert({
    where: { id: 'campaign-home-hero' },
    update: {
      title: 'Stack fuerza: whey + creatina',
      subtitle:
        'Promocion principal para clientes que buscan recuperacion y rendimiento en una sola compra.',
      ctaLabel: 'Ver stacks',
      ctaHref: '/catalogo',
      image:
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
      placement: 'HOME_HERO',
      discountTag: 'Hasta 15% menos',
      status: 'ACTIVE',
    },
    create: {
      id: 'campaign-home-hero',
      title: 'Stack fuerza: whey + creatina',
      subtitle:
        'Promocion principal para clientes que buscan recuperacion y rendimiento en una sola compra.',
      ctaLabel: 'Ver stacks',
      ctaHref: '/catalogo',
      image:
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
      placement: 'HOME_HERO',
      discountTag: 'Hasta 15% menos',
      status: 'ACTIVE',
    },
  });

  await prisma.campaign.upsert({
    where: { id: 'campaign-home-secondary' },
    update: {
      title: 'Home gym essentials',
      subtitle:
        'Bandas, accesorios y productos practicos para clientes que entrenan desde casa.',
      ctaLabel: 'Comprar implementos',
      ctaHref: '/catalogo',
      image:
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
      placement: 'HOME_SECONDARY',
      discountTag: 'Combo del mes',
      status: 'ACTIVE',
    },
    create: {
      id: 'campaign-home-secondary',
      title: 'Home gym essentials',
      subtitle:
        'Bandas, accesorios y productos practicos para clientes que entrenan desde casa.',
      ctaLabel: 'Comprar implementos',
      ctaHref: '/catalogo',
      image:
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
      placement: 'HOME_SECONDARY',
      discountTag: 'Combo del mes',
      status: 'ACTIVE',
    },
  });

  console.log('Seed completed.');
  console.log('Admin user: admin@eccomers.dev');
  console.log(`Admin password: ${adminPlainPassword}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
