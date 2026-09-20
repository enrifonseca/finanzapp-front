# 03 — Dominio y reglas financieras

**Prioridad:** normativa para implementación. Las etiquetas entre corchetes distinguen validación previa y diseño propuesto. Todo movimiento debe exponer su fundamento y su trazabilidad.

## 1. Tres planos independientes [VALIDADO]

| Dimensión | Salida | Entrada | Momento/estado |
|---|---|---|---|
| Económica | Gasto realizado | Ingreso ganado | `economicDate` o `economicPeriod`, puede diferir de caja. |
| Exigible | Cuánto y cuándo debería pagar | Cuánto y cuándo debería cobrar | `dueDate`, previsto/confirmado/vencido/cancelado. |
| Efectiva | Cuándo y desde dónde pagué | Cuándo y dónde cobré | `occurredAt`, sólo al ocurrir; billetera(s) y moneda(s). |

**Proyección** es un cuarto plano, futuro/no confirmado. El plan recurrente puede sugerir futuros hechos y vencimientos, **no crea** gastos reales, cobros confirmados ni saldos por el paso del tiempo. Un vencimiento pasado no equivale a pago efectuado. Una misma operación puede tener muchos componentes, obligaciones y pagos.

## 2. Familia UX vs naturaleza económica [VALIDADO + PROPUESTA]

La familia ingreso/egreso identifica sentido de registro en UI y la categoría clasifica. El **tipo de evento** gobierna la semántica:

| Tipo interno | Economía | Fondos | Deuda/derecho |
|---|---|---|---|
| `EARNED_INCOME` | + ingreso cuando se gana | entra sólo en cobro | puede nacer derecho por cobrar |
| `INCURRED_EXPENSE` | + gasto cuando ocurre | sale sólo en pago real | puede nacer deuda por pagar |
| `LOAN_DISBURSEMENT_RECEIVED` | sin ingreso económico de principal | + al recibir | + deuda de principal |
| `LOAN_PRINCIPAL_REPAYMENT` | sin gasto nuevo del principal | − al pagar | − deuda de principal |
| `LOAN_INTEREST_FEE` | gasto por interés/cargo | − al pagar si efectivamente pagado | + obligación si impago |
| `LOAN_GRANTED` | sin gasto por principal entregado | − al entregar | + derecho a cobrar |
| `LOAN_PRINCIPAL_RECOVERY` | sin ingreso nuevo por recuperar capital | + al cobrar | − derecho a cobrar |
| `OWN_TRANSFER` | no ingreso/gasto | − origen, + destino | sin deuda económica |
| `FX_EXCHANGE` | no salario/consumo por las patas de conversión | salidas/entradas explícitas por monedas | diferencia FX, spread/comisión por separado |
| `CREDIT_CARD_PURCHASE` | gasto en compra | sin salida de efectivo de la cuenta bancaria de usuario | + deuda con tarjeta |
| `CARD_SETTLEMENT` | sin gasto original adicional | − cuenta de pago al liquidar | − deuda con emisor; comisión/interés es gasto separado |
| `OPENING_BALANCE` | no ingreso ganado | fija línea base de una billetera | no es cobro de sueldo |
| `REVERSAL` | revierte efectos de evento identificado | asientos compensatorios | conserva historia |

**Nota:** los nombres de tipo son una propuesta, no categorías UX y no deben exponerse como jerga técnica. Una “entrada” de devolución de impuestos podría requerir corrección de gasto vs ingreso nuevo; no deducirlo automáticamente de la categoría.

## 3. Operación, componentes y atribución

