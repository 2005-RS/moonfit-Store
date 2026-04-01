# Flujos operativos

## 1. Navegacion de tienda

Flujo base:

1. el visitante entra al home
2. navega catalogo y detalle de producto
3. agrega productos o combos al carrito
4. el carrito queda persistido localmente
5. el usuario pasa al checkout en `/carrito`

Reglas observables:

- el carrito se sincroniza con el stock disponible
- el quick view y el drawer del carrito son overlays del storefront

## 2. Registro e inicio de sesion de cliente

1. el usuario entra a `/cuenta`
2. puede registrarse o iniciar sesion
3. al registrarse se crea `User` y `Customer`
4. el frontend guarda `moonfit_session`
5. la app consulta `/auth/me` para validar la sesion

Resultado:

- el cliente puede editar su perfil
- puede ver favoritos
- puede ver pedidos propios

## 3. Checkout y creacion de pedido

1. el cliente confirma datos de compra
2. el frontend valida existencias antes de enviar
3. el backend vuelve a validar productos y stock
4. el backend calcula subtotal, shipping y total
5. se crea la orden con su numero unico
6. se crean `OrderItem`
7. se descuenta inventario
8. se registran `InventoryMovement`
9. se intenta enviar confirmacion

Salida funcional:

- pedido creado
- stock actualizado
- auditoria escrita
- carrito limpiado en frontend cuando la operacion termina bien

## 4. Venta al contado vs venta a credito

### Contado

- puede existir sin cliente aprobado a credito
- no depende de limite de credito

### Credito

- requiere cliente registrado
- requiere `creditApproved = true`
- valida `creditLimit`
- calcula fecha de vencimiento con `creditDays`
- mantiene `balanceDue`
- usa `collectionStatus` para seguimiento de cobro

## 5. Pagos de pedidos a credito

### Desde admin

1. el admin abre un pedido
2. registra un pago
3. el backend valida monto
4. se crea `OrderPayment`
5. se recalculan `amountPaid`, `balanceDue` y `collectionStatus`

### Desde cliente

1. el cliente entra a su historial
2. elige un pedido a credito
3. reporta pago y puede adjuntar comprobante
4. el backend verifica que la orden le pertenezca
5. se registra el pago con `source = CUSTOMER`

## 6. Reorder

1. el cliente autenticado elige una orden anterior
2. el sistema toma los items de esa orden
3. se crea una nueva orden reutilizando esa base
4. la nueva orden pasa por todas las validaciones actuales

Esto es importante porque:

- si hoy no hay stock suficiente, la reorden puede fallar
- si hoy el credito no alcanza, la reorden tambien puede fallar

## 7. Gestion administrativa del catalogo

Flujo normal de productos:

1. crear categoria y marca si hace falta
2. crear o editar producto
3. asignar precio, stock, objetivos y medios visuales
4. publicar o desactivar segun `status`

Apoyos operativos:

- exportacion CSV
- mejora de imagen con IA
- filtros y paginacion

## 8. Gestion de campanas y combos

### Campanas

Se usan para bloques promocionales visuales:

- home principal
- home secundaria
- destacado de catalogo

### Combos

Se usan para vender varias unidades o productos bajo una misma oferta comercial.

## 9. Inventario

Flujo de ajuste manual:

1. el admin entra a inventario
2. elige producto
3. indica cantidad positiva o negativa
4. agrega motivo
5. el backend recalcula stock
6. se registra `InventoryMovement`
7. se guarda auditoria

Reglas:

- no puede quedar stock negativo
- el dashboard usa `<= 10` como referencia actual de stock bajo

## 10. Dashboard

El dashboard resume el estado operativo actual en varios bloques:

- resumen comercial
- tendencias de los ultimos 7 dias
- top productos
- salud del inventario
- distribucion por estado de pedido
- actividad reciente

Indicadores clave:

- ingresos acumulados
- ticket promedio
- pedidos recientes
- stock bajo
- por vencer
- vencidos
- clientes activos

## 11. Favoritos

1. el cliente autenticado marca un producto como favorito
2. el sistema hace `upsert`
3. el cliente puede consultarlos desde su cuenta

## 12. Auditoria

Las operaciones administrativas y comerciales importantes quedan registradas en `AuditLog`.

Esto permite:

- trazabilidad
- actividad reciente en dashboard
- contexto para revisiones operativas
