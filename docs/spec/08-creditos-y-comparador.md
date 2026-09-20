# 08 — Tarjetas de crédito, períodos y comparador de medios de pago

**Estado:** estructura de tarjeta y fechas variables [VALIDADO]; motor comparador y reglas de scoring financiero [PROPUESTA]. No comparar productos financieros con datos inventados: se comparan **escenarios documentados y condicionales** para una compra concreta.

## 1. Perfil de tarjeta y alta

Una billetera de crédito guarda nombre, banco obligatorio, monedas admitidas, configuración de límites y reglas de facturación. **Pregunta obligatoria en alta:** “¿Sus fechas de cierre y vencimiento son fijas o pueden variar entre períodos?”. Si `FIXED`, capturar patrón habitual y marcar períodos futuros como estimados hasta verificar; si `VARIABLE`, pedir fechas concretas del período cuando se conozcan. Ambas admiten “Configurar más adelante” sin impedir compra. Apertura/cierre/vencimiento pertenecen al período, no son tres propiedades globales inmutables de la tarjeta.

Dos tarjetas de la misma entidad son **dos billeteras diferentes** (p. ej. dos Visa de BBVA), cada una con sus propios límites, ciclos, promociones y gastos.

## 2. Compra y asignación de resumen

Datos de operación: monto/moneda, fecha de compra, tarjeta, comercio/concepto/categoría/referencia, cantidad y modalidades de cuota. La compra registra una vez el gasto económico. El plan de cuotas genera obligaciones, no gastos posteriores. Asignar primera cuota usando fecha de contabilización cuando se conozca; con sólo fecha compra/fecha de cierre bancaria, asignación `ESTIMATED` o `UNASSIGNED` si la regla es desconocida. Nunca forzar una fecha falsa para permitir guardar. Si USD en tarjeta ARS/USD, conservar obligación original USD y reglas de conversión del resumen/pago explícitas.

**Resumen:** un período con transacciones/cargos vinculados, monto mínimo si se conoce, vencimiento confirmado o estimado, deuda pendiente. Intereses, mantenimiento, impuestos, comisiones son componentes económicos nuevos, separados de principal y cuotas originales. Pagar resumen desde cash/débito: salida real y asignaciones de deuda; pagos parciales dejan saldo exigible y condiciones futuras por determinar. Si cancelación total requiere pagar ARS y USD, permitir múltiples patas.

## 3. Variables relevantes para elegir medio de pago

Para decidir entre Naranja y Cordobesa, la app necesita **una compra concreta** y dos o más billeteras elegibles. Parámetros editables por escenario:

| Variable | Explicación |
|---|---|
| Importe/moneda y fecha | Precio al contado, moneda y día real/hipotético de la compra. |
| Comercio/rubro/canal | Una promoción puede aplicar sólo a ciertos comercios, rubros, días o modalidad presencial/online. |
| Tarjeta/banco/producto | La oferta pertenece al producto específico del usuario, no a cualquier tarjeta con ese nombre. |
| Modalidad | Contado, 1 cuota, N cuotas, interés TNA/TEA/CFT si conocido, fechas y redondeo del emisor. |
| Descuento/reintegro | Porcentaje, tope, mínimo, vigencia, día de acreditación, exclusiones y condiciones de elegibilidad. |
| Comisiones/cargos | Cargos incrementales propios de la opción. No prorratear mantenimiento fijo como si fuera un cargo incremental sin política explicitada. |
| Fecha de cierre/vencimiento | Por período confirmado/estimado/desconocido; una compra posterior al cierre puede modificar el primer pago. |
| Límite disponible | Sólo si límite y deuda/consumos conocidos; “desconocido” no equivale a “sin límite”. |
| Moneda y tipo de cambio | Liquidación, cargos de FX e impuestos aplicables sólo si informados, sin deducciones regulatorias automáticas. |
| Restricciones del usuario | Preferencia opcional por menor costo, postergar salida, evitar sobrepasar presupuesto o distribuir pagos. |

## 4. Resultado del comparador

Mostrar **ambas opciones sin veredicto único obligado**. Por escenario y tarjeta:

