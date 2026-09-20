# 06 — API REST, contratos y procesos de aplicación

**Estado:** [PROPUESTA]; contratos HTTP concretos que el agente puede implementar y evolucionar por OpenAPI. Prefijo `/v1`, JSON, `Authorization: Bearer <access-token>`, `Idempotency-Key` obligatorio en comandos financieros; paginación cursor. Para dinero: **strings decimales** y moneda explícita. Fechas `YYYY-MM-DD` para calendario, `YYYY-MM` período económico, instantes ISO 8601 con zona para hechos efectivos.

## 1. Reglas transversales

- Identidad OAuth/OIDC externa se canjea/verifica en backend; `GET /v1/me` entrega perfil, onboarding y preferencias. IDs de recurso se validan por propietario; nunca aceptar `userId` del cuerpo para ejecutar comandos.
- En todos los POST/PUT/DELETE con impacto financiero: `Idempotency-Key` por usuario+endpoint+hash del request; el mismo key+payload devuelve resultado anterior; mismo key+payload diferente ⇒ `409 IDEMPOTENCY_CONFLICT`. Evitar doble clic y reintentos duplicados.
- DTOs identifican `status`, `confidence`, `source`, moneda, fecha y links a operación/obligación/cobro relevantes. `unknown` ≠ `0` y NULL de fecha no se rellena con hoy.
- `X-Request-Id` end-to-end; errores `{code,message,fieldErrors?,requestId,retryable?}`; `400` malformado, `401` sin sesión, `403` prohibido, `404` no propio/no encontrado, `409` conflicto/versión, `422` regla financiera, `429` límite. No incluir datos financieros en log de errores.
- Listados por cursor estable con `limit` acotado y filtros; filtros de fecha **explicitan** `economicDate`, `dueDate` u `occurredAt`.

## 2. Identidad y catálogos

| Método/ruta | Propósito |
|---|---|
| `POST /v1/auth/exchange` | Intercambiar token/código OIDC válido por sesión backend; provider, PKCE/state/nonce cuando corresponda. |
| `POST /v1/auth/logout` | Revocar sesión/refresh token en servidor y borrar credenciales locales. |
| `GET/PATCH /v1/me` | Perfil, moneda y zona horaria; onboarding calculado por billeteras activas. |
| `GET/POST /v1/currencies` | Catálogo y habilitar moneda del usuario; creación custom con validación y política. |
| `GET/POST/PATCH /v1/banks` | Bancos del usuario, nombre y estado. |
| `GET/POST/PATCH /v1/categories` | Categorías por familia; archivado en lugar de borrado con referencias. |
| `GET/POST/PATCH /v1/references` | Cuentas/clientes/inmuebles/contratos, código externo como string. |
| `GET/POST/PATCH /v1/wallets` | Billeteras, tipo, banco, monedas, configuración compatible; detalles crédito en recurso separado. |
| `POST /v1/wallets/{id}/opening-balances` | Saldo de corte por moneda, fecha y estado de verificación. |
| `GET /v1/wallets/{id}/position?asOf=` | saldo conocido/desconocido, delta observado, moneda y deuda si crédito. |

**Creación contextual:** frontend crea catálogo por endpoint apropiado, persiste borrador del movimiento, recibe ID y retorna con campo seleccionado. No se requiere una sesión backend de wizard ni crear un movimiento incompleto para guardar una categoría.

## 3. Operaciones y dinero

| Método/ruta | Propósito |
|---|---|
| `POST /v1/operations` | Comando atómico que registra operación, componentes económicos, dues y caja inmediata si aplica. |
| `GET /v1/operations` | Historial filtrado; `dateBasis`, familia, categoría, billetera, referencia, moneda, estado y cursor. |
| `GET /v1/operations/{id}` | Detalle con componentes, cuotas, obligaciones y fondos vinculados. |
| `PATCH /v1/operations/{id}` | Corrección auditada de metadatos; cambios financieros por comando correctivo. |
| `POST /v1/operations/{id}/reverse` | Reversión auditable con motivo; rechazar si asignaciones dependientes no resueltas. |
| `POST /v1/dues/{id}/settlements` | Pagar/cobrar total o parcial con billetera compatible, fecha y asignaciones. |
| `POST /v1/funds/transfers` | Transferencia entre billeteras propias, una moneda o FX explícito. |
| `POST /v1/funds/fx-exchanges` | Cambio entre monedas, tasa/cantidad real, fees y patas enlazadas. |
| `GET /v1/funds/movements` | Movimientos de caja con filtros, sin mezclar con gasto económico. |
| `GET /v1/dues` | Por cobrar/pagar, fechas, deuda y estado; fecha desconocida separada. |

