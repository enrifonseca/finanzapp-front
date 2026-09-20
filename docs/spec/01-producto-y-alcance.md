# 01 — Producto, alcance y lenguaje común

## 1. Visión

[VALIDADO] Una persona utiliza varias billeteras (efectivo, débito y crédito), incluso múltiples por banco y moneda. Necesita registrar de forma simple operaciones reales y responder por separado: **cuándo gané/gasté**, **cuándo debería cobrar/pagar** y **cuándo cobré/pagué**. En el ingreso diario interesa el camino más corto; en la consulta posterior interesa conservar suficiente contexto para análisis por moneda, billetera, categoría, cliente/cuenta, tiempo y financiación.

[PROPUESTA] El producto contempla también planificación de vencimientos, proyecciones recurrentes, presupuestos y comparación contextual de tarjetas. Se accederá sin contratar cuentas bancarias, automatizar pagos ni disponer de acceso a movimientos reales de las entidades financieras.

## 2. Personas y alcance

- Una persona propietaria de su información financiera, autenticada con Google o Apple. Una cuenta puede tener muchas billeteras, categorías, bancos, referencias, préstamos y presupuestos.
- **MVP individual:** sin cuentas compartidas, colaboración familiar, contabilidad empresarial, sincronización automática con bancos ni ejecución de transferencias reales.
- UI en español, moneda predeterminada elegible, ARS y USD como ejemplos (no únicas), fechas locales y zonas horarias explícitas; la moneda no se deduce de una entidad bancaria.

## 3. Diccionario imprescindible

| Término | Significado |
|---|---|
| Familia de registro | Selector UX de **ingreso** o **egreso**; no determina por sí mismo el impacto económico. |
| Categoría | Etiqueta configurable dentro de una familia: Sueldo, Comisión, Impuestos, Préstamo, Servicios, Productos. |
| Concepto | Descripción del hecho: “Impuesto municipal”, “Sueldo agosto”, “Fiat Argo”. |
| Referencia | Identificador reutilizable de factura, cliente, inmueble, cuenta de servicio, contrato o préstamo; nombre y código opcional; puede vincularse a movimientos sucesivos. |
| Hecho económico | Gasto/incurrencia o ingreso ganado; puede existir antes de pagar/cobrar. |
| Obligación/derecho | Importe y fecha en que se debería pagar/cobrar, saldo pendiente y cumplimiento; no equivale a efectivo. |
| Movimiento efectivo | Entrada/salida real de fondos o transferencia entre billeteras, fechado y asociado a las billeteras afectadas. |
| Proyección | Estimación o patrón futuro sin confirmación de haber ganado/gastado/cobrado/pagado. |
| Billetera | Efectivo físico, cuenta de débito o instrumento de crédito; una billetera admite una o varias monedas. |
| Plan / resumen | Instrumento de cuotas o período facturado, con fechas y estado independientes de pagos reales. |
| Saldo inicial | Punto de referencia confirmado para calcular saldo disponible; su ausencia se representa como **desconocido**, no cero. |

## 4. Capacidades del producto

**[VALIDADO]** Identidad, primera billetera, crear más, Home sin “habituales” artificiales, últimos 10 movimientos, accesos por categorías realmente utilizadas, alta contextual de catálogo, sueldo multicobro/multimoneda, impuesto identificado por cuenta, cash/débito/crédito, fechas de cierre/vencimiento variables por período, préstamo y devolución parcial, recurrencia configurable.

**[PROPUESTA]** Consultas avanzadas, detalle de billetera, transferencias propias, cambio de moneda con cotización explícita, devolución/reversión y corrección auditada, deuda y resumen de tarjetas, pagos parciales de resumen, presupuestos por moneda/período/categoría, alertas y simulador de medios de pago. Todas deben respetar las reglas verificadas.

## 5. Objetivos medibles de UX y calidad

- Con catálogos completos, un movimiento habitual requiere **seleccionar acceso, completar/modificar importe, confirmar**; abrir parámetros adicionales solo cuando sean necesarios.
- Sin catálogo, cada selector expone “+ Crear”; al volver, el nuevo elemento se selecciona y el borrador anterior queda intacto.
- Ningún flujo de dinero crea por error un segundo gasto económico o un ingreso económico por devolución/préstamo de capital.
- Una proyección **nunca** actualiza un saldo confirmado por sí sola; información faltante se identifica como pendiente/desconocida.
- Reportes explican criterios de fecha y moneda; cada cifra puede abrir su detalle de origen.

## 6. MVP, etapas posteriores y no objetivos

**MVP usable**: login, wallets cash/debit/credit, catálogos contextuales, captura de ingreso/egreso simple y multimoneda, cuentas-referencia, eventos de gasto/ingreso/pago/cobro, crédito con períodos y cuotas manuales, préstamos manuales, Home/historial, proyecciones básicas, reporte básico de 6 perspectivas y presupuesto mensual por moneda.

**V1 avanzada**: resúmenes y pagos parciales de tarjeta, transferencias/FX con conciliación, presupuestos por referencia y rollover, escenarios de liquidez, simulador comparativo Naranja/Cordobesa con tarifas configuradas y alertas personalizadas.

**Fuera de alcance inicial**: scraping de bancos, conexiones bancarias reguladas, ejecutar pagos/recomendaciones automáticas, OCR de facturas, impuestos según legislación, cálculo automático de score crediticio, contabilidad tributaria formal, asesoría profesional y agregados ARS+USD sin fuente de conversión.

## 7. Historias representativas

- Como usuario nuevo, ingreso con Google/Apple, creo una billetera y llego a Home; puedo crear otras antes.
- Registro un impuesto municipal de 14.999 ARS con efectivo EFT; lo vinculo a “Dpto 0027” y puedo repetirlo para otro inmueble.
- Registro un sueldo generado en agosto, cobrado en septiembre en 1.700 ARS/EFT y 1.200 USD/USD EFT; crear la billetera USD dentro del flujo; recurrencia mensual prevista pero no cobrada.
- Pago 500 ARS de devolución de capital de préstamo Fiat Argo: disminuye efectivo y deuda, **no** contabiliza un segundo gasto por capital.
- Registro compra con tarjeta: gasto en fecha de compra, cuotas y vencimientos previstos, salida de caja sólo al pagar resumen.
- Comparo dos tarjetas para una compra concreta con fechas y promociones conocidas; veo escenarios, datos faltantes y efectos sobre liquidez futura sin que la app adivine costos.

## 8. Alcance de “más completa la información”

Los detalles aumentan valor del reporte pero **no son obligatorios** para la operación básica: referencia, número de factura, período de consumo, fecha ganada, calendario de cuotas, intereses, etiquetas, nota, comercio, adjunto o recurrencia. El sistema ofrece ampliarlos antes o después, con modificación auditada. La falta de estos datos limita ciertos indicadores y se comunica explícitamente.
