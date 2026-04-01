# API

## Base local

- API local: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`

## Convenciones generales

- formato principal: JSON
- autenticacion: `Authorization: Bearer <token>`
- validacion global: el backend transforma tipos y rechaza campos no permitidos
- paginacion comun: `page`, `pageSize`, `search`
- `pageSize` maximo actual: `50`

## Autenticacion

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | no | registrar cliente |
| `POST` | `/auth/login` | no | iniciar sesion |
| `GET` | `/auth/me` | si | validar sesion actual |

## Base del sistema

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/` | no | respuesta base del servicio |
| `GET` | `/health` | no | salud de la API |
| `GET` | `/docs` | no | Swagger UI |

## Clientes

### Autogestion del cliente

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/customers/me` | cliente | perfil del cliente actual |
| `PATCH` | `/customers/me` | cliente | actualizar perfil |
| `GET` | `/customers/me/favorites` | cliente | listar favoritos |
| `POST` | `/customers/me/favorites/:productId` | cliente | guardar favorito |
| `DELETE` | `/customers/me/favorites/:productId` | cliente | quitar favorito |

### Operacion administrativa

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/customers` | admin | lista completa |
| `GET` | `/customers/admin/list` | admin | lista paginada y filtrable |
| `GET` | `/customers/admin/export` | admin | exportacion CSV |
| `GET` | `/customers/:id` | admin | detalle de cliente |
| `POST` | `/customers` | admin | crear cliente |
| `PATCH` | `/customers/:id` | admin | actualizar cliente |
| `PATCH` | `/customers/:id/password` | admin | reset de contrasena |
| `DELETE` | `/customers/:id` | admin | eliminar cliente |

Filtros de `GET /customers/admin/list`:

- `page`
- `pageSize`
- `search`
- `status`
- `sortBy`
- `sortDirection`

## Productos

### Publicos

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/products` | no | listado publico |
| `GET` | `/products/:id` | no | detalle publico |

### Administracion

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/products/admin/list` | admin | listado paginado admin |
| `GET` | `/products/admin/export` | admin | exportacion CSV |
| `POST` | `/products` | admin | crear producto |
| `PATCH` | `/products/:id` | admin | actualizar producto |
| `DELETE` | `/products/:id` | admin | eliminar producto |
| `POST` | `/products/admin/enhance-image` | admin | mejorar imagen con IA |

Filtros de `GET /products/admin/list`:

- `page`
- `pageSize`
- `search`
- `status`
- `brandId`
- `categoryId`
- `sortBy`
- `sortDirection`

Notas:

- la creacion y actualizacion soportan imagen
- el frontend ya pagina de 50 en 50 para respetar el limite del backend

## Categorias

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/categories` | no | listar categorias |
| `GET` | `/categories/:id` | no | detalle |
| `POST` | `/categories` | admin | crear |
| `PATCH` | `/categories/:id` | admin | actualizar |
| `DELETE` | `/categories/:id` | admin | eliminar |

## Marcas

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/brands` | no | listar marcas |
| `GET` | `/brands/:id` | no | detalle |
| `POST` | `/brands` | admin | crear |
| `PATCH` | `/brands/:id` | admin | actualizar |
| `DELETE` | `/brands/:id` | admin | eliminar |

## Campanas

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/campaigns` | no | listar campanas |
| `GET` | `/campaigns/active` | no | solo activas |
| `POST` | `/campaigns` | admin | crear |
| `PATCH` | `/campaigns/:id` | admin | actualizar |
| `DELETE` | `/campaigns/:id` | admin | eliminar |

## Combos

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/combos` | no | listar combos |
| `GET` | `/combos/active` | no | solo activos |
| `POST` | `/combos` | admin | crear |
| `PATCH` | `/combos/:id` | admin | actualizar |
| `DELETE` | `/combos/:id` | admin | eliminar |

## Pedidos

### Cliente

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/orders/me` | cliente | historial propio |
| `POST` | `/orders` | opcional | crear pedido |
| `POST` | `/orders/:id/reorder` | cliente | reordenar pedido |
| `POST` | `/orders/:id/report-payment` | cliente | reportar pago con comprobante |

### Administracion

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/orders` | admin | lista completa |
| `GET` | `/orders/admin/list` | admin | lista paginada y filtrable |
| `GET` | `/orders/admin/export` | admin | exportacion CSV |
| `GET` | `/orders/:id` | admin o autorizado | detalle |
| `POST` | `/orders/:id/payments` | admin | registrar pago |
| `PATCH` | `/orders/:id/status` | admin | cambiar estado |
| `POST` | `/orders/admin/credit-reminders/run` | admin | ejecutar recordatorios |

Filtros de `GET /orders/admin/list`:

- `page`
- `pageSize`
- `search`
- `status`
- `dateFrom`
- `dateTo`
- `sortBy`
- `sortDirection`

## Inventario

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/inventory` | admin | overview de inventario |
| `PATCH` | `/inventory/adjust` | admin | ajuste manual de stock |

## Reportes

| Metodo | Ruta | Auth | Uso |
| --- | --- | --- | --- |
| `GET` | `/reports/dashboard` | admin | resumen operativo del dashboard |

## Endpoints de archivos

Ademas del API JSON, el backend sirve archivos bajo:

- `/uploads/...`

Usos principales:

- imagenes locales de producto
- comprobantes de pago subidos por clientes

## Recomendacion para documentacion viva

Esta pagina resume el mapa funcional de la API. Para conocer payloads exactos, valores opcionales y esquemas completos, la referencia principal debe ser Swagger en `/docs`.
