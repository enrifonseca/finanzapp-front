# FLUJO-003 — Nuevo movimiento: registro incremental de ingresos y egresos

**Proyecto:** Finanzas personales  
**Estado:** Especificación funcional consolidada; variantes no recorridas descritas por extensión de las reglas verificadas  
**Versión:** 0.2  
**Fecha:** 2026-09-19  
**Relacionado con:** [Recorrido completo y escenarios](FLUJO-000-recorrido-completo.md) · [Primer uso](FLUJO-001-primer-uso.md) · [Home](FLUJO-002-home.md)

## 1. Propósito

Registrar una operación diaria con el **camino mínimo** posible y sin bloquear al usuario por configuraciones ausentes. Un acceso rápido de Home precarga contexto editable; «Nuevo movimiento» comienza por elegir **Ingreso o Egreso**. Todo campo que selecciona elementos reutilizables ofrece **crear uno nuevo** y volver al mismo punto con el resto del borrador intacto.

## 2. Flujo principal

| Paso | Acción | Datos exigibles y resultado |
|---|---|---|
| 1 | Elegir Ingreso o Egreso, salvo que un acceso habitual ya lo resuelva | Familia de la operación |
| 2 | Elegir categoría existente o crearla | Mínimo de categoría nueva: nombre y familia precargada |
| 3 | Identificar el hecho/operación cuando sea necesario | Concepto («Impuesto municipal») y subtipo con efecto financiero distinto («Devolví un préstamo») |
| 4 | Consignar una o varias líneas | Para cobro/pago realizado: importe positivo, moneda y billetera compatible por línea |
| 5 | Resolver dependencias si faltan | Nueva categoría, moneda, billetera, banco, referencia o préstamo **dentro** del mismo registro |
| 6 | Completar datos opcionales cuando sean útiles | Referencia de cuenta/cliente/contrato, fechas/período, intereses/comisiones, recurrencia y frecuencia |
| 7 | Confirmar | Una operación identificable con sus líneas y efectos correctos; sin cobros/pagos futuros inventados |

**No convertir el formulario en una secuencia de pantallas obligatorias si la información ya está disponible.** Las preguntas pueden resolverse en un único formulario progresivo. En una billetera sugerida, siempre permitir elegir otra. No pedir datos ya determinados por el acceso rápido.

## 3. Crear en contexto, incluso con subaltas anidadas

- **Categoría:** selector → «Crear categoría» → nombre (familia ya elegida) → seleccionarla en el movimiento.
- **Referencia:** selector opcional → «Agregar cuenta/cliente» → nombre reconocible y número de cuenta/cliente opcional → seleccionarla; poder asociarla después por edición del movimiento.
- **Billetera:** selector de origen/destino → «Crear billetera» → nombre, tipo y monedas; cash: ubicación opcional sin banco; débito/crédito: banco obligatorio, con su propio «Agregar banco»; crédito: fechas fijas o variables, períodos opcionalmente pendientes → volver a la línea de movimiento original y seleccionar billetera creada.
- **Moneda:** selector → incorporar moneda faltante y regresar a la línea anterior; respetar compatibilidad con la billetera seleccionada.
- **Préstamo:** selector de préstamo a devolver → «Agregar préstamo» → acreedor y nombre/referencia, completar capital y plan posteriormente si todavía se desconocen → volver al pago.
- **Cancelación de alta secundaria:** no descartar el movimiento principal ni completar artificialmente el campo faltante.

## 4. Reglas de entrada/salida

- La categoría es una **clasificación**; no equivale al tratamiento económico de la operación. La categoría «Préstamo» exige distinguir dinero prestado, devolución de préstamo o intereses/comisiones, según corresponda.
- Un gasto no cambia de fecha por usar crédito, ni por pagarlo tarde. Un ingreso ganado no cambia de período por cobrarse meses después.
- Un impuesto pagado con cash/débito genera gasto y salida efectiva; con crédito genera gasto y compromiso de la tarjeta, sin salida de dinero bancario en la compra. Las cuotas no son nuevos gastos.
- Un sueldo ya cobrado puede componerse de varias líneas importe–moneda–billetera. La fecha de cobro por defecto puede ser hoy; el período al que pertenece el trabajo/ingreso es editable y opcional en el camino corto. Si las líneas se cobran en momentos distintos, permitir fecha efectiva por línea.
- Un sueldo **todavía no cobrado** debe poder registrar el ingreso ganado y el importe por cobrar sin seleccionar una billetera ficticia. Es una variante que debe pasar una prueba de UX específica.
- Una entrada de dinero por préstamo incrementa la billetera y genera deuda de capital; no equivale a sueldo/ingreso económico. La devolución de principal disminuye billetera y deuda; los intereses/comisiones, si los hay, se distinguen del capital.
- No exigir saldo inicial para crear billetera; no inventar saldo disponible ni bloquear una devolución porque el saldo histórico es desconocido. Políticas de fondos insuficientes: decisión pendiente.
- Una recurrencia proyecta futuras ocurrencias con frecuencia elegible; no genera automáticamente hechos económicos ni cobros/pagos confirmados.

## 5. Identificar la operación para reportería

