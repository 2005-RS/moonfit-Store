# Instalacion y operacion

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- SQL Server disponible

## Estructura del proyecto

```text
eccomers/
  mi-app/    -> frontend React/Vite
  server/    -> backend NestJS + Prisma
  docs/      -> documentacion
```

## Variables de entorno

### Backend

Archivo base:

- `server/.env.example`

Variables principales:

- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_ENCRYPT`
- `DB_TRUST_SERVER_CERT`
- `HOST`
- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `JWT_EXPIRES_IN_SECONDS`
- `SEED_ADMIN_PASSWORD`
- `CRC_REFERENCE_RATE`
- `CRC_ROUNDING`
- `CREDIT_REMINDER_INTERVAL_HOURS`
- `CREDIT_REMINDER_DAYS_BEFORE`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `OPENAI_API_KEY`
- `OPENAI_IMAGE_MODEL`

### Frontend

Archivo base:

- `mi-app/.env.example`

Variable principal:

- `VITE_API_URL=http://localhost:3000`

## Instalacion inicial

### Backend

```bat
cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\server
copy .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

### Frontend

```bat
cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\mi-app
copy .env.example .env
npm install
```

## Arranque en desarrollo

### Backend

```bat
cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\server
npm run start:dev
```

### Frontend

```bat
cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\mi-app
npm run dev
```

### Abrir ambos en dos ventanas CMD

```bat
start cmd /k "cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\server && npm run start:dev"
start cmd /k "cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\mi-app && npm run dev"
```

## URLs de trabajo

- tienda: `http://localhost:5173`
- admin login: `http://localhost:5173/admin/login`
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`

## Credenciales de desarrollo

Seed actual:

- email admin: `admin@eccomers.dev`
- contrasena por defecto: `Admin123..`

Recomendacion:

- cambia `SEED_ADMIN_PASSWORD` antes de usar el seed fuera de local

## Comandos utiles

### Backend

```bat
cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\server
npx prisma generate
npx prisma db push
npm run db:seed
npm run build
npm run start:dev
```

### Frontend

```bat
cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\mi-app
npm run dev
npm run build
```

## Operacion diaria recomendada

1. levantar SQL Server
2. arrancar backend
3. arrancar frontend
4. revisar `/health`
5. entrar al admin y validar dashboard

## Errores comunes

### `npm ERR! enoent Could not read package.json`

Causa:

- estas parado en una carpeta que no es `mi-app` ni `server`

Solucion:

```bat
cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\mi-app
```

o

```bat
cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers\server
```

### `400 Bad Request` en listas admin

Causa frecuente ya observada:

- mandar `pageSize` mayor que `50`

Solucion:

- usar paginacion valida
- apoyarse en las funciones admin ya corregidas del frontend

### El frontend no carga datos

Revisa:

- que `VITE_API_URL` apunte al backend correcto
- que el backend este activo
- que CORS no este bloqueando por URL equivocada

### No puedes entrar al admin

Revisa:

- que el usuario tenga rol `ADMIN`
- que el seed se haya ejecutado
- que la contrasena coincida con `SEED_ADMIN_PASSWORD`

### Prisma no conecta

Revisa:

- credenciales SQL Server
- puerto
- cifrado
- certificados
- nombre de base de datos

## Git y publicacion de cambios

Para guardar cambios en GitHub:

```bat
cd /d C:\Users\ronny\OneDrive\Escritorio\eccomers
git add .
git commit -m "describe tu cambio"
git push
```

## Estado de despliegue

El proyecto hoy esta documentado y preparado para desarrollo local. El despliegue cloud todavia no queda fijado en esta guia.
