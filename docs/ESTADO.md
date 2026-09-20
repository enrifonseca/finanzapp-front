# Estado del proyecto

- **Fase actual:** Fase 3 (movimientos inmediatos) — frontend implementado, **pendiente de tu revisión**
- **Rama:** `feature/fase3-movimientos-frontend` (apilada: fase0 → fase1 → fase2 → fase3; ninguna mergeada)
- **Última tarea completada:** registro de ingresos/egresos con creación contextual anidada, historial, detalle con reversión, Home con últimos 10 y habituales
- **Próximo paso:** revisión. Las fases 4–10 quedan **bloqueadas por decisiones tuyas** (ver `finanzapp-back/docs/PREGUNTAS-ABIERTAS.md`).

## Qué quedó hecho (FLUJO-002 y FLUJO-003, hechos inmediatos)
- "Nuevo movimiento" (botón visible en Inicio y Movimientos) siempre empieza por Ingreso/Egreso; recién después categoría, concepto y referencia opcional.
- **Creación contextual sin perder el borrador**, incluso anidada: categoría (familia ya elegida), referencia (nombre + código tal cual, con tipo) y billetera (que a su vez crea banco/moneda). Caso E2E-02 verificado en navegador: cobrar USD sin billetera USD → se crea "USD EFT" dentro del registro y vuelve con las líneas previas intactas.
- Líneas monto–moneda–billetera; total por moneda con aritmética decimal exacta (bigint); una operación de N monedas = N sumas, nunca cruzadas. Sueldo multimoneda = UNA operación.
- Gasto: fecha económica explícita. Ingreso: período opcional; la fecha "ganado" queda desconocida (no se rellena con hoy).
- Idempotency-Key estable por contenido (reintento tras corte de red no duplica).
- Home: últimos 10 (una fila por operación lógica), habituales SOLO a partir de operaciones reales (vacío al inicio). Movimientos: historial con cursor. Detalle: separa "Gastado/Ganado (economía)" de "Pagado/Cobrado (caja)"; asociar referencia después no crea otro gasto ni toca la caja; revertir con confirmación.
- Billeteras muestran "sin saldo inicial · movimientos registrados: X" (variación registrada, nunca un saldo).
- 71 tests Jest + e2e en Chrome real (10 pasos, incluye E2E-02/03/04 y reversión).
- Bug real hallado por los tests y corregido: los diálogos (Portal) se renderizaban fuera de los providers de API; ahora `PaperProvider` va dentro.

## Mockeado / pendiente / sin conectar
- Sin cobro/pago parcial ni pendiente (derechos/obligaciones): D-15. Sin gasto con tarjeta de crédito (Fase 4), transferencias/FX, recurrencia (D-08).
- La UI no edita monto/moneda/fecha de una operación (solo etiquetas y reversión), por lo que dice la spec ("requieren definición adicional").
- Sin filtros en el historial ni búsqueda (la API soporta familia/categoría/billetera/referencia/moneda).
- No probado en emulador/dispositivo.

## Decisiones de docs/spec/11 consultadas
Ver `finanzapp-back/docs/PREGUNTAS-ABIERTAS.md` (D-01, D-02, D-06, D-08, D-15 y anteriores). Ninguna resuelta por mí.
