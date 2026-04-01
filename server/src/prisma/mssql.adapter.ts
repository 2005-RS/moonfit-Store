import { PrismaMssql } from '@prisma/adapter-mssql';

export function createMssqlAdapter() {
  return new PrismaMssql({
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
}
