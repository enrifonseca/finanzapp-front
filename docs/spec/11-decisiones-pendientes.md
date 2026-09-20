# 11 — Registro de decisiones abiertas, supuestos y política de incertidumbre

**Regla:** ninguno de estos temas bloquea toda la implementación: el MVP ofrece flujo mínimo o `UNKNOWN` en vez de asumir como confirmado lo desconocido. No atribuir estas decisiones al usuario sin validación.

| ID | Tema | Estado actual / salida segura de MVP | Pregunta o decisión futura |
|---|---|---|---|
| D-01 | Imputación económica compleja | [VALIDADO] fecha de ganar/gastar distinta de cobro/pago; período de sueldo opcional. | ¿Cuándo se considera devengado un servicio cuya factura llega otro mes? Permitir fecha/periodo manual. |
| D-02 | Saldo inicial ausente | [VALIDADO] no obligatorio; [PROPUESTA] mostrar saldo desconocido y delta registrado. | ¿Permitir saldo negativo observado o sobregiro y qué advertencias? |
| D-03 | Crédito con fechas variables | [VALIDADO] opción explícita fija/variable y posibilidad de cargar períodos luego. | Regla de inclusión del cierre y día contabilizado; tarjetas reales/configurables por emisor. |
| D-04 | Política de tarjetas con saldo USD | [PROPUESTA] deuda por moneda; FX explícito al liquidar. | ¿Cómo se gestionan resúmenes y pagos mixtos, percepciones y múltiples límites? |
| D-05 | Categorías vs operaciones habituales | [VALIDADO] categorías sólo si realmente utilizadas; [PROPUESTA] acceso específico por referencia/fijado. | ¿Permite fijar manualmente un movimiento modelo, orden y sugerencias? |
| D-06 | Home últimos diez | [VALIDADO] diez movimientos; [PROPUESTA] 1 por operación lógica y acceso a detalles de sus líneas. | ¿Incluir transferencias/reembolsos/pagos de tarjeta en misma lista o filtro de actividad aparte? |
| D-07 | Referencia reutilizable | [VALIDADO] opcional, editable posterior, número textual, ej. Dpto 0027. | ¿Relación formal propiedad/cliente/servicio y jerarquía de referencias? |
| D-08 | Frecuencia de recurrencia | [VALIDADO] no obligatoriamente mensual ni ligada a Sueldo. | Regla para feriados/fines de semana, anclaje de fecha, fin de mes y cambios retroactivos. |
| D-09 | Pagos parciales de préstamos | [VALIDADO] devolución capital sin segundo gasto; datos originales/plan posteriores. | En Fiat Argo, ¿a qué cuota corresponde el pago de 500? ¿Qué parte de 11.000 es principal/interés/costo? No inferir. |
| D-10 | Préstamo original | [VALIDADO] préstamo puede crearse desde devolución sin todos los datos. | ¿Capital 17.999 y plan 18×11.000 son montos correctos y comparables? Conservar distintos sin sintetizar tasa. |
| D-11 | Presupuesto | [PROPUESTA] base gasto económico por defecto y moneda por presupuesto. | ¿Rollover, topes jerárquicos, compartidos, referencia/inmueble y dinero comprometido? |
| D-12 | Comparador Naranja/Cordobesa | [PROPUESTA] simulación condicional con fechas, tasas y promos manuales. | ¿Integraciones con tarifas/promos verificadas, prioridades del usuario y tratamiento de tope/cashback? |
| D-13 | FX histórico y consolidación | [PROPUESTA] sin cotización no sumar; FX configurable y fuente visible. | ¿Proveedor de tasas, validez, USD tarjeta y reportes a moneda base? |
| D-14 | Offline | [PROPUESTA] lectura cacheada sin declarar saldo fresco y guardar borrador local; writes en línea. | ¿Sync offline de operaciones, merges y resolución de conflictos? |
| D-15 | Operación no cobrada/no pagada | [PROPUESTA] crear hecho y derecho/obligación sin billetera ficticia. | UX de registrar fecha de facturación, cobro esperado vs vencimiento exigible. |
| D-16 | Transferencias propias y FX | [PROPUESTA] operaciones internas separadas de ingreso/egreso económico. | ¿Cómo se accede al formulario desde menú global, comisiones y cotización? |
| D-17 | Personas múltiples/cuentas compartidas | [PROPUESTA] propietario individual. | ¿Se necesitarán hogar, parejas, presupuestos colaborativos y roles? |
| D-18 | Creación de monedas no estándar | [VALIDADO] `+ Agregar moneda`; [PROPUESTA] ISO si existe, custom si validadas. | ¿Criptoactivos/monedas no ISO y reglas de precisión/cotización? |
| D-19 | Reembolsos/devoluciones | [PROPUESTA] reversión o contraoperación enlazada, nunca ingreso salarial automático. | ¿Reembolso parcial, chargeback y reasignación de cuotas/períodos? |
| D-20 | Eliminación/correcciones | [PROPUESTA] archivo de catálogos, reversión auditable financiera. | ¿Políticas de edición retroactiva, export y retención de datos? |
| D-21 | Fecha de cobro recurrente | [VALIDADO] ganado vs cobrado separado; [PROPUESTA] recurrencia del hecho y cobro previsto configurable. | Si el sueldo de agosto se paga en noviembre, ¿cómo se proyecta demora salarial posterior? |
| D-22 | Archivo y datos de ejemplo | [PROPUESTA] seeds sintéticos sólo en dev; en cuenta real Home comienza vacío. | Importación de Excel histórico posterior. |

## Regla para resolver casos no probados

Aplicar los principios ya validados sin pedir al usuario todos los detalles antes de crear producto: flujo simple primero, configuración contextual, medios compatibles, fecha y moneda por dimensión, UNKNOWN explícito, proyección no confirmada y no duplicación. Si un caso tiene consecuencias económicas o monetarias nuevas (interés sobre saldo, regla de banco, saldo a favor, FX, reembolsos), implementar sólo la versión respaldada y dejar una decisión visible para revisión, no introducir cálculos especulativos.
