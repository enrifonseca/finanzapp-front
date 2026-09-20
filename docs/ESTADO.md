# Estado del proyecto

- **Fase actual:** Fase 1 (identidad y catálogos) — frontend implementado, **pendiente de tu revisión**
- **Rama:** `feature/fase1-identidad-frontend` (apilada sobre `feature/fase0-bootstrap-frontend`; ninguna mergeada ni pusheada)
- **Última tarea completada:** login (modo desarrollo), sesión segura con refresh, guard de rutas, `GET /v1/me` en Inicio, cierre de sesión
- **Próximo paso:** Fase 2 (primer uso y billeteras), sujeta a las decisiones pendientes anotadas abajo.

## Qué quedó hecho
- `SessionManager` (single-flight refresh, expiración, corte de red sin desloguear), cliente API con Bearer y reintento en 401.
- Rutas protegidas con `Stack.Protected`: sin sesión solo existe `/login`.
- Login con React Hook Form + Zod (primer uso real de ambos), errores tipados (credenciales / no configurado / red).
- Inicio muestra `GET /v1/me` sin inventar datos ("sin definir", "pendiente").
- Verificado en Chrome real contra el back: login → perfil → recarga con sesión → logout → rutas protegidas.
- 33 tests Jest, lint y tipos limpios.

## Mockeado / pendiente / sin conectar
- **Login con Google/Apple: botones deshabilitados.** Requiere client IDs OAuth creados por vos y luego integrar el flujo PKCE/SDK. Sin esto solo entra el modo desarrollo.
- Catálogos (monedas, bancos, categorías, referencias): endpoints del back listos, **sin UI todavía** (la UI de alta contextual llega con Fase 2/3; la Fase 1 del plan pide solo login + `/v1/me`).
- Web guarda la sesión en `sessionStorage` (sin almacenamiento seguro del sistema).
- No probado en emulador/dispositivo.

## Decisiones de docs/spec/11 consultadas en esta fase
- Ninguna consultada al dueño. D-18 (monedas no ISO) quedó abierta: el back solo habilita monedas del catálogo ISO.
