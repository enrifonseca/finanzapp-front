# 09 — Seguridad, fiabilidad y criterios de aceptación

**Estado:** [PROPUESTA] de ingeniería para proteger datos y consistencia financiera. Antes de usar datos reales, completar revisión de seguridad y pruebas de regresión.

## 1. Identidad, autorización y datos sensibles

- Login OAuth/OIDC con Google y Apple desde móvil mediante navegador de sistema/SDK oficial compatible y PKCE cuando corresponda. Validar `iss`, `aud`, `exp`, `nonce/state` y firma en servidor contra issuer real. Persistir `provider_subject` como clave de identidad; **email no es identificador estable ni prueba de cuenta enlazada**. Vincular proveedores explícitamente y evitar apropiación de usuario por mismo email.
- Token de backend de corta vida, refresh rotado/revocable según estrategia elegida. Token refresh en almacenamiento seguro del dispositivo, nunca AsyncStorage plano ni logging. TLS para todo tráfico, secretos sólo en servidor/secret manager. Logout revoca sesión y elimina caché/datos locales financieros.
- **Owner scoping obligatorio:** usuario A no puede leer, actualizar, vincular categorías, bancos, billeteras, cuotas o pagos de B cambiando un UUID; tests de aislamiento por cada endpoint. No devolver diferencia que revele existencia ajena si política indica 404 uniforme.
- Aislar datos PII: referencia cliente, contratos, entidad, saldos y notas se consideran privados. No exponer valores en logs, errores, analytics de terceros ni crashes. Configurar telemetría opt-in y redacción de montos/referencias. Proveer exportación/borrado de datos conforme a política de producto que se defina, sin asegurar cumplimiento legal automático.
- Seguridad móvil: deep links allowlist, certificados razonables, no habilitar WebView para auth arbitraria, proteger capturas/local caches donde proceda, biometría futura opcional (no reemplaza auth servidor).
- Backend: validación y normalización de todo payload, límites de tamaño/paginación, rate limiting en login y escrituras, queries parametrizadas, secrets rotables, auditoría de acceso/escrituras financieras y backups cifrados con restore ensayado.

## 2. Consistencia e idempotencia

- Guardar operación+económicos+dues+postings+allocations+auditoría **atómicamente**.
- Toda creación financiera tiene `Idempotency-Key`: doble toque, retry, cierre app y reintento no duplican sueldo, cobro ni compra. Una misma llave y distinto cuerpo da 409.
- Bloqueo concurrente de obligaciones/préstamos; dos pagos de 500 simultáneos sobre una deuda de 500: solo uno aplica, otro se rechaza o acredita explícitamente a favor según política. Nunca saldo restante negativo por race condition.
- Revertir con entradas compensatorias y audit trail, no hard-delete del hecho originario. `PATCH` de etiqueta/referencia no recalcula caja; corrección de monto/moneda requiere evento compensatorio y nueva versión transaccional, con aprobación de dependencias.
- Cron de recurrencia/outbox al menos una vez: consumers idempotentes; no convertir forecast en real. Detectar duplicados lógicos cuando se importa/edita, advertir y requerir resolución, no fusionar por heurística.

## 3. Pruebas por capa

| Nivel | Pruebas |
|---|---|
| Core/shared | Decimal y monedas exactos, fechas/zonas horarias, rounding, `unknown` vs cero. |
| Business | Gasto/crédito sin doble conteo, préstamo principal sin gasto, asignaciones parciales, FX explícito, recurrence sin caja, tarjeta variable. |
| App/backend | Requests atómicos, idempotencia, autorización, versionado y OpenAPI conforme. |
| Integración DB | Migraciones, FK/unique/check, concurrencia y reversión, reportes suman igual que detalle. |
| UI móvil | Onboarding, Home vacío, creación contextual anidada, un sueldo multimoneda, error offline sin pérdida de borrador, cambios de moneda reinician billetera incompatible. |
| E2E | Google/Apple entorno de prueba, flujo primer uso → Home → registros → presupuestos → reportes/comparador. |