**Familia → categoría → concepto → referencia opcional** son niveles distintos. Ejemplo: `Egreso → Impuestos → Impuesto municipal → Dpto 0027 (xxxxx00027)`. Poder pagar otras facturas de la misma categoría con otra referencia; una misma referencia puede recibir múltiples movimientos en distintos períodos. La referencia permite reportar por cuenta/cliente/inmueble sin duplicar una factura ya registrada. La referencia externa puede contener letras, ceros iniciales o caracteres enmascarados; tratarla como texto, no como número.

## 6. Operaciones recorridas: datos y resultado esperado

| Operación | Registro simulado | Resultado sin doble conteo |
|---|---|---|
| Impuesto municipal | Egreso/Impuestos; 14.999 ARS, EFT, pago 19/09/2026, cuenta Dpto 0027, referencia `xxxxx00027`, sin recurrencia | Un gasto, una salida efectiva EFT; sin proyección; referencia agregable antes o después de confirmar |
| Sueldo | Ingreso/Sueldo; 1.700 ARS → EFT y 1.200 USD → USD EFT; ganado agosto; cobrado 07/09/2026; mensual | Un ingreso de dos monedas, dos cobros; USD EFT creada dentro del registro; próximo sueldo **proyectado**, no cobrado |
| Devolución préstamo | Egreso/Préstamo/Devolución; Fiat Argo, acreedor Fiat, 500 ARS → EFT, 19/09/2026, intereses 0, comisiones 0 | Una salida de 500; 500 de principal devuelto; **no** un segundo gasto económico por ese capital |

**Continuación del préstamo (detalle relacionado):** original 17.999 ARS, capital previamente devuelto 0 y pago confirmado 500 → pendiente de capital 17.499. Plan declarado: 18 cuotas fijas de 11.000; 2 declaradas pagadas; 16 previstas por 176.000 ARS desde 05/10/2026, mensuales. Los pagos históricos declarados no equivalen a egresos verificados; el pago de 500 sigue sin imputación confirmada a una cuota. La diferencia entre principal y suma de cuotas **no se interpreta automáticamente** como intereses. Véase [FLUJO-000 §8](FLUJO-000-recorrido-completo.md#8-caso-probado-devolución-parcial-y-proyección-de-préstamo).

## 7. Confirmación, edición y presentación

- Antes de confirmar, presentar familia, categoría, concepto/referencia cuando aplique, líneas de importes/monedas/billeteras, fecha(s) efectivas, obligaciones asociadas y cualquier proyección solicitada. No incluir pasos de resumen obligatorios cuando se pueda confirmar con seguridad desde el formulario corto.
- Al confirmar, registrar **una sola operación lógica**; relacionar internamente el hecho con sus líneas, obligaciones y cobros/pagos sin multiplicar el resultado económico.
- El usuario puede identificar una cuenta/cliente después de registrar, sin crear otro gasto. Edición de fechas/importes y anulación completa requieren definición adicional de integridad histórica.
- Home refleja como máximo 10 operaciones reales; categorías utilizadas pueden convertirse en accesos habituales. Una línea USD no se suma numéricamente a una línea ARS.

## 8. Criterios de aceptación

1. Sin categorías, «Nuevo movimiento» permite crear Sueldo o Impuestos durante la carga y continuar con esa categoría seleccionada.
2. Si se intenta cobrar USD sin billetera USD, «Crear billetera» permite crear USD EFT y volver con importes y líneas previos intactos.
3. Un impuesto puede tener categoría Impuestos, concepto Municipal y cuenta Dpto 0027, y una factura posterior puede usar otra cuenta sin sobrescribir la primera.
4. Un sueldo multimoneda produce un único registro económico, pero conserva importes, destinos y fechas efectivas de cada cobro.
5. La recurrencia mensual del sueldo no incrementa automáticamente los saldos el mes siguiente; se muestra como proyectado.
6. El capital prestado/recibido y sus devoluciones no se tratan como salario/consumo nuevo.
7. Un pago parcial de préstamo se admite antes de conocer el capital original; el saldo permanece desconocido hasta tener suficiente información.
8. Las cuotas futuras generan obligaciones previstas, no movimientos efectivos; si solo se conoce un pago de 500, no crear pagos adicionales ficticios por el hecho de que dos cuotas figuren declaradas pagadas.
9. Crédito con período no configurado permite registrar una compra sin inventar fecha precisa de resumen; cash no exige banco y débito/crédito sí.
10. El camino habitual omite familia/categoría cuando ya están determinadas, pero «Nuevo movimiento» siempre empieza por ellas.

## 9. Aspectos que requieren definición funcional posterior

- Selección exacta de vencimientos por períodos de tarjeta de crédito, cambios de fecha y relación entre cuotas y resúmenes; pagos parciales de resúmenes.
- Cómo conciliar el principal del préstamo frente a su plan contractual nominal y cómo atribuir una devolución parcial a una cuota concreta.
- Experiencia específica para ingreso ganado/no cobrado y egreso generado/no pagado.
- Saldo inicial, conciliación de efectivo y criterios para mostrar saldos reales vs. variaciones registradas.
- Repeticiones complejas: fechas base, excepciones, importes cambiantes y cierre de recurrencias.
- Movimientos entre billeteras propias, conversiones de moneda y otros eventos que no son ingresos ni egresos económicos.
