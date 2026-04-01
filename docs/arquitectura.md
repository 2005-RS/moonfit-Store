# Arquitectura

## Vision general

Moonfit Store es un monolito modular full-stack compuesto por:

- un frontend React/Vite que contiene tienda y panel administrativo
- un backend NestJS expuesto como API REST
- una base de datos SQL Server accedida por Prisma
- almacenamiento local de archivos subidos

## Diagrama logico

```text
Navegador
  |
  v
React + Vite (mi-app)
  - tienda publica
  - panel admin
  - contextos globales
  - clientes API
  |
  v
NestJS REST API (server)
  - auth
  - customers
  - products
  - categories
  - brands
  - campaigns
  - combos
  - orders
  - inventory
  - reports
  |
  v
Prisma
  |
  v
SQL Server

Archivos auxiliares:
- /uploads para imagenes y comprobantes
- /docs para Swagger
```

## Separacion por capas

`Frontend`
- renderiza interfaces y administra experiencia de usuario
- mantiene sesion, carrito, overlays y parte del estado comercial
- consume la API por medio de clientes centralizados

`Backend`
- valida datos
- aplica reglas de negocio
- consulta y muta la base de datos
- registra auditoria
- sirve archivos y documentacion Swagger

`Base de datos`
- conserva usuarios, clientes, catalogo, pedidos, pagos, inventario y auditoria

## Arquitectura del frontend

La aplicacion entra por `src/main.tsx` y monta `App`.

Arbol principal de proveedores:

```text
FeedbackProvider
  AuthProvider
    CommerceProvider
      CartProvider
        StorefrontUiProvider
          AppRouter
```

Responsabilidad de cada proveedor:

- `FeedbackProvider`: mensajes de exito, error y retroalimentacion al usuario.
- `AuthProvider`: sesion, perfil, login, logout, refresco de usuario actual.
- `CommerceProvider`: carga datos comerciales y expone acciones de negocio.
- `CartProvider`: carrito persistente del storefront.
- `StorefrontUiProvider`: drawer del carrito, quick view y overlays.

La app esta partida funcionalmente en dos grandes superficies:

- tienda publica para cliente final
- panel administrativo para operacion interna

## Arquitectura del backend

El backend arranca en `server/src/main.ts` y aplica:

- carga de variables de entorno
- CORS global
- `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`
- filtro global de errores
- Swagger en `/docs`
- servicio de archivos para `/uploads`

El modulo raiz (`AppModule`) ensambla:

- `PrismaModule`
- `MailModule`
- `AuthModule`
- `CustomersModule`
- `ProductsModule`
- `CategoriesModule`
- `BrandsModule`
- `CampaignsModule`
- `CombosModule`
- `OrdersModule`
- `InventoryModule`
- `ReportsModule`
- `AuditModule`

## Estilo arquitectonico

- monolito modular
- API REST JSON
- autenticacion stateless con JWT
- Prisma como capa de acceso a datos
- DTOs y validacion de entrada en el backend
- mapeo de datos hacia modelos de UI en el frontend

## Seguridad y acceso

La seguridad actual se apoya en:

- token JWT para endpoints protegidos
- validacion del perfil actual con `/auth/me`
- rol `ADMIN` para panel administrativo
- rol `CUSTOMER` para experiencia de cuenta del cliente
- limpieza de sesion del frontend cuando la API responde `401`

## Archivos y uploads

El sistema maneja archivos locales para:

- imagenes de producto
- comprobantes de pago de clientes

Los archivos se sirven desde el backend bajo `/uploads`.

En productos existe ademas una mejora de imagen asistida por IA. Esa accion genera una vista previa y luego el producto debe guardarse para persistir el resultado final.

## Auditoria y trazabilidad

Las operaciones importantes escriben auditoria en `AuditLog`, por ejemplo:

- creacion y actualizacion de productos
- ajustes de inventario
- creacion de pedidos
- cambios de estado de pedidos
- registro de pagos

El dashboard consume parte de esta informacion para mostrar actividad reciente.

## Convenciones importantes

- paginacion comun con `page`, `pageSize` y `search`
- `pageSize` maximo actual: `50`
- estados y tipos manejados como cadenas de dominio consistentes entre frontend y backend
- el frontend toma `VITE_API_URL` y cae por defecto en `http://localhost:3000`

## Lo que no existe hoy

En la implementacion actual no se observa:

- microservicios
- cola externa de jobs
- almacenamiento cloud para uploads
- despliegue cloud definido dentro del repositorio

Todo el sistema esta pensado hoy para ejecutarse de forma local o adaptarse luego al hosting elegido.