## 4. Matriz de escenarios E2E mínimos

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| E2E-01 | Usuario sin billetera | login Google, crea cash EFT ARS y confirma | Home sin habituales ni movimientos ficticios; opción de otra billetera durante alta. |
| E2E-02 | Usuario con BBVA Master y EFT | crea sueldo 1700 ARS EFT + USD 1200 sin wallet | `+ Crear billetera` USD EFT cash/Colchón; vuelve al borrador original y confirma **una** operación. |
| E2E-03 | Usuario con cero categorías | crea Impuestos mientras registra 14999 ARS EFT | categoría seleccionada, gasto y pago efectivo únicos, saldo desconocido si apertura no existe. |
| E2E-04 | Impuesto municipal registrado | vincula Dpto 0027 y código `xxxxx00027` | no duplica gasto; listado/consultas por referencia correctos. |
| E2E-05 | Sueldo agosto, cobrado 07/09 y recurrencia mensual | consulta agosto/septiembre/octubre | ganado agosto, cobrado septiembre, octubre sólo previsto y sin cambio real en billetera. |
| E2E-06 | Compra 100000 ARS crédito 3 sin interés | registra compra, consulta gastos/dues/caja | gasto 100000 una vez, 3 cuotas suman 100000, caja sin salida en compra. |
| E2E-07 | Tarjeta modo variable sin calendario | compra y consulta vencimientos | compra guardada, vencimiento desconocido (sin día inventado). |
| E2E-08 | Tarjeta con 3 cuotas y resumen | paga parcialmente con débito/cash | disminuye caja por lo efectivamente pagado, se reduce saldo de obligaciones asignadas, gasto original inalterado. |
| E2E-09 | Préstamo Fiat Argo declarado | paga 500 de principal y luego informa 17999 original | capital pendiente 17499, sin segundo gasto; cuotas plan 16×11000 proyectadas pero historia no imputada sigue en reconciliación. |
| E2E-10 | Dos billeteras ARS sin saldo inicial | transfiere 100 de una a otra | misma operación de transferencia, flujo consolidado cero, saldo absoluto sigue desconocido. |
| E2E-11 | Saldo y cotización ARS/USD desconocidos | consulta total multimoneda | sin total consolidado falso; separa ARS/USD y cobertura. |
| E2E-12 | Presupuesto Impuestos ARS de 30000 | gasto 14999 cash | consumido 14999, restante 15001; pago de resumen de otro gasto no duplica presupuesto económico. |
| E2E-13 | Dos usuarios A/B | A pide operación/billetera de B | 404/403 sin filtrar datos; no cambia registros de B. |
| E2E-14 | Usuario repite POST mismo `Idempotency-Key` | alta sueldo o pago préstamo | una sola operación/posting; respuesta equivalente. |
| E2E-15 | Comparador tarjetas sin promos ni cierre conocidos | comparar Naranja/Cordobesa | escenarios incompletos, sin fecha/costo/predicción inventados; no registra movimiento real. |

## 5. Pruebas de propiedades/invariantes

- `sum(installments by currency) == purchase original` dentro de precision elegida, con último centavo ajustado si modalidad lo exige.
- `(confirmed due amount - net allocated) >= 0` salvo crédito a favor explícito, aun con concurrencia.
- `reversal(original)` restaura aportes económicos, deuda y caja dentro de la cadena elegida sin borrar auditoría.
- Una transferencia propia misma moneda tiene impacto económico 0 y flujo de caja **consolidado** 0; por wallet los dos postings se ven.
- Sueldo con N destinos y M monedas produce una operación y M sumas económicas (una por moneda); caja respeta sus líneas reales, no suma valores cruzados.
- Replicar consultas en UTC vs zona usuario no cambia la fecha civil explícitamente ingresada ni mueve agosto a septiembre por efecto de hora.
- Las vistas de reportes coinciden con suma de detalles que las respaldan; correcciones/reversiones invalidan cache y forecast relacionados.

## 6. Entrega mínima por funcionalidad

Una tarea queda terminada sólo si incluye: UI navegable real, contrato OpenAPI, autorización, reglas backend, migración si aplica, pruebas unitarias+integración+E2E aplicables, manejo de fallo, estado vacío, loading, documentación de decisiones y captura/screen recording breve de flujo en Android/iOS según entorno. **No** sustituir éxito real de una llamada HTTP por un toast local ni simular saldo confirmado. Revisar privacidad antes de habilitar telemetry o adjuntos.
