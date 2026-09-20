# 04 — Stack, capas, límites y estructura de repositorio

## 1. Tecnologías [PROPUESTA]

| Pieza | Elección | Motivo/regla |
|---|---|---|
| Móvil | React Native + TypeScript + React Native Paper (tema MD3) | Componentes accesibles, diseño consistente iOS/Android; no usar Paper para lógica de negocio. |
| Build/navegación | Expo + Expo Router | Builds y rutas basadas en archivo; probar compatibilidad con OAuth/Apple, notificaciones y Android/iOS reales. |
| Estado servidor | TanStack Query | Fetch/cache/invalidate, errores y mutaciones; la verdad monetaria es backend. |
| Estado local | Zustand o contexto aislado | Borradores y subflujos de creación contextual; persistencia local segura sólo si se decide. |
| Formularios | React Hook Form + Zod | Validación de experiencia; validación del servidor es la autoridad. |
| Backend | **Node.js LTS + NestJS + Fastify + TypeScript** | Módulos DI, límites de dominio, API documentable, pruebas por caso de uso. |
| Base de datos | PostgreSQL | Transacciones, constraints, decimal exacto, índices y auditoría. |
| ORM | Drizzle ORM + migraciones SQL versionadas | Modelado SQL explícito, transacciones, consultas de agregación controladas. |
| Contratos | OpenAPI 3.x, cliente TS generado | Fuente única del contrato HTTP; frontend no importa entidades Nest ni tablas SQL. |
| Autenticación | OAuth 2.0/OIDC con PKCE Google/Apple + sesiones de backend | Nunca confiar en un email no verificado o token emitido para otra audiencia. |
| Pruebas | Vitest/Jest en core, Supertest/equivalente Nest, React Native Testing Library + E2E móvil | Verificar invariantes monetarias y recorridos completos. |

No fijar “última versión” sin una matriz de compatibilidad efectiva entre React Native/Expo/Paper/Router, Nest/Fastify y ORM. Definir `engines`, lockfile, comandos de desarrollo y CI en primera tarea.

## 2. Capas backend obligatorias (nombres acordados)

```text
backend/
  kernel/   # bootstrap, composición DI Nest, config/env, auth adapters, DB, observabilidad
  core/     # abstracciones puras de uso transversal: EntityId, Clock, Result, DomainError, Event
  shared/   # Money/Currency/Decimal, DateRange, paginación, contratos de errores (sin dominio de negocio)
  business/ # módulos dominio: wallets, ledger, operations, dues, cards, loans,
            # recurrence, planning, budgets, analytics, references; puertos/interfaces
  app/      # casos de uso de aplicación, orquestación transaccional, controllers HTTP,
            # mappers DTO, políticas de autorización por recurso
```

**Dirección de dependencias conceptual:** `business → core + shared`; `app → business + core + shared`; `kernel` provee implementaciones de puertos y compone app/infrastructura. `business` **no importa** Nest, Drizzle, HTTP, React Native, clases de otras capas externas. Los adaptadores DB implementan puertos del dominio, los controllers invocan casos de uso de app, jamás SQL desde controller. Importar `kernel` en `business` o `shared` es una violación. `kernel` puede referenciar tokens e interfaces del dominio para ensamblar; no usar esta flexibilidad para crear dependencias circulares.

**Límites de business:** módulos con puertos y dominio propio. `operations` coordina reglas de tipo económico; `ledger` crea asientos y balances (no decide si “préstamo” es sueldo); `cards` calcula ciclos y propuestas de imputación; `loans` conserva principal vs interés; `analytics` consume hechos/obligaciones/movimientos confirmados sin reinventarlos.

## 3. Capas frontend obligatorias (nombres acordados)

```text
frontend/
  kernel/      # arranque Expo, Router route tree, PaperProvider, sesión, QueryClient, DI/context
  core-react/  # hooks agnósticos, client HTTP generado, estados async, draft context, helpers
  ui-system/   # tokens MD3, MoneyText, CurrencySelect, WalletSelect, cards/listas/dialogs Paper
  layout/      # shell, tabs, header, navegación, drawer/stack, estados vacíos, modal contextual
  app/         # features/pages: onboarding, home, movements, wallets, cards, loans,
               # planning, budgets, reports, comparisons, settings
```

