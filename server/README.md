# Moonfit Store Backend

NestJS backend for the Moonfit storefront and admin panel.

## Features

- JWT authentication
- Products, categories, brands, combos, campaigns, orders, inventory, customers
- SQL Server database access through Prisma
- Swagger docs at `/docs`
- Upload handling for product images and payment proofs
- Optional SMTP mailer
- Optional OpenAI image enhancement

## Environment

Create `.env` based on `.env.example`.

Important groups:

- Database: `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- API: `HOST`, `PORT`, `NODE_ENV`
- Auth: `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS`
- Seed: `SEED_ADMIN_PASSWORD`
- Mail: `SMTP_*`
- AI: `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL`

## Scripts

```bash
npm install
```

```bash
npm run start:dev
```

```bash
npm run build
```

```bash
npm run start:prod
```

```bash
npm run db:push
```

```bash
npm run db:seed
```

## Local URLs

- API: `http://localhost:3000`
- Health: `http://localhost:3000/health`
- Swagger: `http://localhost:3000/docs`

## Notes

- Uploaded files are stored in `uploads/` and served from `/uploads`.
- The seed script creates an admin user and uses `SEED_ADMIN_PASSWORD`.
- In production, do not use placeholder secrets.