- `Operation`: unidad lógica con familia, categoría, concepto, referencia, fecha de creación, notas y estado. Puede estar compuesta por subeventos con distinta semántica.
- `EconomicComponent`: importes ganados/gastados por moneda, fecha/periodo, estado confirmado/revertido; múltiples monedas bajo una misma operación sin conversión implícita.
- `Due`: obligación o derecho, moneda, monto, vencimiento nullable/desconocido, estado y saldo por asignaciones; puede asociarse a un componente, una cuota, un resumen o un préstamo.
- `FundsMovement`: salida/entrada real, fecha, billetera fuente o destino, moneda, total; transferencias agrupan dos patas, cobros multimoneda varias líneas; no registrar en cash un pago de tarjeta hasta la liquidación.
- `Allocation`: aplica fondos reales a una o más obligaciones, por montos en **moneda de la obligación**; una aplicación multimoneda exige conversión/FX explícito y trazable. Un pago adelantado puede aplicarse a deuda futura según reglas de la entidad; saldo “a favor” sin imputar se registra separadamente.
- `ForecastOccurrence`: propuesta derivada de recurrencia o calendario, marcada proyección; puede materializarse en operación confirmada idempotentemente o descartarse; no duplica el origen.

**Invariante de no duplicación:** sumar componentes económicos confirmados según su fecha; no volver a sumar las patas de caja, cuotas, resúmenes ni préstamos de principal al mismo total. Para flujo de caja sumar sólo movimientos efectivos externos y excluir patas internas de transferencias cuando se analice flujo **consolidado**.

## 4. Monedas y montos [VALIDADO + PROPUESTA]

- Cada importe lleva `currencyCode` ISO 4217 (o catálogo de divisa personalizado sin asumir códigos mágicos) y cantidad **decimal canónica como string** en el API; en persistencia `NUMERIC(24,8)` o cantidad menor equivalente por moneda con exactitud definida; cálculo con decimal exacto/BigDecimal, nunca `float` JS. Mostrar redondeo ISO y guardar precisión operativa. Ej.: `"14999.00"`, `"1200.00"`.
- No agregar 1.700 ARS + 1.200 USD como “2.900” de nada. Un reporte multicurrency presenta series separadas **o** conversión con moneda destino, cotización, fecha de cotización, fuente y nota de cobertura.
- Una billetera puede admitir varias monedas con posición y saldo independiente por moneda. No suponer que crédito ARS y USD comparten límite ni liquidación.
- FX: operación con dos patas (importe origen y destino), tasa explícita y costos; cotización estimada para reportes no altera operaciones históricas; revaluación no es cobro/salario. Mostrar operaciones sin tasa como “sin total consolidado”.
- Referencias (cuenta cliente `xxxxx00027`) se guardan como **texto**, no número; números parcialmente redactados permanecen parcialmente redactados.

## 5. Estado de billeteras y saldos [VALIDADO + PROPUESTA]

Cash es dinero físico; opcionalmente “Casa/Colchón”. Débito representa cuenta de disponibilidad y liquidación ordinaria inmediata; banco obligatorio. Crédito es instrumento de deuda, banco obligatorio, financiación y liquidación futura.

- **Cash/débito:** saldo real computable sólo si existe `openingBalance` conocido en fecha de corte o conciliación verificada. Si no, mostrar `unknown` y, si interesa, **variación neta registrada**. Ej. EFT: +1.700 −14.999 −500 = −13.799 ARS de variación, sin afirmar que haya −13.799 disponibles. Una línea de tiempo con fechas del caso debe permitir ordenar sin inferir saldo anterior.
- **Crédito:** deuda proviene de consumos/cargos/intereses menos pagos/imputaciones/reversiones; `disponible` sólo si límite y reglas/categoría de límite se conocen. No tratar crédito disponible como dinero en cuenta ni como patrimonio positivo.
- **Saldo inicial/ajuste:** operación de control de saldo etiquetada, con fuente, fecha y motivo, **no ingreso económico**. Si corrección de caja posterior, registrar ajuste y auditar, no editar silenciosamente saldo retroactivo.
- [PENDIENTE] Permitir saldo negativo en cash/débito, autorizar pago si saldo desconocido, saldo sobregirado y saldo de corte: decisión de negocio. MVP permite registrar movimientos con advertencia y no inventa disponibilidad.

## 6. Crédito y cuotas [VALIDADO + PROPUESTA]

