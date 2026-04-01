# Moonfit Store

Moonfit Store is a full-stack ecommerce project with a storefront for customers and an admin panel for operations.

## Stack

- Frontend: React 19 + Vite + React Router
- Backend: NestJS 11
- Database: SQL Server + Prisma
- Auth: JWT
- Docs: Swagger at `/docs`

## Project Structure

- `mi-app/`: storefront and admin frontend
- `server/`: REST API, auth, inventory, orders, uploads, reports

## Main Flows

- Public storefront with home, catalog, product detail, cart, and account pages
- Admin area with dashboard, products, categories, brands, combos, campaigns, orders, inventory, and customers
- Order management and operational reporting
- Product image uploads and payment proof uploads

## Requirements

- Node.js 20+
- npm 10+
- SQL Server running locally or remotely

## Local Setup

1. Clone the repository.
2. Create the backend env file from `server/.env.example`.
3. Create the frontend env file from `mi-app/.env.example`.
4. Install dependencies in both apps.

```bash
cd server
npm install
```

```bash
cd ../mi-app
npm install
```

## Backend Setup

Create `server/.env` based on the example file and set your SQL Server credentials, JWT secret, SMTP config, and optional OpenAI key.

Then generate Prisma, sync the schema, and seed the database:

```bash
cd server
npx prisma generate
```

```bash
npx prisma db push
```

```bash
npm run db:seed
```

The API runs by default on `http://localhost:3000`.

Useful backend endpoints:

- `GET /health`
- `GET /docs`
- `POST /auth/login`

## Frontend Setup

Create `mi-app/.env` based on `mi-app/.env.example`.

Default local frontend env:

```env
VITE_API_URL=http://localhost:3000
```

The frontend runs by default on `http://localhost:5173`.

Important routes:

- Store: `/`
- Catalog: `/catalogo`
- Cart: `/carrito`
- Admin login: `/admin/login`
- Admin dashboard: `/admin`

## Development Commands

Backend:

```bash
cd server
npm run start:dev
```

Frontend:

```bash
cd mi-app
npm run dev
```

## Notes

- The backend serves uploaded files from `/uploads`.
- The seed script creates an admin user. Set `SEED_ADMIN_PASSWORD` before running the seed in shared or production environments.
- SMTP is optional. If you leave it empty, mail features will not be active.
- OpenAI image enhancement is optional. Set `OPENAI_API_KEY` only if you want that feature enabled.

## Deployment Idea

One practical Azure setup for this project is:

- Frontend in Azure Static Web Apps
- Backend in Azure App Service
- Database in Azure SQL Database

## License

This repository currently has no license file.
