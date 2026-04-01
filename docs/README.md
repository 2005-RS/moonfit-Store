# Documentacion Completa de Moonfit Store

Esta carpeta documenta la implementacion actual del ecommerce `Moonfit Store` tal como existe en este repositorio: tienda publica, panel administrativo, API, base de datos, flujos operativos y forma de correr el sistema en local.

## Que cubre esta documentacion

- alcance funcional del ecommerce
- arquitectura general del frontend, backend y base de datos
- modulos y responsabilidades
- rutas del frontend y endpoints del backend
- modelos de Prisma y relaciones
- flujos de negocio: catalogo, carrito, pedidos, pagos, inventario, dashboard
- instalacion, variables de entorno, comandos y operacion local

## Mapa de documentos

- [Presentacion profesional](./presentacion-profesional.md)
- [Guia de entrevista tecnica](./guia-entrevista-tecnica.md)
- [Arquitectura](./arquitectura.md)
- [Frontend](./frontend.md)
- [Backend](./backend.md)
- [Base de datos](./base-de-datos.md)
- [API](./api.md)
- [Flujos operativos](./flujos-operativos.md)
- [Instalacion y operacion](./instalacion-y-operacion.md)

## Vista rapida del sistema

`mi-app`
- Aplicacion React + Vite.
- Contiene la tienda para clientes y el panel administrativo.

`server`
- API REST en NestJS.
- Gestiona autenticacion, productos, categorias, marcas, combos, promociones, pedidos, clientes, inventario y reportes.

`server/prisma`
- Define el modelo relacional en SQL Server y el seed inicial.

`docs`
- Documentacion funcional y tecnica del proyecto.

## Actores del sistema

`Visitante`
- navega la tienda
- ve catalogo y detalle de producto
- agrega al carrito

`Cliente`
- crea cuenta
- mantiene perfil
- ve favoritos
- consulta historial de pedidos
- reordena compras
- reporta pagos de pedidos a credito

`Administrador`
- entra al panel admin
- gestiona catalogo, clientes, pedidos e inventario
- consulta dashboard y reportes
- exporta CSV
- mejora imagenes de productos con IA

## URLs locales importantes

- Frontend tienda: `http://localhost:5173`
- Login admin: `http://localhost:5173/admin/login`
- Dashboard admin: `http://localhost:5173/admin`
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Healthcheck: `http://localhost:3000/health`

## Acceso inicial de demo

El seed crea un administrador local:

- correo: `admin@eccomers.dev`
- contrasena por defecto: `Admin123..`

Importante:
- en ambientes compartidos o productivos debes cambiar `SEED_ADMIN_PASSWORD`
- la contrasena por defecto solo es aceptable para desarrollo local

## Puesta en marcha corta

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

## Fuente de verdad para payloads exactos

Esta carpeta documenta el sistema a nivel tecnico y funcional. Si necesitas ver campos exactos de cada request o response, usa tambien:

- `server/src/**/*.dto.ts`
- `server/prisma/schema.prisma`
- Swagger en `/docs`

## Estado actual del proyecto

- preparado para desarrollo local
- persistencia en SQL Server usando Prisma
- autenticacion por JWT
- uploads locales servidos desde `/uploads`
- despliegue en nube todavia no definido en esta documentacion

## Uso recomendado de esta carpeta

Si lo quieres usar para estudio o mantenimiento:

- empieza por [Arquitectura](./arquitectura.md)
- luego revisa [Frontend](./frontend.md), [Backend](./backend.md) y [Base de datos](./base-de-datos.md)

Si lo quieres usar para entrevista o presentacion:

- empieza por [Presentacion profesional](./presentacion-profesional.md)
- luego usa [Guia de entrevista tecnica](./guia-entrevista-tecnica.md)
- luego apoya tu explicacion con [Flujos operativos](./flujos-operativos.md) y [API](./api.md)
