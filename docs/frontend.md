# Frontend

## Stack

- React 19
- Vite
- TypeScript
- React Router 7

## Entrada de la aplicacion

`src/main.tsx`
- monta la app dentro de `StrictMode`

`src/App.tsx`
- ensambla todos los contextos globales
- entrega el control final a `AppRouter`

## Estructura funcional

El frontend concentra dos aplicaciones en una:

- `storefront`: experiencia publica de compra
- `admin`: experiencia interna de gestion

Carpetas importantes:

- `src/context`: estado global y acciones principales
- `src/layouts`: layouts de tienda y admin
- `src/pages`: pantallas
- `src/components`: piezas reutilizables
- `src/lib`: clientes API, auth, mapeadores y utilidades
- `src/types`: contratos tipados del frontend

## Rutas principales

### Tienda

| Ruta | Pantalla | Uso |
| --- | --- | --- |
| `/` | HomePage | portada comercial |
| `/catalogo` | CatalogPage | listado de productos |
| `/producto/:slug` | ProductDetailPage | detalle de producto |
| `/carrito` | CartPage | carrito y checkout |
| `/cuenta` | CustomerAccountPage | login, registro, perfil, favoritos y pedidos |
| `/inicio` | redirect | redirige a `/` |

### Administracion

| Ruta | Pantalla | Uso |
| --- | --- | --- |
| `/admin/login` | AdminLoginPage | acceso administrativo |
| `/admin` | AdminDashboardPage | dashboard operativo |
| `/admin/productos` | AdminProductsPage | catalogo de productos |
| `/admin/categorias` | AdminCategoriesPage | categorias |
| `/admin/marcas` | AdminBrandsPage | marcas |
| `/admin/combos` | AdminCombosPage | combos |
| `/admin/promociones` | AdminCampaignsPage | campanas |
| `/admin/pedidos` | AdminOrdersPage | pedidos y cobros |
| `/admin/inventarios` | AdminInventoryPage | stock y movimientos |
| `/admin/clientes` | AdminCustomersPage | clientes |

### Otras

| Ruta | Pantalla |
| --- | --- |
| `*` | NotFoundPage |

## Contextos globales

### AuthContext

Responsabilidades:

- conservar sesion autenticada
- exponer `login`, `logout` y `refreshProfile`
- validar el token con `/auth/me`
- distinguir `isAuthenticated` e `isAdmin`

Persistencia local:

- `moonfit_session`: sesion JWT
- `moonfit_auth_notice`: mensaje corto para expirar sesion o denegar acceso admin

## CommerceContext

Responsabilidades:

- cargar datos comerciales del sistema
- exponer acciones de negocio consumidas por pantallas
- mapear DTOs del backend a modelos del frontend

Acciones relevantes:

- `refreshCommerce`
- `createProduct`
- `updateProduct`
- `deleteProduct`
- `createOrder`
- `updateOrderStatus`
- `adjustStock`

Comportamiento:

- siempre carga productos publicos
- cuando la sesion es admin tambien carga pedidos e inventario necesarios para el panel
- arma `FormData` cuando una operacion necesita subir archivos

## CartContext

Responsabilidades:

- gestionar el carrito de compra del storefront
- persistirlo localmente
- recalcular subtotal y cantidad de items
- validar existencias disponibles al cambiar cantidades

Persistencia local:

- `moonfit-cart`

Acciones relevantes:

- `addToCart`
- `addBundleToCart`
- `increaseQuantity`
- `decreaseQuantity`
- `removeFromCart`
- `clearCart`
- `isInCart`
- `getAvailableStock`

## StorefrontUiContext

Responsabilidades:

- abrir y cerrar drawer del carrito
- abrir y cerrar quick view de producto
- coordinar overlays del storefront

Comportamiento:

- agrega la clase `storefront-overlay-open` al `body` cuando hay un overlay activo
- cierra overlays con la tecla `Escape`

## Clientes API del frontend

`src/lib/api.ts`
- cliente base
- usa `VITE_API_URL` o `http://localhost:3000`
- adjunta `Authorization: Bearer <token>` cuando hay sesion
- maneja JSON y `FormData`
- limpia sesion al recibir `401`

`src/lib/auth.ts`
- login
- registro de cliente
- lectura y escritura de sesion
- validacion del usuario actual

`src/lib/adminApi.ts`
- CRUD admin de categorias, marcas, clientes, productos, combos y campanas
- exportacion de CSV
- carga paginada de productos admin
- dashboard
- recordatorio de creditos
- mejora de imagen con IA

`src/lib/customerApi.ts`
- perfil del cliente
- favoritos
- historial de pedidos
- reorder
- reporte de pago por cliente

`src/lib/commerceMappers.ts`
- traduce payloads del backend a estructuras mas utiles para la UI

## Funcionalidad de la tienda

La experiencia de cliente cubre:

- home comercial
- catalogo
- detalle de producto
- carrito persistente
- checkout
- login y registro de clientes
- perfil de cliente
- favoritos
- historial de pedidos
- reorden de pedidos anteriores
- reporte de pagos a credito con comprobante

El checkout en `CartPage` valida stock antes de crear la orden y limpia el carrito al terminar correctamente.

## Funcionalidad administrativa

El panel admin cubre:

- dashboard con metricas de ingresos, pedidos, inventario y actividad
- CRUD de productos
- CRUD de categorias
- CRUD de marcas
- CRUD de campanas
- CRUD de combos
- gestion de clientes
- gestion de pedidos
- registro de pagos
- ajustes manuales de inventario
- exportaciones CSV

## Layouts y componentes importantes

`StoreLayout`
- header, navegacion, drawer del carrito, quick view y footer

`AdminLayout`
- shell del panel administrativo

Componentes clave:

- `StoreHeader`
- `StoreFooter`
- `CartDrawer`
- `QuickViewModal`
- `ProductCard`
- componentes del home
- `ProtectedAdminRoute`
- `EntityCrudSection`

## Variables de entorno del frontend

Archivo base:

- `mi-app/.env.example`

Variable principal:

- `VITE_API_URL=http://localhost:3000`

## Consideraciones de UX actuales

- la sesion del usuario se restaura desde `localStorage`
- el carrito sigue existiendo entre recargas
- el admin y la tienda comparten una misma app pero con rutas separadas
- el frontend ya tiene trabajo de responsividad y mejoras visuales recientes, especialmente en tienda y dashboard
