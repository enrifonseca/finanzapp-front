# 07 — Motor de proyecciones, presupuestos y reportes

**Estado:** [PROPUESTA] construida sobre tres dimensiones [VALIDADO]. La fuente de verdad es el historial de operaciones/hechos, vencimientos y fondos confirmados; el motor de análisis no crea movimientos efectivos ni obligaciones confirmadas por sí solo.

## 1. Las seis vistas fundamentales

| Consulta en UI | Fuente y filtro temporal | Regla para evitar doble conteo |
|---|---|---|
| ¿Cuánto gasté? | `EconomicComponent.EXPENSE` confirmado por fecha/período económico | Compra con crédito se cuenta una vez por total; resumen, cuotas y amortización no se vuelven a sumar. |
| ¿Cuánto gané? | `EconomicComponent.INCOME` confirmado por fecha/período económico | Sueldo multicobro pertenece a un único origen, desglosado por moneda. Préstamo recibido no es salario. |
| ¿Cuánto debería pagar? | `Due.PAYABLE` con fecha prevista/confirmada y saldo, más proyecciones señalizadas aparte | Cuotas por vencimiento no son pagos efectivos; interés futuro no confirmado = estimado. |
| ¿Cuánto debería cobrar? | `Due.RECEIVABLE` con fecha prevista/confirmada, saldo y forecast aparte | Salario pendiente no se convierte en cobro por cambio de mes. |
| ¿Cuánto pagué? | Fondos externos salientes en fecha efectiva | Pago de tarjeta aparece en efectivo, no duplica gasto; excluir traspasos propios del consolidado. |
| ¿Cuánto cobré? | Fondos externos entrantes en fecha efectiva | Cobro de sueldo real; devolución de capital prestado se registra como entrada de caja pero no nuevo ingreso económico. |

Todos los reportes requieren `from`, `to`, `dateBasis`, `currencyMode` (`SEPARATE` por defecto / `CONVERT`), `currency` destino si hay conversión, filtros por categoría, concepto, referencia, billetera, banco, operación, estado y origen (`ACTUAL`,`DUE`,`PROJECTED`). Mostrar totales por moneda y transacciones vinculadas. **Valor numérico sin definición temporal o de conversión no es un reporte válido.**

## 2. Balance económico y flujo de caja

- `resultadoEconomico(periodo, moneda) = ingresosGanadosConfirmados - gastosRealizadosConfirmados`. Por moneda; principal de préstamos excluido y costos incluidos como gastos cuando se devengan.
- `flujoCajaExterno(periodo, moneda) = cobrosExternosConfirmados - pagosExternosConfirmados`. Transferencia entre billeteras propias no altera flujo consolidado, aunque sí aparece en cada billetera individual.
- `pendienteCobrar/Pagar(asOf, moneda) = sum(originalDue - allocationsConfirmadas - reversals)` por obligaciones confirmadas y estado. Si vencimiento desconocido, incluir en “sin fecha”, nunca colocar por defecto en “este mes”.
- `posiciónWallet`: sólo mostrar saldo real cuando saldo de referencia conocido. Si no, `variación registrada` y mensaje de cobertura.
- `patrimonio` [PENDIENTE]: exige valorización multimoneda, activos ajenos al producto y tratamiento de deudas; no presentar “flujo de caja” como patrimonio.

## 3. Comparativas de gastos “¿en qué más gasté?”

[PROPUESTA] Agregaciones por categoría/subcategoría, concepto, referencia (“Dpto 0027”), banco, comercio, medio de pago, moneda y períodos. Cada ranking debe mostrar `amount`, `currency`, `period`, `dateBasis`, número de operaciones, porcentaje respecto del **total comparable**, nivel de clasificación y segmento sin categoría. No generar ranking numérico unificado entre ARS y USD sin conversión explícita. Drill-down abre lista real que explica el agregado. Permitir excluir movimientos revertidos, de prueba y transferencias propias. Detectar concentraciones en presupuesto, no confundir pago de tarjeta con gasto de servicio.

**Ejemplo:** `Egreso → Impuestos → Municipal → Dpto 0027` contiene 14.999 ARS de gasto y 14.999 ARS pagados cash EFT; al registrar otro Dpto se agregan ambos a Impuestos municipal, pero permanecen separables por referencia.

## 4. Forecast: fuentes y estados

Fuentes con precedencia explícita:

1. **Obligación/derecho confirmado:** monto y vencimiento conocidos. Puede tener `dueDate = null` si aún no se conoce; no proyectar día arbitrario.
2. **Cuotas de préstamo/tarjeta:** definidas por calendario o período confirmado; si fechas calculadas por patrón o importe parcial, flag `ESTIMATED`.
3. **Recurrencia de ingreso/gasto:** `FORECAST_ONLY`, regla de frecuencia, inicio, fin, excepciones, fecha económica y fecha esperada de cobro/pago opcionales. No se materializa automáticamente como salario ya ganado.
4. **Escenarios exploratorios:** cambios de sueldo, compra futura, promociones de tarjeta; nunca se suman a lo confirmado sin elección del usuario.

