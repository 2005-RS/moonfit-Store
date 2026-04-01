import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { hashPassword } from '../src/modules/auth/utils/password.util';

type ErrorResponse = {
  success: boolean;
  statusCode: number;
  message: string | string[];
};

type LoginResponse = {
  accessToken: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
};

type HealthResponse = {
  uptime: number;
  timestamp: string;
};

type SessionPreviewResponse = {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  };
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  const adminUser = {
    id: 'admin-user-id',
    email: 'admin@eccomers.dev',
    password: hashPassword('Admin123..'),
    role: 'ADMIN',
    createdAt: new Date('2026-03-28T12:00:00.000Z'),
    updatedAt: new Date('2026-03-28T12:00:00.000Z'),
    customer: null,
  };

  const customerUser = {
    id: 'customer-user-id',
    email: 'customer@eccomers.dev',
    password: hashPassword('Customer123..'),
    role: 'CUSTOMER',
    createdAt: new Date('2026-03-28T12:00:00.000Z'),
    updatedAt: new Date('2026-03-28T12:00:00.000Z'),
    customer: {
      id: 'customer-id',
      userId: 'customer-user-id',
      name: 'Customer Test',
      email: 'customer@eccomers.dev',
      phone: null,
      city: 'San Jose',
      status: 'ACTIVE',
      createdAt: new Date('2026-03-28T12:00:00.000Z'),
      updatedAt: new Date('2026-03-28T12:00:00.000Z'),
    },
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      aggregate: jest.fn(),
    },
    inventoryMovement: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    getHealthStatus: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.create.mockReset();
    prismaMock.product.findMany.mockReset();
    prismaMock.product.findFirst.mockReset();
    prismaMock.product.aggregate.mockReset();
    prismaMock.inventoryMovement.findMany.mockReset();
    prismaMock.inventoryMovement.create.mockReset();
    prismaMock.getHealthStatus.mockReset();
    prismaMock.$queryRawUnsafe.mockReset();
    prismaMock.$transaction.mockReset();

    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id === adminUser.id || where.email === adminUser.email) {
          return Promise.resolve(adminUser);
        }

        if (
          where.id === customerUser.id ||
          where.email === customerUser.email
        ) {
          return Promise.resolve(customerUser);
        }

        return Promise.resolve(null);
      },
    );

    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.findFirst.mockResolvedValue(null);
    prismaMock.product.aggregate.mockResolvedValue({
      _count: { _all: 0 },
      _sum: { stock: 0 },
    });
    prismaMock.inventoryMovement.findMany.mockResolvedValue([]);
    prismaMock.getHealthStatus.mockResolvedValue({
      status: 'ok',
      provider: 'sqlserver',
    });
    prismaMock.$queryRawUnsafe.mockResolvedValue([{ healthy: 1 }]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            name: 'eccomers-api',
            status: 'ok',
          }),
        );
      });
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response) => {
        const body = response.body as {
          status: string;
          service: string;
          database: { status: string; provider: string };
        } & HealthResponse;
        expect(response.body).toEqual(
          expect.objectContaining({
            status: 'ok',
            service: 'eccomers-api',
            database: {
              status: 'ok',
              provider: 'sqlserver',
            },
          }),
        );
        expect(typeof body.uptime).toBe('number');
        expect(typeof body.timestamp).toBe('string');
      });
  });

  it('/auth/login (POST) validates the payload', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'invalid-email',
        password: '123',
      })
      .expect(400)
      .expect((response) => {
        const body = response.body as ErrorResponse;
        expect(body.success).toBe(false);
        expect(body.statusCode).toBe(400);
        expect(body.message).toEqual(
          expect.arrayContaining([
            'email must be an email',
            'password must be longer than or equal to 6 characters',
          ]),
        );
      });
  });

  it('/auth/me (GET) requires authentication', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .expect(401)
      .expect((response) => {
        const body = response.body as ErrorResponse;
        expect(body.success).toBe(false);
        expect(body.message).toBe('Authentication token is required.');
      });
  });

  it('/auth/login (POST) authenticates an admin user', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: 'Admin123..',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as LoginResponse;
        expect(body.accessToken).toEqual(expect.any(String));
        expect(body.user).toEqual(
          expect.objectContaining({
            id: adminUser.id,
            email: adminUser.email,
            role: 'ADMIN',
          }),
        );
      });
  });

  it('/auth/me (GET) returns the authenticated user with a valid token', async () => {
    const loginResponse = (await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: 'Admin123..',
      })) as { body: LoginResponse };

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as SessionPreviewResponse;
        expect(body.authenticated).toBe(true);
        expect(body.user).toEqual(
          expect.objectContaining({
            id: adminUser.id,
            email: adminUser.email,
            role: 'ADMIN',
          }),
        );
      });
  });

  it('/inventory (GET) requires authentication', () => {
    return request(app.getHttpServer())
      .get('/inventory')
      .expect(401)
      .expect((response) => {
        const body = response.body as ErrorResponse;
        expect(body.success).toBe(false);
        expect(body.message).toBe('Authentication token is required.');
      });
  });

  it('/inventory (GET) allows access to an authenticated admin', async () => {
    const loginResponse = (await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: 'Admin123..',
      })) as { body: LoginResponse };

    await request(app.getHttpServer())
      .get('/inventory')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          summary: {
            totalProducts: 0,
            totalUnits: 0,
            lowStockCount: 0,
          },
          lowStock: [],
          recentMovements: [],
        });
      });
  });

  it('/inventory (GET) rejects an authenticated customer without admin role', async () => {
    const loginResponse = (await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: customerUser.email,
        password: 'Customer123..',
      })) as { body: LoginResponse };

    await request(app.getHttpServer())
      .get('/inventory')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(403)
      .expect((response) => {
        const body = response.body as ErrorResponse;
        expect(body.success).toBe(false);
        expect(body.message).toBe(
          'You do not have permission to access this resource.',
        );
      });
  });

  it('/products (GET) only returns active products for the storefront', () => {
    const activeProduct = {
      id: 'product-1',
      slug: 'audifonos-wave-pro',
      name: 'Audifonos Wave Pro',
      description: 'Audio premium',
      price: 89,
      previousPrice: 109,
      stock: 10,
      badge: 'Mas vendido',
      image: null,
      status: 'ACTIVE',
      brand: null,
      category: null,
    };

    prismaMock.product.findMany.mockResolvedValueOnce([activeProduct]);

    return request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual([activeProduct]);
        expect(prismaMock.product.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              status: 'ACTIVE',
            },
          }),
        );
      });
  });

  it('/products/:id (GET) does not expose inventory movements in the public response', () => {
    prismaMock.product.findFirst.mockResolvedValueOnce({
      id: 'product-1',
      slug: 'audifonos-wave-pro',
      name: 'Audifonos Wave Pro',
      description: 'Audio premium',
      price: 89,
      previousPrice: 109,
      stock: 10,
      badge: 'Mas vendido',
      image: null,
      status: 'ACTIVE',
      brand: null,
      category: null,
    });

    return request(app.getHttpServer())
      .get('/products/product-1')
      .expect(200)
      .expect((response) => {
        const body = response.body as { movements?: unknown };
        expect(body.movements).toBeUndefined();
        expect(prismaMock.product.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              id: 'product-1',
              status: 'ACTIVE',
            },
          }),
        );
      });
  });
});