- Compra: gasto íntegro en fecha económica; deuda por la compra; cuotas asociadas a períodos de tarjeta. Fecha futura de pago puede ser desconocida si calendario no configurado.
- Tarjeta: modo de cierre/vencimiento `FIXED_PATTERN` o `VARIABLE_PER_PERIOD`, **elección explícita** en alta. `VARIABLE` no hereda fechas previas como confirmadas. En `FIXED`, patrón crea **estimaciones editables**, y cada período puede corregirse.
- Período tiene fecha de apertura (inclusive) y cierre (inclusividad configurable en regla concreta), vencimiento y moneda(s) del resumen; no usar fecha de vencimiento para asignar compra al período. Operación cerca del cierre debe contemplar fecha de contabilización por el banco diferente de la fecha de compra; si se desconoce, período provisional.
- Pagos de tarjeta: liquidación contra billetera cash/débito, total/parcial, puede incluir intereses, mantenimiento, comisión e impuestos asociados como **nuevos** componentes económicos; sólo principal de consumos se aplica a deuda existente.
- Factura en 3 cuotas 100.000 ARS → 33.333,33 + 33.333,33 + 33.333,34; diferencias de redondeo en última cuota; calendario bancario real puede distribuir diferente.

## 7. Préstamos [VALIDADO + PROPUESTA]

- Acreedor, nombre/referencia, moneda, capital recibido u otorgado, fechas, obligación principal, tasa, plan y calendario **pueden completarse incrementalmente**. Alta mínima: acreedor + identificador legible; no inventar desembolso histórico.
- Devolver principal no es gasto duplicado; intereses/comisiones sí pueden ser gasto. Devolver 500 ARS con cash EFT reduce **deuda de principal** en 500 y fondos EFT en 500; si no hay préstamo original registrado aún, registrar devolución y “saldo indeterminado”.
- Dos cuotas “pagadas” declaradas son **estado informado**, no prueba de 22.000 ARS salidos de una billetera. Si sólo se verificó pago 500, no crear los otros 21.500 sin datos. Historial incompleto queda en conciliación pendiente.
- Ejemplo probado: capital informado 17.999, devolución anterior 0, devolución registrada 500 ⇒ principal pendiente **17.499 ARS**. Plan informado 18 × 11.000, 2 declaradas completas ⇒ 16 cuotas proyectadas por **176.000 ARS**, 05/10/2026 y mensuales. 176.000 − 17.499 **no demuestra** intereses por esa diferencia. Falta imputación del pago 500, composición de cuotas y conciliación capital/plan; mostrar cifras por separado con advertencia.
- Planes: fijo, variable, libre o calendario manual. Cuota incluye componentes principal/interés/costo cuando se conozcan; si no, `unallocated`. Permitir cuotas y pagos parciales/múltiples/asignaciones explícitas.

## 8. Recurrencia [VALIDADO + PROPUESTA]

La categoría **Sueldo** indica ingreso por trabajo, no frecuencia mensual. Configuración opcional: `DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `BIMONTHLY`, `QUARTERLY`, `SEMIANNUAL`, `YEARLY`, intervalo N unidades, calendario manual o regla RRULE **validada**. Inicio, fin opcional, excepción, importes por moneda y cambios futuros editables. Diferenciar “proyectar próximo hecho económico” de “proyectar fecha de cobro/pago”; el usuario puede elegir defaults de su operación anterior, no afirmar fechas reales. Cambios de regla no reescriben ocurrencias confirmadas.

## 9. Fechas, cierres, asignaciones [PROPUESTA]

Almacenar fecha económica (`YYYY-MM-DD`) o período (`YYYY-MM`), fecha prevista si existe (`YYYY-MM-DD`) y `occurredAt` instante real ISO UTC + zona de visualización IANA. Fecha de pago recibida por usuario puede ser una fecha civil sin hora; conservar ambos si aplica. Nunca reemplazar período agosto por cobro noviembre. “Hoy” depende de zona horaria del usuario, no UTC por defecto.

**Integridad:** cantidades >0; moneda compatible con billetera; ID pertenece a propietario; vencimiento desconocido es nullable; cuota no confirmada no emite caja; suma de asignaciones ≤ pago y ≤ saldo de obligación por moneda salvo excedente explícito; no transferir entre monedas sin FX; cancelación mediante reversal en transacción; historial y reportes utilizan mismos hechos fuente.
