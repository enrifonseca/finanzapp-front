# Finanzas personales — especificación de producto y arquitectura v1.0

**Idioma:** español. **Fecha base:** 2026-09-19. **Destinatarios:** agentes de IA locales, desarrolladores, QA y responsable del producto. **Objetivo:** construir una aplicación móvil iOS/Android, frontend React Native + React Native Paper, backend Node.js/TypeScript, para registrar, planificar y analizar finanzas personales multimoneda.

## Contrato de lectura para los agentes

1. Leer este README y los archivos `docs/01` a `docs/11` **antes** de generar código. Este paquete es la especificación de referencia; `referencia-flujos/` documenta recorridos de conversación, como evidencia funcional complementaria. Si hubiera conflicto: reglas explícitas y decisiones del paquete actual > recorridos anteriores > suposiciones del agente.
2. Respetar etiquetas de decisión: **[VALIDADO]** acordado/simulado con el usuario; **[PROPUESTA]** diseñado aquí para completar el producto y sujeto a ajustes; **[PENDIENTE]** no resuelto, no convertir en verdad de negocio. No presentar una propuesta como si el usuario la hubiera confirmado.
3. Implementar **una única operación lógica** con múltiples importes, monedas, pagos y vencimientos asociados; no duplicar ingresos/gastos por cuotas ni al pagar tarjeta. No sumar monedas distintas sin tipo de cambio explícito.
4. No asumir que hoy existe el dinero de una billetera sin saldo inicial verificado; distinguir saldo desconocido, proyección, obligación y hecho confirmado. Los importes y las fechas ilustrativas NO son datos del usuario en producción.
5. La prioridad de ejecución es el camino corto: dar de alta en contexto cualquier catálogo faltante y volver al borrador anterior, sin perder información.
6. Implementar primero verticales completas y demostrables; no crear toda la infraestructura y todas las pantallas vacías en una sola pasada. Todo feature requiere migración, caso de uso, contrato, UI, prueba y criterios de aceptación.

## Índice del paquete

| Documento | Contenido |
|---|---|
| [01-producto-y-alcance.md](docs/01-producto-y-alcance.md) | Propósito, vocabulario, módulos, alcance, prioridades y no objetivos. |
| [02-experiencia-y-navegacion.md](docs/02-experiencia-y-navegacion.md) | Pantallas, menú, primer uso, Home, carga mínima, creación contextual. |
| [03-dominio-y-reglas.md](docs/03-dominio-y-reglas.md) | Economía, compromisos, efectivos, monedas, préstamos, invariantes. |
| [04-arquitectura-y-stack.md](docs/04-arquitectura-y-stack.md) | Stack, backend/frontend en capas pedidas, puertos, dependencias, repositorio. |
| [05-modelo-de-datos.md](docs/05-modelo-de-datos.md) | Entidades, relaciones, atributos mínimos, estados, migraciones, índices. |
| [06-api-y-eventos.md](docs/06-api-y-eventos.md) | API HTTP, contratos, idempotencia, errores, procesos y límites de consistencia. |
| [07-proyecciones-presupuestos-reportes.md](docs/07-proyecciones-presupuestos-reportes.md) | Cálculos, consultas, presupuestos, escenarios, métricas y FX. |
| [08-creditos-y-comparador.md](docs/08-creditos-y-comparador.md) | Tarjetas, períodos, resúmenes, financiación, Naranja/Cordobesa y comparador. |
| [09-seguridad-calidad-pruebas.md](docs/09-seguridad-calidad-pruebas.md) | Identidad, privacidad, pruebas y criterios de aceptación end-to-end. |
| [10-plan-implementacion-agentes.md](docs/10-plan-implementacion-agentes.md) | Orden incremental de trabajo, entregables y prompts operativos para agentes. |
| [11-decisiones-pendientes.md](docs/11-decisiones-pendientes.md) | Supuestos, ambigüedades y reglas para no bloquear el MVP. |
| [escenarios.json](ejemplos/escenarios.json) | Datos de prueba sintéticos; no importarlos como finanzas reales. |

## Arquitectura propuesta, de un vistazo

- **Mobile:** React Native + TypeScript + React Native Paper, Expo y Expo Router, TanStack Query; formularios con React Hook Form + Zod. El modo offline con escritura sincronizada se posterga hasta tener semántica de conflictos.
- **Backend:** Node.js LTS + TypeScript + **NestJS con adaptador Fastify**, API REST JSON/OpenAPI, PostgreSQL y Drizzle ORM con migraciones SQL versionadas; contenedor Docker para desarrollo. Pinar versiones compatibles al inicializar; no copiar comandos `@latest` ciegamente.
- **Identidad:** Google y Apple mediante flujo OAuth/OIDC seguro para móvil; backend valida identidad, mantiene perfil y aplica autorización por propietario.
- **Modelo:** hecho económico, obligación/derecho, movimiento real de fondos y proyección como objetos diferenciados; operaciones asociadas por IDs y fechas propias.

**Por qué NestJS:** módulos, inyección de dependencias, testing y OpenAPI facilitan separar las capas y repartir verticales entre agentes. La infraestructura Nest no debe filtrarse al dominio; una alternativa futura de servidor no obliga a reescribir la lógica financiera.

## Definición de “documentación completa” aquí

El paquete especifica el producto de punta a punta, sus reglas, pantallas, contratos propuestos, persistencia y entregas; **no** declara validados los diseños que todavía no pasaron por pruebas de usuario. El comparador de tarjetas es una herramienta de análisis condicionada a datos y reglas cargadas, no una promesa de predecir beneficios bancarios. Integraciones bancarias, OCR de resúmenes, mercado de cambios automático y asesoría financiera quedan fuera del MVP.

## Fuentes técnicas oficiales consultadas

- NestJS Fastify: https://docs.nestjs.com/techniques/performance ; NestJS HTTP adapters: https://docs.nestjs.com/faq/http-adapter
- Expo Router: https://docs.expo.dev/router/introduction/ ; conceptos: https://docs.expo.dev/router/basics/core-concepts/
- React Native Paper, tema MD3: https://callstack.github.io/react-native-paper/docs/guides/theming-with-react-navigation
- Drizzle PostgreSQL: https://orm.drizzle.team/docs/get-started/postgresql ; transacciones: https://orm.drizzle.team/docs/transactions

La documentación oficial cambia; el agente verifica compatibilidades de las versiones elegidas y anota su decisión en el repositorio antes de instalar dependencias.
