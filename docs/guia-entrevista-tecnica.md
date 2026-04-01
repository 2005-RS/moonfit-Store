# Guia de entrevista tecnica

## Objetivo

Esta guia esta hecha para ayudarte a hablar de Moonfit Store con seguridad en entrevistas de:

- frontend
- backend
- full-stack

La idea no es que memorices todo palabra por palabra, sino que tengas respuestas claras, tecnicas y creibles.

## Como abrir la conversacion

Una forma buena de introducir el proyecto es:

> Quise construir un ecommerce que no fuera solo una vitrina visual. Por eso lo pense como un sistema completo: tienda publica, panel administrativo, API modular, base de datos relacional y flujos reales de negocio como pedidos, pagos, inventario y dashboard operativo.

## Si la entrevista es de frontend

Enfatiza estas partes:

- arquitectura del frontend con providers y rutas separadas
- experiencia de usuario entre tienda y admin
- carrito persistente
- manejo de estado
- consumo tipado de la API
- responsividad
- jerarquia visual y UX de acciones importantes

### Respuesta corta de enfoque frontend

> En frontend me enfoque en construir una sola app React capaz de soportar dos experiencias distintas: la tienda para cliente final y el panel administrativo. Lo resolvi con rutas, layouts y contextos globales separados, ademas de una capa de clientes API y mapeadores para mantener el codigo mas estable y reutilizable.

### Cosas concretas que puedes mencionar

- `AuthContext` para sesion y perfil
- `CommerceContext` para datos y acciones de negocio
- `CartContext` para carrito persistente
- `StorefrontUiContext` para overlays como quick view y drawer
- consumo de API desde `src/lib`
- mejoras recientes de responsividad y jerarquia visual

### Pregunta tipica: "Como organizaste el estado?"

Respuesta sugerida:

> Separe el estado por responsabilidad. La autenticacion vive en `AuthContext`, el carrito en `CartContext`, la experiencia UI del storefront en `StorefrontUiContext` y la informacion comercial en `CommerceContext`. Eso me permitio evitar un estado global demasiado acoplado y mantener acciones de negocio reutilizables.

### Pregunta tipica: "Como evitaste que el frontend se volviera desordenado?"

Respuesta sugerida:

> Centralice el acceso HTTP y los mapeos hacia modelos del frontend. Asi las pantallas no dependen directamente del shape crudo del backend y la app se mantiene mas facil de evolucionar.

## Si la entrevista es de backend

Enfatiza estas partes:

- modularidad en NestJS
- DTOs y validacion
- reglas de negocio en pedidos
- credito, pagos y estado de cobro
- inventario y movimientos
- auditoria
- reportes y dashboard

### Respuesta corta de enfoque backend

> En backend estructure el proyecto como un monolito modular con NestJS. Cada dominio tiene su modulo y sus reglas de negocio. Por ejemplo, en pedidos no solo guardo una orden: valido stock, monto pagado, credito aprobado, limite de credito, saldo pendiente, fecha de vencimiento y actualizacion de inventario, todo con trazabilidad.

### Cosas concretas que puedes mencionar

- `ValidationPipe` global
- paginacion unificada con limite maximo de `50`
- Prisma como capa de acceso a datos
- `OrdersService` como pieza fuerte de logica de negocio
- `InventoryService` para ajustes seguros
- `ReportsService` para armar el dashboard
- `AuditLog` para trazabilidad

### Pregunta tipica: "Donde dejaste la logica importante?"

Respuesta sugerida:

> La logica importante esta en servicios del backend, no en el frontend. El frontend puede ayudar con validaciones de UX, pero la fuente real de verdad esta en el backend, especialmente en modulos como pedidos, inventario y clientes.

### Pregunta tipica: "Que tan real es el flujo de pedidos?"

Respuesta sugerida:

> Bastante real para un proyecto de ecommerce. La orden valida existencias, calcula subtotal y total, resuelve si es contado o credito, verifica limite de credito si aplica, genera el numero de orden, descuenta stock, registra movimientos y actualiza estados de cobro.

## Si la entrevista es full-stack

Aqui conviene equilibrar producto, arquitectura y negocio.

### Respuesta corta de enfoque full-stack

> Lo mas importante para mi fue conectar bien las tres capas: interfaz, API y persistencia. Queria que el sistema se sintiera coherente de punta a punta. Por eso pense el proyecto no solo como frontend bonito o backend tecnico, sino como un flujo comercial completo con cliente, operacion interna y reglas de negocio.

### Lo que debes remarcar