**Ejemplo: impuesto municipal efectivo** (simplificado):

```json
POST /v1/operations
{
  "family": "EXPENSE", "kind": "INCURRED_EXPENSE", "categoryId": "cat-impuestos",
  "concept": "Impuesto municipal", "referenceId": "ref-dpto0027",
  "economicComponents": [{"direction": "EXPENSE", "amount": "14999.00", "currency": "ARS", "economicDate": "2026-09-19"}],
  "settlements": [{"walletId": "wallet-eft", "amount": "14999.00", "currency": "ARS", "effectiveDate": "2026-09-19"}],
  "recurrence": null
}
```

**Ejemplo: sueldo multimoneda, un solo operationId:**

```json
POST /v1/operations
{
  "family": "INCOME", "kind": "EARNED_INCOME", "categoryId": "cat-sueldo",
  "concept": "Sueldo agosto", "economicPeriod": "2026-08",
  "economicComponents": [
    {"direction": "INCOME", "amount": "1700.00", "currency": "ARS"},
    {"direction": "INCOME", "amount": "1200.00", "currency": "USD"}
  ],
  "settlements": [
    {"walletId": "wallet-eft", "amount": "1700.00", "currency": "ARS", "effectiveDate": "2026-09-07"},
    {"walletId": "wallet-usd-eft", "amount": "1200.00", "currency": "USD", "effectiveDate": "2026-09-07"}
  ],
  "recurrence": {"frequency": "MONTHLY", "anchorDate": "2026-09-07", "forecastOnly": true}
}
```

Si sólo se cobró parte, `economicComponents` refleja ganado total y `settlements` refleja únicamente lo cobrado; crear derecho por saldo sin billetera ficticia. Si monedas distintas, cada componente se asocia a su respectivo subtotal, no validar `sum(settlements) == sum(economicComponents)` sin agrupar por moneda.

**Ejemplo: devolución de préstamo**:

```json
POST /v1/loans/loan-fiat-argo/repayments
{
  "effectiveDate": "2026-09-19", "walletId": "wallet-eft", "currency": "ARS",
  "totalPaid": "500.00", "principal": "500.00", "interest": "0.00",
  "fees": "0.00", "installmentAllocations": [], "note": "Cuota aún no identificada"
}
```

Response incluye `loanPrincipalRemaining: "17499.00"` **sólo si** capital original declarado y reembolsos contabilizados suficientes; de otro modo `null` y `status: "UNKNOWN"`. `installmentAllocations: []` mantiene pago pendiente de conciliar con calendario, no marca arbitrariamente una cuota completa.

## 4. Tarjetas, préstamos y planificación

