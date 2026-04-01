# Backend

## Stack

- NestJS 11
- Prisma
- SQL Server
- JWT
- Swagger

## Entrada y bootstrap

El backend arranca en `server/src/main.ts`.

Al iniciar hace lo siguiente:

- carga variables de entorno
- crea la aplicacion Nest
- habilita CORS
- registra validacion global con transformacion de tipos
- registra filtro global de excepciones
- expone Swagger en `/docs`
- sirve archivos locales bajo `/uploads`
- escucha en `PORT` o `3000`

## Modulos principales

| Modulo | Responsabilidad |
| --- | --- |
| `AuthModule` | login, registro de clientes y sesion actual |
| `CustomersModule` | perfiles, favoritos, clientes admin, reset de contrasena |
| `ProductsModule` | catalogo, detalle, CRUD admin, exportacion e imagen con IA |
| `CategoriesModule` | CRUD de categorias |
| `BrandsModule` | CRUD de marcas |
| `CampaignsModule` | banners y promociones configurables |
| `CombosModule` | combos comerciales compuestos por productos |
| `OrdersModule` | creacion de pedidos, cobros, reorder, estados y exportacion |
| `InventoryModule` | overview de stock y ajustes manuales |
| `ReportsModule` | dashboard y resumen operativo |
| `PrismaModule` | acceso a base de datos |
| `MailModule` | notificaciones por correo cuando esta configurado |
| `AuditModule` | trazabilidad de acciones relevantes |

## Reglas comunes del backend

- usa DTOs y validaciones de `class-validator`
- rechaza campos no permitidos por `whitelist` y `forbidNonWhitelisted`
- la paginacion compartida limita `pageSize` a `50`
- las respuestas protegidas usan JWT Bearer

## Autenticacion

### Registro

`POST /auth/register`

Comportamiento:

- solo crea usuarios con rol `CUSTOMER`
- exige nombre, email y contrasena de al menos 6 caracteres
- normaliza email a minusculas
- crea tambien el perfil `Customer`

### Login

`POST /auth/login`

Comportamiento:

- valida email y contrasena
- compara contrasena contra el hash persistido
- devuelve `accessToken` y vista del usuario autenticado

### Sesion actual

`GET /auth/me`

Comportamiento:

- valida el JWT
- devuelve una vista reducida del usuario y, si existe, su perfil de cliente

## Clientes

El modulo de clientes cubre dos escenarios:

- autogestion del cliente autenticado
- operacion administrativa del catalogo de clientes

Comportamientos relevantes:

- el perfil del cliente se busca por `userId`
- al editar perfil se actualizan `Customer.email` y `User.email`
- favoritos se guardan con `upsert`
- existe exportacion CSV para administracion
- el reset de contrasena admin solo aplica si el cliente tiene usuario asociado

## Productos

### Exposicion publica

- `GET /products` devuelve solo productos `ACTIVE`
- `GET /products/:id` busca un producto activo y trae marca, categoria y goals

### Administracion

- lista paginada con filtros y ordenamiento
- exportacion CSV
- creacion y edicion con relaciones a marca y categoria
- soporte para imagen subida o ruta/URL existente
- mejora de imagen con IA como previsualizacion

Reglas de negocio importantes:

- se valida que marca y categoria existan
- si falla una operacion con archivo subido, el backend limpia el archivo local temporal
- un producto no puede eliminarse si ya esta ligado a pedidos o movimientos historicos

## Categorias y marcas

Ambos modulos manejan:

- listado
- detalle por id
- crear
- actualizar
- eliminar

Se apoyan en slugs y estados de registro.

## Campanas y combos

### Campanas

Las campanas representan piezas comerciales configurables para zonas como:

- `HOME_HERO`
- `HOME_SECONDARY`
- `CATALOG_HIGHLIGHT`

### Combos

Los combos modelan una oferta compuesta por varios productos con cantidades internas.

## Pedidos

El modulo de pedidos concentra gran parte de las reglas del ecommerce.

### Creacion de pedido

Al crear una orden:

- valida que existan productos e items
- comprueba stock suficiente por producto
- calcula subtotal, shipping y total
- limita `amountPaid` al total
- resuelve si el pedido es contado o credito
- si es credito, exige cliente registrado y aprobado
- si es credito, valida limite de credito del cliente
- calcula `balanceDue`, `dueDate` y `collectionStatus`
- genera un numero unico de orden
- crea items de pedido
- descuenta inventario
- registra movimientos de inventario de salida
- escribe auditoria
- intenta enviar confirmacion de pedido por correo

Detalle importante:

- para pedidos a credito, el shipping actual se fuerza a `0`

### Cambio de estado

`PATCH /orders/:id/status`

Comportamiento:

- actualiza el estado operativo del pedido
- registra auditoria con estado anterior y nuevo

### Reorder

`POST /orders/:id/reorder`

Comportamiento:

- solo permite reordenar pedidos del cliente autenticado
- reutiliza items y datos base del pedido previo
- crea una nueva orden usando las validaciones actuales de stock y credito

### Registro de pagos

`POST /orders/:id/payments`
`POST /orders/:id/report-payment`

Comportamiento:

- solo aplica a pedidos a credito
- valida que el monto sea mayor a cero
- impide pagar mas del saldo pendiente
- si el pago lo reporta un cliente, verifica que la orden le pertenezca
- crea `OrderPayment`
- recalcula `amountPaid`, `balanceDue` y `collectionStatus`
- registra auditoria

## Inventario

El modulo de inventario expone:

- resumen general
- productos con stock bajo
- movimientos recientes
- ajuste manual de stock

Reglas:

- el umbral actual de stock bajo es `<= 10`
- un ajuste no puede dejar el stock bajo cero
- cada ajuste crea un `InventoryMovement`
- cada ajuste deja registro de auditoria

## Reportes y dashboard

`GET /reports/dashboard`

Genera:

- ingresos totales
- total de pedidos
- total de clientes
- total de productos
- unidades totales en inventario
- ticket promedio
- ingresos y pedidos de los ultimos 7 dias
- productos con stock bajo
- productos por vencer y vencidos
- top productos del ultimo periodo
- distribucion por estado de pedido
- actividad reciente desde `AuditLog`

Detalles de calculo observables:

- tendencias: ultimos 7 dias
- top productos: basado en items de pedidos recientes
- vencimientos: revision de los proximos 15 dias
- fechas de referencia: zona `America/Costa_Rica`

## Mail y servicios opcionales

`MailModule`
- se usa cuando existe configuracion SMTP
- sin SMTP, las funciones de correo quedan limitadas o inactivas segun la accion

OpenAI:

- la mejora de imagenes de producto depende de `OPENAI_API_KEY`
- si no se configura, esa capacidad no debe asumirse como disponible

## Auditoria

Las acciones relevantes escriben en `AuditLog`:

- entidad afectada
- accion
- resumen
- actor
- metadata serializada

Esto permite trazabilidad administrativa y alimenta parte del dashboard.