`app` usa servicios de `core-react` y UI de `ui-system/layout`; `layout` usa UI reusable. `kernel` ensambla providers y rutas y conoce `app`; `app` no depende de rutas globales salvo interfaces de navegación declaradas. `ui-system` no llama API. `core-react` no conoce categorías concretas. `frontend` y `backend` intercambian DTOs por cliente generado a partir del contrato API, no por importación de clases de dominio.

## 4. Repositorio sugerido

```text
repo/
  pnpm-workspace.yaml
  apps/mobile/              # Expo; fachada/alias para capas frontend
  apps/api/                 # NestJS; fachada/alias para capas backend
  packages/backend/{kernel,core,shared,business,app}/
  packages/frontend/{kernel,core-react,ui-system,layout,app}/
  packages/api-client/      # OpenAPI generated
  packages/contracts/       # OpenAPI spec, errores, ejemplos de payload (no dominio DB)
  db/migrations/            # migraciones PostgreSQL versionadas
  docs/                     # este paquete
  scripts/                  # seeds sintéticas, checks, comandos de bootstrap
```

**Nota:** con Expo Router las rutas reales viven donde exige Expo (`app/` o `src/app/` del proyecto móvil); esos archivos sólo importan screens/features de `packages/frontend/app`, manteniendo la capa lógica separada del layout de archivos del router. Nest `AppModule` en `apps/api`/kernel compone módulos y providers.

## 5. Flujos de escritura críticos

```
Mobile UI → valida UX → POST comando API (Idempotency-Key)
  → Auth/Owner policy → Application use case
  → Domain validation y cálculo decimal → BEGIN PostgreSQL transaction
  → guarda operación + componentes económicos + obligación + postings de caja
  → guarda asignaciones + auditoría + versión de agregado + outbox
  → COMMIT → DTO resultado → invalidación controlada de queries Home/reportes
```

Nunca separar en llamadas HTTP independientes “crear gasto” y “crear su cobro” si el usuario confirmó una sola operación; una caída intermedia produciría saldos inconsistentes. Una alta contextual previa sí crea su catálogo de manera autónoma, con `draftId` preservado en móvil.

## 6. Modelo de lectura y cambios

- Escrituras validadas en backend, consultas de pantalla separadas mediante read models/SQL parametrizado. Proyecciones y reportes pueden usar vistas/materialización reconstruible; si una vista se atrasa, informar corte de sincronización. Las fuentes de verdad son tablas financieras y auditoría.
- Home consulta un read model que compone billeteras + 10 operaciones + accesos usados; no dispara una docena de llamadas seriales.
- Patrón de transacción por operación; control optimista con `version` de obligación/préstamo y locks donde asignación concurrente pueda sobreaplicar fondos.
- Cache por propietario y filtro; invalidar al crear/editar/revertir, FX y condiciones de tarjeta; queries de reportes incluyen `asOf`, modo de fecha y moneda.
- Trabajos programados sólo generan **ocurrencias proyectadas/avisos**; no generan cobros/pagos reales sin confirmación explícita. Web push/local notification sujeto a permisos y programación, no obligatorio para MVP.

## 7. ADRs iniciales

- ADR-001: backend NestJS/Fastify sin dominio dependiente de framework.
- ADR-002: decimal exacto y monedas explícitas en todos los límites.
- ADR-003: componentes económicos, vencimientos y caja segregados; fuente de verdad transaccional.
- ADR-004: crédito variable por período y fechas desconocidas admitidas.
- ADR-005: UX de borrador con creación de catálogos anidada y retomable.
- ADR-006: recurrencia predice; no acredita ni paga.
- ADR-007: API contract-first, OpenAPI, owner scoping e idempotencia.

## 8. Fuentes

- NestJS adapter Fastify: https://docs.nestjs.com/techniques/performance
- Drizzle, transacciones: https://orm.drizzle.team/docs/transactions
- Expo Router: https://docs.expo.dev/router/introduction/
- React Native Paper: https://callstack.github.io/react-native-paper/docs/guides/theming-with-react-navigation
