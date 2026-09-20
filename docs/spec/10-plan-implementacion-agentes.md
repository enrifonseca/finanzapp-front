# 10 — Plan de implementación y contratos de trabajo para agentes de IA

**Objetivo:** entregar verticales funcionales completas en la arquitectura pedida, evitando que varios agentes implementen semánticas financieras incompatibles. Este plan es [PROPUESTA]; los criterios funcionales validados mandan sobre atajos técnicos.

## 1. Reglas obligatorias para todo agente

1. Leer `README.md` y docs 01–11 completos; consultar `referencia-flujos/` para ejemplos, no para suponer que un ejemplo representa una regla universal.
2. En cada PR/tarea indicar: **caso de uso**, contrato API, DTO exacto, cambios de BD/migración, capa dueño, escenarios de prueba y reglas validadas/propuestas implementadas.
3. Mantener estrictamente dependencias de `04`; evitar que UI consulte DB, business importe Nest/Drizzle o frontend backend comparta clases de persistencia.
4. Dinero como decimal exacto + moneda, unknown distinto de 0, fecha económica ≠ vencimiento ≠ efectiva, proyección ≠ evento real; no doble conteo de pagos de tarjeta ni principal de préstamo.
5. Cada selector de catálogo dispone de `+ Crear` contextual sin descartar el borrador; cada ruta permite estado vacío/error/loading.
6. No inventar reglas bancarias ni valores de promociones, saldos, intereses, fechas ni obligaciones. Si falta material, exponer `UNKNOWN`, advertir y anotar decisión en `11`.
7. No declarar “implementado” algo sin prueba/ejecución verificable. Reportar limitaciones, mocks pendientes y endpoints que todavía no están conectados.
8. No realizar migraciones destructivas ni agregar datos financieros reales en seeds. Usar fixtures sintéticas versionadas.

## 2. Secuencia propuesta por vertical

| Fase | Vertical | Entregables verificables |
|---|---|---|
| 0 | Bootstrap | Monorepo, lockfile, check CI, app RN Paper con navegación vacía, Nest healthcheck, PostgreSQL migraciones, OpenAPI, auth sandbox. |
| 1 | Identidad y catálogos | Google/Apple, usuario, monedas, bancos, categorías y referencias; pruebas owner scoping. |
| 2 | Primer uso y billeteras | Cash/debit/credit, banco contextual, multi-moneda, cash ubicación, crédito fijo/variable pendiente, loop otra/Home, saldo inicial unknown. |
| 3 | Movimientos inmediatos | Home vacío/primer movimiento, ingreso/egreso, referencia, multimoneda, crear billetera anidada, ledger/dues/postings, historial diez/total, reversión simple. |
| 4 | Crédito básico | Compra financiada sin caja inmediata, períodos por tarjeta, cuotas exactas, resumen manual y pago parcial; APIs/test de doble conteo. |
| 5 | Préstamos | Crear en devolución, capital/deuda, cuotas fijas/variables/manuales, conciliación pendiente y pagos parciales sin fabricar caja. |
| 6 | Planificación | Recurrencia no confirmada, vista mensual, vencimientos por cobrar/pagar, cobertura fechas desconocidas y escenarios base. |
| 7 | Reportes | Seis perspectivas, categorías/referencias, agrupaciones, FX manual opt-in, comparativa periodos, drill-down. |
| 8 | Presupuestos | Categoría/período/moneda, base económica/caja, alertas y progreso separado de proyecciones. |
| 9 | Comparador | Tarjetas Naranja/Cordobesa como wallets parametrizadas, calendario por escenario, promociones/costos configurables, resultados incompletos explícitos. |
| 10 | Endurecimiento | Transferencias/FX, fallos offline, backups, privacy, perf, iOS/Android E2E, métricas y documentación final. |

**Definition of Done de vertical:** backend + frontend + prueba de aceptación enlazada + migración + auth + idempotencia para writes + UI de error y datos faltantes + documentación. No crear una pantalla bonita que grabe sólo estado local y afirmar que el caso está resuelto.

