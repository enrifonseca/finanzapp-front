# Estado del proyecto

- **Fase actual:** Fase 2 (primer uso y billeteras) — frontend implementado, **pendiente de tu revisión**
- **Rama:** `feature/fase2-billeteras-frontend` (apilada sobre fase1 y fase0; ninguna mergeada ni pusheada)
- **Última tarea completada:** asistente de primer uso, formulario de billetera con creación contextual de banco y moneda, listados en Inicio y Billeteras
- **Próximo paso:** Fase 3 (movimientos inmediatos), sujeta a las decisiones pendientes de abajo.

## Qué quedó hecho (FLUJO-001 completo)
- Sin billeteras el usuario solo puede llegar a `/onboarding` (guard de rutas); con billeteras va a Home y **no** vuelve a pedir el alta tras recargar.
- Formulario: nombre, tipo (efectivo/débito/crédito), monedas, banco (débito/crédito), ubicación (efectivo), y **elección explícita fijo/variable** en crédito (sin valor por defecto; no se piden ni inventan fechas).
- **Creación contextual sin perder el borrador:** el banco se crea en el selector y las monedas se habilitan en un diálogo, sobre la misma pantalla; el borrador vive en el formulario.
- Tras cada alta: "Ir a Home" / "Crear otra billetera". Loop repetible.
- `Idempotency-Key` estable por contenido: reintentar tras un corte de red reutiliza la key (no duplica); si cambia el contenido usa otra.
- Saldos: "sin saldo inicial" (unknown), nunca 0. Crédito: "períodos sin configurar".
- Errores del servidor mapeados al campo; estados de carga/error/vacío en listas.
- 46 tests Jest + e2e en Chrome real (login → primer uso → crédito con banco en contexto → Home → recarga → nueva billetera).
- Bugs reales hallados por el e2e y corregidos: `useMe` sin sesión daba 401 cacheado; `onboarding/*` no era una pantalla protegible; diálogos aceptaban toques mientras animaban su cierre.

## Mockeado / pendiente / sin conectar
- Login Google/Apple sigue deshabilitado (necesita credenciales OAuth tuyas).
- No hay pantalla de detalle de billetera, edición ni archivo (endpoints `PATCH /v1/wallets/{id}` listos en el back, sin UI).
- Sin saldo inicial (no hay `opening-balances`): ver D-02 abajo.
- No probado en emulador/dispositivo.

## Decisiones consultadas / abiertas en esta fase
- **D-03 (crédito, reglas de cierre por emisor): NO resuelta.** Solo se guarda la elección fijo/variable; no se calculan fechas ni se guardan día de cierre ni regla de vencimiento.
- **D-02 (saldo inicial: ¿saldo negativo/sobregiro?): NO resuelta.** No se implementó `opening-balances` para no decidir esa política.
- **Sugerencia de nombre y moneda predeterminada (FLUJO-001 §9): NO decidida.** El nombre no se prellena; solo se sugiere la moneda preferida del usuario si ya la eligió (nunca se asume ARS).
- **Editar monedas de una billetera ya usada (FLUJO-001 §9): NO decidida.** El back solo permite *agregar* monedas; no existe quitar.
