# Estado del proyecto

- **Fase actual:** Fase 4 (crédito básico) — frontend implementado, **pendiente de tu revisión**
- **Rama:** `feature/fase4-credito-frontend` (apilada: fase0 → fase1 → fase2 → fase3 → fase4; nada mergeado)
- **Última tarea completada:** alta de tarjeta con días opcionales, compra en cuotas con interés en vivo, pantallas de tarjeta y resumen con todas las correcciones y el pago parcial
- **Próximo paso:** tu revisión. Fase 5 (préstamos) bloqueada por D-09 y D-10.

## Qué quedó hecho
- **Alta de tarjeta:** modo fijo/variable (explícito) + día de cierre y de vencimiento **opcionales** en ambas. Sin ellos las compras quedan con período y vencimiento desconocidos.
- **Compra en cuotas** en "Nuevo movimiento" (egreso con una tarjeta): precio, cantidad de cuotas y **monto de cada cuota**; el **interés se calcula en vivo** (cantidad × cuota − precio, con su %) y se muestra junto al total a pagar. El gasto es el precio; el interés va aparte. El crédito no se ofrece para ingresos.
- **Pantalla de tarjeta:** deuda por moneda (resúmenes + cuotas sin asignar), días, resúmenes (estimados/confirmados), cuotas sin asignar, "Cargar un período".
- **Resumen (una sección por moneda, nunca mezcladas):** total calculado, total del banco, ajuste visible, a pagar, pagado, saldo pendiente; cuotas y cargos.
- **Las 4 correcciones antes de pagar:** total real del banco (con ajuste visible; vacío vuelve al calculado), agregar cargos (interés, comisión, impuesto, multa/refinanciación), mover cuotas a otro resumen o a "sin asignar", y corregir fechas (pasan a confirmadas).
- **Pago total o parcial:** de una billetera de efectivo o débito; el saldo baja y el resto sigue como deuda; pagar de más se rechaza sin perder el borrador. Deuda en USD pagada con pesos: se carga lo que salió, los impuestos aparte, y la **cotización implícita** se calcula en vivo.
- Detalle de compra (precio, interés, total, cada cuota con su resumen o "sin resumen asignado"), de pago (deuda cancelada, cotización) y filas del historial con el interés aparte.
- 126 tests Jest + e2e en Chrome real (13 pasos: alta de tarjeta, compra 100 en 3×40 → interés 20, resúmenes estimados, ajuste del banco, multa, fechas, pago parcial, pago de más rechazado, mover cuota).

## Mockeado / pendiente / sin conectar
- El detalle de un resumen no permite todavía revertir un pago desde su pantalla (se revierte desde el detalle de la operación en el historial).
- Sin edición de la compra (precio/cuotas): se revierte y se vuelve a cargar.
- Sin filtros ni búsqueda por tarjeta en el historial.
- No probado en emulador/dispositivo.

## Decisiones (todas registradas en `finanzapp-back/docs/DECISIONES.md`)
D-03 (día de cierre incluido), correcciones del resumen, D-04 (deuda USD), cuotificación simplificada, interés aparte del precio, primera cuota (opción A), días de tarjeta en ambas modalidades y opcionales, pago parcial.