## 3. Reparto recomendado de roles

- **Agente arquitecto:** contratos, ADR, integridad de dependencias, esquemas/versiones/convenciones; revisa PRs y evita divergencia de money/fecha.
- **Agente dominio:** money, hechos, dues, postings, préstamos/tarjetas; pruebas de invariantes y concurrencia.
- **Agente API/infra:** Nest providers, Drizzle repo, auth y políticas de propietario, OpenAPI, migraciones/CI; no decide la semántica financiera.
- **Agente móvil UX:** Expo Router, Paper, layout y formularios con creación contextual; consume sólo cliente generado, no simula éxito sin backend.
- **Agente de QA:** valida E2E 01–15, compara reportes con libro de operaciones y prueba flujos en dispositivo/emulador.

Para paralelismo seguro, congelar OpenAPI + tipos de `Money` + invariantes de due/ledger en la fase 0–2; agentes pueden trabajar UI con mocks contractuales mientras otro implementa API, **pero** la aceptación requiere integración real. Trabajar una tarea de dominio por escritor para evitar conflictos de migraciones concurrentes.

## 4. Plantilla de ticket para el siguiente agente

```text
Feature ID:
Contexto funcional y etiqueta: [VALIDADO]/[PROPUESTA]/[PENDIENTE]
Historia: Dado ... Cuando ... Entonces ...
Dominio afectado:
DTO OpenAPI request/response:
Estados de información desconocida:
Cambios SQL y migración:
Flujo RN Paper y navegación:
Creación contextual / retorno a borrador:
Autorización/idempotencia:
Pruebas (unidad/integración/E2E ID):
Riesgos y decisiones por registrar:
Resultado verificable (logs de tests + rutas/pantallas operativas):
```

## 5. Prompts iniciales reutilizables

### Arquitecto

> Lee README y docs 01–11. Propone monorepo TypeScript siguiendo exactamente las capas backend kernel/core/shared/business/app y frontend kernel/core-react/ui-system/layout/app. Antes de codificar, entrega grafo de dependencias, esquema Money/Date/ID, contratos OpenAPI iniciales, migración v1 y ADR; conserva `unknown` y fechas por dimensión. Después implementa sólo bootstrap con tests.

### Agente backend

> Implementa la vertical indicada en docs 03, 05 y 06 usando NestJS+Fastify+PostgreSQL y reglas de dominio aisladas de infraestructura. Escribe tests de idempotencia, propietario, atomicidad, multimoneda y no doble conteo. No materialices proyecciones como pagos reales.

### Agente móvil

> Implementa el flujo de docs 02 con Expo+React Native Paper. `Nuevo movimiento` se precompleta sólo desde acceso habitual real; el selector ofrece `+ Crear`, preserva borrador anidado y vuelve con selección automática. Renderiza `unknown` de saldos/fechas sin reemplazarlo por cero/hoy; integra sólo API OpenAPI real o mocks identificados.

### Agente reportes

> Implementa seis perspectivas de docs 07 desde los mismos hechos del backend y tests numéricos de escenarios; no suma monedas sin FX explícito, no cuenta principal de préstamos como ingreso/gasto ni liquidaciones como nuevo gasto. Incluye drill-down por fuente y fecha base visible.

## 6. Checklist para revisión de PR por humano

- ¿El usuario llega al resultado en mínimo de interacciones cuando todo existe?
- ¿El camino largo permite crear banco/categoría/referencia/billetera sin perder borrador?
- ¿Quedan claros lo realizado, por cobrar/pagar, lo efectivo y lo proyectado?
- ¿Los montos y saldos distinguen moneda, origen y estado de información?
- ¿La tarjeta variable maneja cierres/vencimientos desconocidos, sin fechas inventadas?
- ¿El pago del resumen o devolución del principal duplica gasto?
- ¿Los fixtures, las pruebas y el API documentado reproducen lo implementado?