- integracion real entre frontend y backend
- contratos tipados y mapeo de datos
- separacion entre tienda y admin
- consistencia entre pedidos, pagos e inventario
- dashboard alimentado por datos reales

## Tus 5 mejores argumentos tecnicos

Cuando te quedes en blanco, vuelve a estos:

1. Es un proyecto full-stack con flujo comercial completo, no solo un CRUD.
2. Tiene dos superficies reales: cliente y administracion.
3. El backend concentra reglas reales de negocio.
4. La base de datos modela relaciones utiles para operacion y trazabilidad.
5. La UI fue pensada tambien para uso real, no solo para verse bien.

## Tus 5 mejores argumentos de negocio

1. permite vender productos y combos
2. permite administrar catalogo y promociones
3. permite seguimiento de pedidos y pagos
4. permite control de inventario
5. permite visibilidad operativa con dashboard

## Preguntas dificiles y como responderlas

## "Por que no hiciste microservicios?"

Respuesta sugerida:

> Porque para este alcance priorice simplicidad, velocidad de desarrollo y claridad operativa. Un monolito modular me da buena separacion por dominios sin cargar al proyecto con complejidad de despliegue o comunicacion entre servicios.

## "Que limitaciones tiene hoy?"

Respuesta sugerida:

> Hoy esta muy bien para desarrollo y demo funcional, pero yo mismo reconoceria mejoras pendientes como pipeline de CI/CD, pruebas automatizadas mas amplias, observabilidad y despliegue cloud formal.

## "Que parte te hace sentir mas orgulloso?"

Respuesta sugerida:

> Que el proyecto tiene coherencia entre experiencia de usuario y reglas de negocio. No se queda en lo superficial: conecta compra, administracion, pagos, inventario y reportes en un flujo consistente.

## "Que cambiarias si fuera a produccion?"

Respuesta sugerida:

> Llevaria uploads a almacenamiento cloud, endureceria seguridad, agregaria pruebas, logs mas robustos, monitoreo, backups y una estrategia clara de despliegue y secretos.

## Como defender las mejoras recientes sin sonar improvisado

Puedes decir algo como:

> A medida que lo fui usando tambien como si fuera un usuario real, fui detectando puntos de mejora. Por ejemplo, refine responsividad, corregi limites de paginacion entre frontend y backend y mejore la jerarquia visual de acciones importantes para que el admin y la tienda se sintieran mas claros.

## Si te piden hablar de un bug real

Buen ejemplo de este proyecto:

- el frontend admin llego a pedir `pageSize=100`
- el backend validaba un maximo de `50`
- eso causaba `400 Bad Request`
- la solucion correcta no fue solo bajar un numero, sino implementar una carga paginada consistente en el frontend admin

Eso demuestra:

- lectura real del problema
- comprension del contrato API
- solucion robusta y no parche rapido

## Si te piden hablar de UX

Puedes usar este enfoque:

> No trate la UX como maquillaje. En un ecommerce, la claridad importa porque impacta la conversion y la operacion. Por eso trabaje responsividad, jerarquia visual, contraste de acciones importantes y legibilidad del dashboard.

## Si te piden hablar de datos o modelado

Puedes decir:

> El modelo esta pensado para que el sistema tenga memoria operativa. Por eso los pedidos guardan snapshot del cliente, los pagos quedan separados, los movimientos de inventario dejan razon y el log de auditoria conserva acciones relevantes.

## Forma recomendada de cerrar una respuesta

Este cierre suele funcionar bien:

> En resumen, este proyecto demuestra mi capacidad para construir una solucion completa, pensar en negocio y mantener una base tecnica ordenada para seguir creciendo.

## Mini guion de 90 segundos

Si necesitas una version muy practica:

> Moonfit Store es un ecommerce full-stack que construi para cubrir tanto la experiencia del cliente como la operacion interna. En frontend use React con Vite para tener una sola app con tienda y admin, separadas por rutas y layouts. En backend use NestJS para organizar la logica por modulos y Prisma con SQL Server para la persistencia. El sistema maneja catalogo, carrito, pedidos, pagos a credito, inventario, clientes, dashboard y auditoria. Lo que mas valoro del proyecto es que no se queda en lo visual: tiene reglas de negocio reales y una estructura que podria evolucionar bien hacia un entorno de produccion.

## Recomendacion final para practicar

Antes de una entrevista:

1. practica el pitch de 30 segundos
2. practica el mini guion de 90 segundos
3. elige 3 decisiones tecnicas para defender
4. elige 2 limitaciones que dirias con honestidad
5. prepara una demo corta de tienda y admin
