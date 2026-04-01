# Base de datos

## Tecnologia

- motor: SQL Server
- acceso: Prisma
- esquema fuente: `server/prisma/schema.prisma`

## Panorama del modelo

La base de datos cubre cinco bloques:

- identidad y acceso
- catalogo comercial
- clientes y favoritos
- pedidos, pagos e inventario
- auditoria operativa

## Modelos

| Modelo | Proposito | Campos y relaciones clave |
| --- | --- | --- |
| `User` | identidad autenticable | `email` unico, `password`, `role`, relacion opcional 1:1 con `Customer`, relacion con `AuditLog` como actor |
| `Customer` | perfil comercial del cliente | `name`, `email` unico, `phone`, `city`, estado, parametros de credito, relacion opcional a `User`, relacion con `Order`, `FavoriteProduct` y `OrderPayment` |
| `Category` | clasificacion del catalogo | `name` unico, `slug` unico, descripcion, estado, relacion 1:N con `Product` |
| `Brand` | marca comercial | `name` unico, `slug` unico, descripcion, estado, relacion 1:N con `Product` |
| `Campaign` | banner o pieza promocional | `title`, `subtitle`, `ctaLabel`, `ctaHref`, `image`, `placement`, `discountTag`, `status` |
| `Combo` | oferta compuesta | `slug` unico, `title`, `subtitle`, `image`, `price`, `previousPrice`, `ctaLabel`, `status`, relacion 1:N con `ComboItem` |
| `Product` | producto vendible | `slug` unico, `name`, `description`, `price`, `previousPrice`, `stock`, `expirationDate`, `badge`, `image`, `status`, FK opcionales a `Brand` y `Category`, relacion con `OrderItem`, `InventoryMovement`, `ProductGoal`, `FavoriteProduct` y `ComboItem` |
| `ProductGoal` | etiqueta/objetivo comercial del producto | clave compuesta `productId + goal`, relacion N:1 con `Product` |
| `FavoriteProduct` | favoritos del cliente | clave compuesta `customerId + productId`, relacion N:1 con `Customer` y `Product` |
| `ComboItem` | item interno de un combo | `comboId`, `productId`, `quantity`, relacion con `Combo` y `Product` |
| `Order` | pedido comercial | `orderNumber` unico, datos snapshot del cliente, `status`, `paymentType`, `paymentMethod`, `subtotal`, `shipping`, `total`, `amountPaid`, `balanceDue`, `dueDate`, `creditReminderSentAt`, `collectionStatus`, `notes`, relacion con `Customer`, `OrderItem` y `OrderPayment` |
| `OrderPayment` | pago aplicado o reportado sobre una orden | `orderId`, `customerId`, `amount`, `paymentMethod`, `reference`, `notes`, `proofImage`, `source`, relacion con `Order` y opcional con `Customer` |
| `OrderItem` | item congelado del pedido | `orderId`, `productId`, `quantity`, `unitPrice`, `total`, relacion con `Order` y `Product` |
| `InventoryMovement` | trazabilidad de stock | `productId`, `type`, `quantity`, `reason`, `createdAt`, relacion con `Product` |
| `AuditLog` | trazabilidad funcional | `entityType`, `entityId`, `action`, `summary`, `metadata`, actor opcional (`User`) y fecha |

## Relaciones principales

```text
User 1---0..1 Customer
Customer 1---N Order
Customer 1---N FavoriteProduct N---1 Product
Customer 1---N OrderPayment
Category 1---N Product
Brand 1---N Product
Product 1---N OrderItem N---1 Order
Product 1---N InventoryMovement
Product 1---N ProductGoal
Combo 1---N ComboItem N---1 Product
User 1---N AuditLog
```

## Restricciones y unicidad

Restricciones unicas:

- `User.email`
- `Customer.userId`
- `Customer.email`
- `Category.name`
- `Category.slug`
- `Brand.name`
- `Brand.slug`
- `Combo.slug`
- `Product.slug`
- `Order.orderNumber`

Claves compuestas:

- `ProductGoal(productId, goal)`
- `FavoriteProduct(customerId, productId)`

## Reglas de eliminacion relevantes

Con `onDelete: Cascade`:

- `ProductGoal` se elimina si cae el producto
- `FavoriteProduct` se elimina si cae el cliente o el producto
- `ComboItem` se elimina si cae el combo
- `OrderItem` se elimina si cae la orden
- `OrderPayment` se elimina si cae la orden

Sin cascada fuerte en todas las relaciones:

- los productos ligados a historico de pedidos o inventario deben tratarse con cuidado desde la logica de negocio

## Estados y valores de dominio

Segun las constantes del backend:

- roles: `ADMIN`, `CUSTOMER`
- estado de registro: `ACTIVE`, `INACTIVE`
- estados de pedido: `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`
- tipos de inventario: `IN`, `OUT`
- tipos de pago: `CASH`, `CREDIT`
- estado de cobro: `PENDING`, `PARTIAL`, `PAID`, `OVERDUE`

## Datos snapshot vs datos relacionales

El modelo `Order` guarda datos del cliente dentro del pedido:

- `customerName`
- `customerEmail`
- `customerPhone`
- `customerCity`

Esto es correcto y util porque conserva el estado comercial de la compra aunque el perfil del cliente cambie luego.

## Fechas y dinero

- montos guardados como `Float`
- fechas de auditoria y operacion como `DateTime`
- algunos vencimientos de producto se almacenan como `String` en formato de fecha

## Seed inicial

El seed crea y actualiza:

- admin inicial
- categorias base
- marcas base
- productos demo

Tambien usa una referencia para convertir precios ejemplo a colones.
