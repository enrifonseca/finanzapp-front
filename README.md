# finanzapp-front

App móvil de Finanzas Personales: Expo (SDK 57) + Expo Router + React Native Paper (MD3) + TanStack Query +
React Hook Form + Zod. Especificación en `docs/spec/`, estado en `docs/ESTADO.md`.

## Ejecutar local (front + back)

Necesitás los dos repos uno al lado del otro (`~/MyApps/finanzapp-back` y `~/MyApps/finanzapp-front`) y Node 22 + pnpm.

```bash
# Terminal 1 — base de datos (sin Docker)          en ~/MyApps/finanzapp-back
pnpm install && cp .env.example .env
pnpm db:dev

# Terminal 2 — API (http://localhost:3000)          en ~/MyApps/finanzapp-back
pnpm dev

# Terminal 3 — app web (http://localhost:8081)      en ~/MyApps/finanzapp-front
pnpm install && cp .env.example .env
pnpm web
```

Abrí http://localhost:8081. En **Inicio** el chip debe decir **Conectado**; si apagás el API pasa a
**Sin conexión con el backend** (se reverifica cada 15 s o con *Reintentar*).

**Celular / emulador** (`pnpm start`, escanear el QR con Expo Go, o `pnpm android`): `localhost` apunta al propio
dispositivo. Poné en `.env` `EXPO_PUBLIC_API_URL` con `http://10.0.2.2:3000` (emulador Android) o
`http://<IP-de-tu-PC>:3000` (dispositivo físico), y en el `.env` del back agregá ese origen a `CORS_ORIGINS`
si probás desde web en otra URL. El back escucha en `127.0.0.1`; para dispositivo físico poné `HOST=0.0.0.0`.

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm web` / `pnpm start` / `pnpm android` / `pnpm ios` | Servidor de desarrollo Expo |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Calidad y tests (Jest + Testing Library) |
| `pnpm build:web` | Export estático de la versión web |
| `pnpm sync-contract` | Copia `../finanzapp-back/contracts/openapi.json` y regenera el cliente tipado |

## Capas (`src/`, docs/spec/04 §3)

`kernel/` (providers, config) · `core-react/` (cliente HTTP generado, hooks, TanStack Query) · `ui-system/` (tema MD3,
componentes sin API) · `layout/` (tabs, contenedores, estados vacíos) · `app/` (pantallas por feature).
Las rutas de Expo Router viven en `app/` (raíz, configurado con `root: "app"`) y solo reexportan pantallas de `src/app/`.
Las dependencias entre capas se verifican en `tests/architecture.test.ts`.
