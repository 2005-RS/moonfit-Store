# Moonfit Store

Moonfit Store es un ecommerce full-stack con tienda para clientes y panel administrativo para operacion interna.

## Stack

- Frontend: React 19 + Vite + React Router
- Backend: NestJS 11
- Base de datos: SQL Server + Prisma
- Auth: JWT
- Documentacion tecnica de API: Swagger en `/docs`

## Estructura del proyecto

- `mi-app/`: frontend de tienda y admin
- `server/`: API REST, auth, inventario, pedidos, uploads y reportes
- `docs/`: documentacion completa del sistema

## Documentacion completa

La documentacion detallada del ecommerce esta en:

- [Presentacion profesional](./docs/presentacion-profesional.md)
- [Guia de entrevista tecnica](./docs/guia-entrevista-tecnica.md)
- [Indice general](./docs/README.md)
- [Arquitectura](./docs/arquitectura.md)
- [Frontend](./docs/frontend.md)
- [Backend](./docs/backend.md)
- [Base de datos](./docs/base-de-datos.md)
- [API](./docs/api.md)
- [Flujos operativos](./docs/flujos-operativos.md)
- [Instalacion y operacion](./docs/instalacion-y-operacion.md)

## Arranque rapido

Backend:

```bat
cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\server
copy .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run start:dev
```

Frontend:

```bat
cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\mi-app
copy .env.example .env
npm install
npm run dev
```

## URLs locales

- tienda: `http://localhost:5173`
- admin login: `http://localhost:5173/admin/login`
- admin dashboard: `http://localhost:5173/admin`
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`

## Credenciales iniciales de desarrollo

Seed local:

- correo: `admin@eccomers.dev`
- contrasena por defecto: `Admin123..`

Importante:

- cambia `SEED_ADMIN_PASSWORD` si vas a usar el seed fuera de desarrollo local

## Notas

- el backend sirve archivos desde `/uploads`
- SMTP es opcional
- la mejora de imagen con IA es opcional y depende de `OPENAI_API_KEY`
- el proyecto esta documentado para desarrollo local; el despliegue cloud se definira despues

## Presentacion profesional

Si quieres usar este proyecto en entrevistas o portafolio, empieza por:

- [Guia de presentacion profesional](./docs/presentacion-profesional.md)
- [Guia de entrevista tecnica](./docs/guia-entrevista-tecnica.md)

## Licencia

Este repositorio todavia no incluye archivo de licencia.