| Método/ruta | Propósito |
|---|---|
| `GET/PATCH /v1/cards/{walletId}/profile` | Modo fijo/variable, configuración de estimaciones, límites por moneda. |
| `GET/POST/PATCH /v1/cards/{walletId}/periods` | Períodos, apertura/cierre/vencimiento independiente por ciclo y confianza. |
| `GET /v1/cards/{walletId}/statements/{periodId}` | Resumen real/estimado, consumos, cuotas y vencimiento. |
| `POST /v1/cards/{walletId}/purchases` | Compra en una o más cuotas, genera gasto una vez y obligaciones. |
| `POST /v1/cards/{walletId}/statements/{periodId}/payments` | Pago total/parcial desde billetera externa; desgloses de costo y deuda. |
| `GET/POST/PATCH /v1/loans` | Alta incremental de préstamo, origen/capital si se conoce. |
| `GET /v1/loans/{id}` | Detalle: principal, pagos efectivos, cuotas y conciliación. |
| `POST/PATCH /v1/loans/{id}/plans` | Calendario fijo/variable/libre/manual, versionado. |
| `POST /v1/loans/{id}/repayments` | Devolución con separación principal/interés/comisión. |
| `POST /v1/loans/{id}/reconcile` | Asociación de pagos previos a cuotas; no crea caja. |
| `GET/POST/PATCH /v1/recurrences` | Reglas futuras, pausas, excepciones y cambios. |
| `GET /v1/forecast?from=&to=&currency=&basis=` | Proyecciones con confidence y fuente, no confirmadas. |
| `GET/POST/PATCH /v1/budgets` | Límites y alcance por categoría/referencia/moneda/fecha. |
| `GET /v1/budgets/{id}/progress` | Gastado/comprometido/cobrado/estimado según base elegida. |
| `GET /v1/reports/{economic|dues|cashflow|breakdown|wallets}` | Consultas trazables y filtrables; periodización y FX explicitados. |
| `POST /v1/card-comparisons/evaluate` | Escenario comparativo, sin efectuar compra/pago; advertencias de datos faltantes. |
| `GET /v1/home` | Billeteras, recientes=10, accesos realmente usados, alertas honestas. |

## 5. Contratos de saldo, reportes y proyección

```json
{
  "walletId": "wallet-eft", "currency": "ARS", "knownBalance": false,
  "balance": null, "recordedNetChange": "-13799.00",
  "asOf": "2026-09-19", "reason": "OPENING_BALANCE_NOT_SET"
}
```

```json
{
  "metric": "ECONOMIC_EXPENSE", "dateBasis": "ECONOMIC_DATE",
  "from": "2026-09-01", "to": "2026-09-30",
  "groups": [{"categoryId": "cat-impuestos", "currency": "ARS", "amount": "14999.00", "operationIds": ["op-impuesto"]}],
  "coverage": {"missingFx": false, "unknownDates": 0}
}
```

```json
{
  "basis": "RECURRENCE", "status": "PROJECTED", "sourceRuleId": "rr-sueldo",
  "economicPeriod": "2026-09", "expectedCashDate": null,
  "amounts": [{"currency": "ARS", "amount": "1700.00"}, {"currency": "USD", "amount": "1200.00"}],
  "confidence": "ESTIMATED", "actualOperationId": null
}
```

## 6. Errores de negocio obligatorios

`WALLET_CURRENCY_NOT_ALLOWED`, `CREDIT_NOT_VALID_FOR_SALARY_DESTINATION`, `BANK_REQUIRED`, `UNKNOWN_BILLING_PERIOD`, `INSUFFICIENT_KNOWN_BALANCE` (según política), `DUE_OVERALLOCATED`, `FX_RATE_REQUIRED`, `LOAN_RECONCILIATION_REQUIRED`, `FORECAST_NOT_ACTUAL`, `BUDGET_CURRENCY_MISMATCH`, `CONCURRENT_UPDATE`, `NOT_FOUND_OR_NOT_OWNED`.

Ante `UNKNOWN_BILLING_PERIOD`, permitir guardar compra como deuda con calendario desconocido, **no** falsificar fecha. La política de error debe distinguir advertencia recuperable de bloqueo financiero verdadero; ejemplo: sueldo con USD sin billetera USD → ofrecer crear billetera USD, no crear destino ficticio.

## 7. Eventos internos y tareas

[PROPUESTA] Eventos post-commit por outbox: `OperationRecorded`, `OperationReversed`, `DueChanged`, `FundsMovementPosted`, `WalletCreated`, `CardPeriodChanged`, `RecurrenceUpdated`, `BudgetUpdated`, `LoanReconciled`. Consumidores actualizan read models/alertas idempotentemente. No ejecutar side effects externos dentro de transacción de DB. No registrar payloads con referencias sensibles en logs. La proyección se regenera al cambiar regla; ocurrencias confirmadas permanecen inmutables salvo reversión/corrección explicada.