**Deduplicación de forecast:** si cuota deriva de compra ya representada como obligación, no volver a sumar una recurrencia del mismo objeto. Si ocurrencia recurrente se confirma como operación, enlazar `forecast_occurrence.materialized_operation_id` y quitar proyección duplicada del horizonte. Si pago real aplica a obligación, reducir saldo exigible por `Allocation` sin borrar historia de vencimiento.

### Proyección de liquidez [PROPUESTA]

`liquidezPrevista(t, moneda) = saldoActualConocido + cobrosFuturosSeleccionados - pagosFuturosSeleccionados` considerando escenario, fecha/cobertura y sin transferencia propia consolidada. Si saldo base es desconocido, **no** presentar monto futuro absoluto: sólo delta previsto y estado `BASE_UNKNOWN`. Si moneda requiere cambio futuro, calcular con escenario FX declarado, y mostrar sensibilidad/rango.

Mostrar día a día o por mes; escenarios conservador/base/optimista se definen por inclusión de eventos y confianza, no probabilidades fabricadas. Ejemplos de filtro: “confirmados”, “confirmados + proyectados”, “sólo recurrentes”. Salario agosto cobrado noviembre aparece ganado en agosto y entrada efectiva en noviembre; la proyección inicial pudo tener cobranza prevista en septiembre, pero se concilia al cobrar realmente.

## 5. Presupuestos [PROPUESTA]

### Entidad de presupuesto

`nombre, moneda, período [mensual|semanal|personalizado], límite exacto, base [gasto económico|pago efectivo|compromiso], categoría/referencia/billetera opcionales, versión, estado, política de arrastre`. El modo predeterminado es gasto económico confirmado (para no gastar dos veces al pagar tarjeta); el usuario puede elegir flujo de pagos si su objetivo es liquidez. Si filtra billetera, comunicar que ese filtro no captura necesariamente gasto de crédito en una billetera bancaria hasta la liquidación: base y filtro deben ser compatibles.

### Indicadores

- `consumido = suma de componentes que coinciden con filtro, período, moneda y base`.
- `restante = límite - consumido`; negativo representa excedido, no cambiar signo silenciosamente.
- `% utilizado = consumido / límite * 100` si límite positivo.
- `comprometido` y `proyectado` **columnas separadas**; no sumar ambos al consumido sin selector/semántica.
- `sin clasificación` y `sin tipo de cambio` visibles para medir cobertura.
- Alertas opcionales por umbral (p.ej. 80/100 %) sólo con datos y permisos del usuario. Evitar repetición por mismos período y umbral. No convertir alertas en órdenes automáticas de ahorro o pago.

### Casos de aceptación

Presupuesto Impuestos ARS septiembre 30.000: gasto municipal 14.999 ⇒ restante 15.001; pagar más tarde el resumen de una compra de impuestos de septiembre no debe volver a gastar el presupuesto. Si presupuesto es **caja**, sólo pagos efectivamente salidos en su período. Presupuesto USD permanece separado si no hay FX elegido. Gasto de capital por devolver préstamo no consume presupuesto de consumo; intereses sí bajo la categoría configurada.

## 6. Pantallas de reporting

- **Resumen:** período, moneda(s), selector seis perspectivas y filtros.
- **Dónde gasto/ingreso:** categorías, conceptos, referencias, tendencias comparables, drill-down.
- **Compromisos:** timeline de por cobrar/pagar, confirmado vs estimado vs sin fecha, vencido/pagado parcial.
- **Caja:** flujos por billetera, totales externos, saldos conocidos y variaciones de billeteras sin punto de referencia.
- **Presupuestos:** barras por categoría, referencias e historial de cumplimento sin inventar FX.
- **Proyección:** tabla calendario mes/día, sumas y detalles por fuente; escenarios con/sin cambios de tarjeta o salario.

## 7. Reportes reproducibles y auditables

Cada respuesta trae `{filters, asOf, currencyMode, fxSources, dateBasis, totalByCurrency, coverage, breakdown, sourceIds}`. Export CSV/PDF puede llegar después, pero filtros, FX y fecha de corte deben ser serializables desde el primer día. Calcular totales desde fuente canónica o snapshot versionado, comparar suma de detalle vs resumen, reconciliar reversals y cache invalidation. Registrar definición de consultas en tests snapshot numéricos.

## 8. Ejemplos de proyección no equivalente a realidad

- Sueldo de 1.700 ARS + 1.200 USD cobrado 07/09/2026; recurrencia mensual: mostrar una **ocurrencia futura por moneda** (próxima fecha según ancla/configuración, fecha esperada ajustable), sin sumar saldos EFT/USD EFT en octubre.
- Préstamo Fiat Argo: 16 cuotas informadas de 11.000 = 176.000 ARS plan futuro, principal pendiente informado 17.499 ARS. No usar diferencia como tasa financiera. Hasta asignar pago 500 a cuota y conciliar historia, mostrar advertencia.
- Tarjeta con períodos variables aún no cargados: compra reconocida y deuda existente, vencimiento `UNKNOWN`, no fecha de cobro/pago exacta pronosticada.
