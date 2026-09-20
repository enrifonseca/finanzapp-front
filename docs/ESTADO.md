# Estado del proyecto

- **Fase actual:** Fase 0 (bootstrap) — frontend implementado, **pendiente de tu revisión**
- **Rama:** `feature/fase0-bootstrap-frontend` (sin mergear a main)
- **Última tarea completada:** Bootstrap frontend (capas, Expo Router, Paper MD3, TanStack Query, RHF+Zod instalados, 5 tabs vacías, cliente OpenAPI tipado, chip de conexión con el backend)
- **Próximo paso:** revisión del bootstrap back+front; después Fase 1 (identidad y catálogos: backend y luego frontend).

## Qué quedó hecho
- Capas `kernel/core-react/ui-system/layout/app` con dependencias verificadas por test.
- Navegación de 5 tabs (Inicio, Movimientos, Billeteras, Planificación, Reportes) con estados vacíos.
- Cliente HTTP generado desde `contracts/openapi.json` del back (`pnpm sync-contract`).
- Inicio muestra el estado de conexión con el backend (`GET /health/ready`), como diagnóstico de desarrollo.
- Verificado en navegador (Chrome headless) contra el back real: "Conectado" y, con el API apagado, "Sin conexión con el backend".

## Mockeado / pendiente / sin conectar
- Ninguna pantalla tiene lógica de negocio ni consume `/v1/me` ni `/v1/wallets` (esos endpoints responden 501 hasta Fases 1-2).
- React Hook Form + Zod están instalados pero aún sin uso (primer formulario: Fase 1/2).
- No probado en emulador/dispositivo (Android/iOS): solo web y tests. Expo Go / emulador requieren ajustar `EXPO_PUBLIC_API_URL` (ver README).
- Sin autenticación (Fase 1).
- `docs/PLAN-EJECUCION-CLAUDE-CODE.md` (referenciado por CLAUDE.md) no está en este repo: por instrucción solo se copió al back.

## Decisiones de docs/spec/11 consultadas en esta fase
- Ninguna.
