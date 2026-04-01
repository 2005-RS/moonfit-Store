# Presentacion profesional

## Como presentar Moonfit Store en una entrevista

Este documento esta pensado para ayudarte a explicar el proyecto de forma profesional, clara y convincente en una entrevista tecnica, presentacion de portafolio o demo de trabajo.

## Resumen ejecutivo

Moonfit Store es un ecommerce full-stack que integra:

- tienda publica para cliente final
- panel administrativo para operacion interna
- API REST con autenticacion y reglas de negocio
- persistencia relacional en SQL Server
- trazabilidad de inventario, pedidos, pagos y auditoria

No es solo una landing o un CRUD visual. Es un sistema de comercio con flujo real de compra, operacion, seguimiento de clientes y control interno.

## Pitch corto de 30 segundos

Puedes decirlo asi:

> Desarrolle un ecommerce full-stack llamado Moonfit Store. Incluye una tienda publica para clientes, un panel administrativo para gestion operativa, una API en NestJS con autenticacion JWT y una base SQL Server modelada con Prisma. El sistema maneja productos, categorias, marcas, combos, campanas, carrito, pedidos, pagos, inventario, dashboard y trazabilidad administrativa.

## Pitch de 1 a 2 minutos

Version mas completa:

> Moonfit Store es un proyecto ecommerce que construi como una aplicacion full-stack. En el frontend use React con Vite para unificar la tienda y el panel administrativo en una sola experiencia, pero con rutas y flujos separados. En el backend use NestJS para estructurar la API por modulos y Prisma sobre SQL Server para la persistencia. El sistema permite gestionar catalogo, clientes, pedidos, pagos a credito, inventario y reportes operativos. Tambien incorpora auditoria y un dashboard que resume ingresos, estado de pedidos, salud del inventario y actividad reciente. Mi enfoque no fue solo que se viera bien, sino que reflejara procesos reales de negocio y operacion.

## Problema que resuelve

Este proyecto resuelve necesidades reales de un comercio que vende productos y necesita:

- exhibir catalogo y promociones al cliente
- permitir compra con carrito y checkout
- mantener cuentas de clientes y favoritos
- administrar pedidos y su estado
- controlar stock e historial de movimientos
- registrar pagos de pedidos a credito
- tener visibilidad operativa desde un dashboard

## Alcance funcional que puedes destacar

### Tienda publica

- home comercial
- catalogo
- detalle de producto
- quick view
- carrito persistente
- checkout
- cuenta del cliente
- favoritos
- historial de pedidos
- reorder
- reporte de pagos con comprobante

### Panel administrativo

- dashboard de negocio
- CRUD de productos
- CRUD de categorias
- CRUD de marcas
- CRUD de campanas
- CRUD de combos
- gestion de pedidos
- gestion de clientes
- ajustes de inventario
- exportacion CSV
- mejora de imagenes de producto con IA

## Stack y justificacion tecnica

### Frontend

- `React + Vite + TypeScript`

Por que tiene sentido:

- React facilita una UI modular y mantenible
- Vite acelera el flujo de desarrollo
- TypeScript ayuda a mantener contratos claros entre frontend y backend

### Backend

- `NestJS`

Por que tiene sentido:

- permite organizar la logica por modulos
- favorece DTOs, validacion y separacion de responsabilidades
- es una buena base para crecer a nivel de negocio sin caer rapido en desorden

### Persistencia

- `Prisma + SQL Server`

Por que tiene sentido:

- Prisma mejora productividad y consistencia del acceso a datos
- SQL Server encaja bien con entornos empresariales y estructuras transaccionales
- el modelo soporta pedidos, pagos, inventario y auditoria con trazabilidad clara

### Seguridad

- `JWT`

Por que tiene sentido:

- sesion stateless
- separacion clara entre `ADMIN` y `CUSTOMER`
- integracion directa con rutas protegidas del frontend y endpoints del backend

## Decisiones de arquitectura que puedes defender

## 1. Monolito modular en vez de microservicios

Buena defensa:

- para este alcance, un monolito modular reduce complejidad operativa
- mantiene buena separacion por dominios sin introducir infraestructura extra
- deja espacio para escalar mas adelante si el negocio lo requiere

## 2. Frontend unificado para tienda y admin

Buena defensa:

- reduce duplicacion de componentes, utilidades y clientes API
- hace mas simple el mantenimiento
- conserva separacion funcional por rutas, layouts y proteccion de acceso

## 3. Snapshot del cliente dentro del pedido

Buena defensa:

- el pedido conserva nombre, email, telefono y ciudad aunque luego cambie el perfil del cliente
- esto mejora integridad historica comercial

## 4. Auditoria como parte del modelo

Buena defensa:

- no solo importa vender; tambien importa trazabilidad operativa
- el `AuditLog` ayuda a explicar cambios de negocio y a alimentar el dashboard

## 5. Inventario ligado a pedidos y ajustes

Buena defensa:

- cada salida por venta o ajuste manual deja huella
- esto evita que el stock sea solo un numero sin contexto

## Retos tecnicos que puedes contar

## 1. Separar flujos de cliente y admin sin duplicar la aplicacion

Que puedes decir:

- construi una sola app React con rutas, layouts y protecciones separadas
- asi mantuve una base de codigo coherente sin perder claridad funcional

## 2. Mantener reglas reales en pedidos y credito

Que puedes decir:

- el backend valida stock, total, saldo, limite de credito, fecha de vencimiento y estado de cobro
- eso evita que la UI sea la unica capa con reglas y hace el sistema mas confiable

## 3. Hacer que inventario y pedidos queden sincronizados

Que puedes decir:

- al crear una orden se descuenta stock y se genera un movimiento de inventario
- al ajustar stock manualmente tambien queda trazabilidad

## 4. Convertir un dashboard visual en algo realmente util

Que puedes decir:

- no me limite a tarjetas decorativas
- consolide metricas reales: ingresos, ticket promedio, top productos, estados de pedido, stock bajo, vencimientos y actividad reciente

## 5. Resolver problemas de UX y operacion

Puntos reales que puedes mencionar:

- mejoras de responsividad para tienda y admin
- correccion de errores de paginacion admin por limites del backend
- ajustes visuales para dar mejor jerarquia a acciones importantes

## Lo que demuestra este proyecto sobre ti

Si te preguntan que habilidades refleja, puedes responder:

- desarrollo full-stack
- modelado de negocio
- trabajo con autenticacion y autorizacion
- integracion frontend-backend
- diseno de APIs REST
- persistencia relacional
- trazabilidad y operaciones administrativas
- pensamiento de producto, no solo de interfaz

## Demo recomendada de 5 minutos

Si algun dia lo presentas en vivo, este orden funciona bien:

1. mostrar el home y el catalogo
2. abrir detalle de producto y agregar al carrito
3. mostrar checkout y flujo de pedido
4. entrar a cuenta del cliente y ensenar historial o favoritos
5. cambiar al admin
6. mostrar dashboard
7. entrar a productos o pedidos
8. ensenar inventario y movimientos

## Demo recomendada de 10 minutos

Si tienes mas tiempo:

1. explicar rapido arquitectura general
2. mostrar tienda publica
3. mostrar carrito y cuenta
4. entrar al admin
5. ensenar dashboard y metricas
6. mostrar CRUD de productos
7. mostrar clientes y pedidos
8. mostrar inventario
9. cerrar con decisiones tecnicas y siguientes pasos

## Preguntas tipicas de entrevista y como responderlas

## "Que fue lo mas dificil?"

Respuesta sugerida:

> Lo mas delicado fue modelar flujos reales de negocio y no quedarme solo en un CRUD. Por ejemplo, los pedidos debian validar stock, estados, pagos, credito e inventario de forma consistente entre frontend y backend.

## "Por que elegiste NestJS?"

Respuesta sugerida:

> Porque queria una estructura backend modular y mantenible, con validacion fuerte, DTOs y buena separacion de responsabilidades. Para un ecommerce con varios dominios me parecio una base muy solida.

## "Que mejorarias si tuvieras mas tiempo?"

Respuesta sugerida:

> Llevaria uploads a almacenamiento cloud, agregaria pruebas automatizadas mas amplias, observabilidad, despliegue formal y posiblemente jobs programados mas robustos para recordatorios o procesos operativos.

## "Que demuestra este proyecto sobre tu forma de trabajar?"

Respuesta sugerida:

> Que me enfoco en resolver procesos completos. No solo pienso en pantallas bonitas; tambien en reglas de negocio, estructura, trazabilidad, mantenimiento y experiencia real del usuario.

## Puntos fuertes que conviene remarcar

- cubre tienda y admin en un solo producto
- integra frontend, backend y base de datos real
- tiene reglas de negocio mas ricas que un CRUD basico
- maneja autenticacion, inventario, pagos y reportes
- tiene una arquitectura suficientemente profesional para evolucionar

## Cosas que debes decir con honestidad

Es buena idea ser transparente con estas mejoras futuras:

- hoy esta preparado y documentado principalmente para entorno local
- aun no tiene despliegue cloud formal documentado
- se puede fortalecer con pruebas automatizadas, observabilidad y pipeline de CI/CD

Decir esto no te debilita. Al contrario, demuestra criterio tecnico y madurez.

## Como cerrar la presentacion

Puedes cerrar asi:

> Este proyecto me sirvio para demostrar que puedo disenar y construir una solucion full-stack orientada a negocio, con una experiencia de cliente, una operacion administrativa y una base tecnica coherente para seguir creciendo.

## Recomendacion final

Si lo vas a mostrar en entrevista:

- abre primero este documento
- practica el pitch corto
- prepara una demo breve
- ten claros 3 retos tecnicos y 3 decisiones de arquitectura
- habla del valor de negocio, no solo del stack