- `costoTotalNominal` en moneda de la compra, desglosado en precio − descuento efectivo + intereses + costos incrementales − cashback/reintegro **si corresponde y con fecha**. Si faltan conceptos materiales, valor `incompleto`, no inventar cero.
- Cronograma: fechas y cuantías esperadas de pagos, cada una con estado `CONFIRMED|ESTIMATED|UNKNOWN`, y fecha de acreditación de reintegros separada del vencimiento. “Sin interés” no implica que dos propuestas tengan misma liquidez ni mismos costos.
- Impacto de caja actual/futuro, billetera origen del pago de resumen, presupuesto (gasto original) y límite de tarjeta. Si saldo actual desconocido, mostrar **delta** de liquidez en vez de saldo proyectado absoluto.
- Condiciones/alertas: vencimientos no configurados, promo no verificada, tope agotado/desconocido, necesidad de pagar resumen íntegro para evitar interés, moneda FX sin cotización.
- [PROPUESTA] Selector de criterio `menor desembolso nominal`, `desembolsar más tarde`, `distribución de cuotas`, `ajuste a presupuesto`; **no** sustituir decisión del usuario por un “mejor” universal. Si criterio cuantificable y datos completos, ordenar descriptivamente por esa columna con fórmula visible.

### Ejemplo únicamente ilustrativo

Compra hipotética 100.000 ARS. Tarjeta A 3 cuotas sin interés y sin descuento conocido; tarjeta B 1 cuota con 10 % de reintegro hasta 5.000, condicionado a elegibilidad. El simulador describe en A tres obligaciones cuyo total es 100.000 y en B pago nominal 100.000 con reintegro **hasta** 5.000 en fecha posterior si realmente aplica. Hasta conocer cierres, vencimientos y promo, no afirmar que B es más conveniente ni registrar reintegro como dinero ya cobrado.

## 5. Algoritmo propuesto (sin inventar datos)

1. Validar tarjetas propiedad del usuario y compatibilidad de moneda/comercio.
2. Obtener condiciones desde **configuración manual del usuario** o fuente conectada y autorizada en futura etapa, guardando fecha y procedencia.
3. Obtener período que recibiría compra por fecha bancariamente contabilizada o estimar con incertidumbre.
4. Construir plan de cuotas según modalidad, redondeo y reglas del emisor (sin condiciones ⇒ `UNKNOWN`).
5. Aplicar descuentos/tops sólo si se verifican elegibilidad y límites; representar reintegro como cobro proyectado separado y condicional.
6. Construir pagos futuros por cuota y gastos adicionales; importes por moneda, no conversión implícita.
7. Calcular costo y fechas **por escenario**, advertencias de cobertura y mostrar desglose; guardar escenario no altera billeteras/deudas.
8. Al elegir medio y confirmar una compra real, crear operación `CREDIT_CARD_PURCHASE` separada, sin convertir la proyección comparativa en pago efectivo.

## 6. Tarjetas promocionales/costos recurrentes

[PROPUESTA] Los costos fijos de mantenimiento/renovación son gastos por su hecho y período propios; para una comparación incremental pueden mostrarse aparte si existirían incluso sin la compra. Las promociones pueden ser acumulables o excluyentes, presentar selección de reglas explicitadas; **no** elegir combinaciones no documentadas. Una tarifa vigente hoy no se proyecta como tarifa garantizada para el mes próximo.

## 7. Aceptación

- Tarjeta VARIABLE sin períodos permite compra pero devuelve vencimientos desconocidos. Al cargar un nuevo período, las cuotas compatibles pueden adquirir fecha estimada/confirmada sin reescribir gasto original.
- Cambio de cierre/vencimiento de un mes actualiza sólo períodos afectados y sus proyecciones; pagos ya realizados no se desplazan.
- Comprar 100.000 en 3 cuotas no genera 3 gastos; pagar resumen parcial reduce deuda y mueve fondos realmente pagados.
- Simulador Naranja/Cordobesa con datos faltantes muestra alternativas “incompletas” e identifica qué configuración falta. No crea compra real ni modifica presupuestos/saldos durante la simulación.
