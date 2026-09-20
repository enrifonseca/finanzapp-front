# 02 — Experiencia, páginas, menú y acciones

## 1. Estructura de navegación móvil

[PROPUESTA] Barra inferior: **Inicio | Movimientos | Billeteras | Planificación | Reportes**. Acción global visible de **+ Nuevo movimiento**; perfil/configuración desde encabezado. No mostrar una tab por cada catálogo o categoría. Pantallas secundarias accesibles por push/modal, con “Volver” y borrador persistente.

```text
Autenticación / Primer uso
  └─ Alta billetera [Alta banco anidada; crédito: fechas fijas/variables]
       └─ Confirmación → [Crear otra billetera] | [Ir a Inicio]
Inicio
  ├─ Billeteras (tarjetas; saldo real/desconocido; detalle)
  ├─ Habituales (vacío inicialmente; sólo uso/fijados)
  ├─ + Nuevo movimiento → familia → categoría (crear) → formulario → confirmar
  └─ Últimos 10 movimientos → detalle/editar/acciones
Movimientos → búsqueda, filtros, lista, detalle, editar/revertir
Billeteras → detalle cash/débito/crédito → movimientos/transferir/ajustar saldo
  └─ Crédito → períodos → resumen → cuotas → pagar resumen
Planificación → agenda de vencimientos → préstamo / obligación / previsión
Reportes → seis perspectivas → filtros → drill-down → presupuestos
Configuración → perfil; monedas; bancos; categorías; referencias; preferencias
```

### Pantallas y acciones

| Pantalla | Información | Acciones mínimas |
|---|---|---|
| Login | Google/Apple según plataforma y preferencia | Autenticar/reintentar/cambiar proveedor. |
| Alta billetera | Nombre, tipo, monedas; cash ubicación; débito/crédito banco; crédito modo de fechas | Crear banco/moneda; si tarjeta completar o diferir calendario. |
| Confirmación alta | Resumen de billetera | Crear otra o ir a Home. |
| Home | Billeteras por moneda/tipo, accesos frecuentes reales, 10 operaciones recientes | Nuevo, abrir detalle, crear billetera. |
| Nuevo movimiento | Familia, categoría, concepto, líneas monto-moneda-billetera, fecha, opciones adicionales | Crear categoría/billetera/moneda/referencia anidadas, confirmar. |
| Historial | Operaciones reales, tipo, importe(s), referencia y fecha económica/efectiva elegida | Filtro, detalle, corrección auditada, revertir. |
| Detalle operación | Hecho, obligaciones, cobros/pagos, documentos/referencia, historia | Registrar pago, asociar referencia, editar, revertir. |
| Detalle billetera | Estado saldo y su procedencia, moneda, movimientos | Transferir, registrar ajuste/saldo inicial, editar datos. |
| Detalle crédito | Disponible si conocido, deuda, períodos y vencimientos | Registrar período, visualizar cuotas, pagar resumen. |
| Planificación | Vencimientos confirmados / estimados / proyectados separados | Registrar cobro/pago, revisar recurrencia, crear presupuesto. |
| Presupuestos | Tope vs gastado vs comprometido vs proyectado por moneda/período | Crear/editar, drill-down, alertas. |
| Reportes | Filtros con 6 perspectivas y definición de cada valor | Alternar fechas, agrupar por categoría/referencia, exportar más adelante. |
| Comparar tarjetas | Compra, importe, fecha, tarjetas, modalidades, condiciones conocidas | Simular y guardar escenario sin ejecutar operación. |
| Configuración | Catálogos, perfil, preferencia de moneda y zona horaria | CRUD con referencias protegidas. |

## 2. Primer uso [VALIDADO]

- Autenticación de cuenta Google o Apple; backend determina si ya existe perfil y billetera; sesión existente va directamente a Home.
- Primera billetera obligatoria; **no** obligar a cargar categoría, saldo inicial ni períodos de crédito para terminar onboarding.
- Campos base: nombre, tipo, monedas permitidas, moneda predeterminada sugerida editable. Cash: lugar opcional, banco no aplica. Débito/crédito: banco obligatorio; selector permite crear uno nuevo.
- En crédito **preguntar explícitamente** si cierres/vencimientos son fijos o variables; permitir configuración por períodos o más adelante; jamás inventar fechas conocidas.
- Tras cada alta: **Crear otra billetera** / **Ir a Home**. Inicio nuevo no muestra seis accesos supuestamente habituales ni diez movimientos inventados.

## 3. Home [VALIDADO + PROPUESTA]

- Billeteras muestran tipo, monedas y posición apropiada: cash/débito saldo conocido o “sin saldo inicial”; crédito deuda/disponible sólo si se conoce límite y obligaciones; facturación pendiente identificada.
- Habituales: estado vacío al primer acceso. Después de operar, accesos a categorías realmente usadas (Impuestos, Sueldo, Préstamo); [PROPUESTA] fijados y operaciones habituales específicas como “Impuesto municipal · Dpto 0027”. No promover accesos por haber mostrado sugerencias.
- Diez últimas **operaciones reales**, una fila por operación lógica, ordenadas por fecha de registro descendente de forma estable. Sueldo multimoneda aparece como una operación con desglose; pago de tarjeta no se disfraza de gasto nuevo. “Ver todos” va a historial.
- Acción global + Nuevo movimiento inicia familia ingreso/egreso sin preselección, excepto acceso rápido que completa familia/categoría/concepto/referencia si están asociados; todo valor editable.

## 4. Registro: dos caminos, mismo formulario [VALIDADO]

```text
Camino completo: Home → Nuevo → Ingreso/Egreso → Categoría [crear] → Concepto/subtipo
Camino corto: Home → acceso habitual → familia/categoría/concepto preseleccionados
Ambos → [N líneas: importe | moneda | billetera] → [opciones] → confirmar
                                             │
                                             └─ falta selector → + Crear elemento
                                                   [puede anidar alta banco/moneda]
                                                   → volver con el nuevo seleccionado
```

Datos mínimos de **cobro o pago inmediato**: familia, categoría, operación/subtipo si su efecto cambia, al menos una línea importe positivo-moneda-billetera compatible, fecha efectiva (hoy por defecto, editable), fecha económica igual a hoy por defecto con posibilidad de separar, moneda, referencia si el usuario la agrega. Pago en crédito genera **obligación**, no salida de caja en la compra.

No exigir billetera para un **ingreso ganado pero no cobrado** ni para un **gasto realizado pero no pagado**: en esos estados el importe/moneda son de hecho/obligación, sin línea de efectivo aún. Separar un selector corto “¿Ya cobraste/pagaste?” sólo cuando la operación requiera distinguirlo; no agregar una pantalla forzosa al caso común pagado.

## 5. Creación contextual reutilizable [VALIDADO]

En TODO selector de recurso del usuario incluir `+ Crear ...`, incluso cuando esté vacío. Subflujo modal/pantalla anidado retiene `draftId`, campo origen y línea origen; puede crear nuevas dependencias recursivamente; al guardar vuelve con ID nuevo elegido; al cancelar vuelve sin cambios. Si falla guardar/reintentar, no perder el borrador principal. Si el usuario navega accidentalmente, advertir sobre cambios sin guardar y permitir reanudar. Monedas de billetera filtran destinos compatibles; permitir ampliar monedas de una billetera según permiso/regla definida, o crear otra.

## 6. Casos de carga conocidos

### Impuesto municipal — caso probado

Familia egreso → crear categoría Impuestos → concepto Impuesto municipal → 14.999 ARS/EFT → fecha efectiva 19/09/2026 → referencia opcional “Dpto 0027”, código `xxxxx00027` (adicionada luego sin duplicar gasto) → sin recurrencia. De vuelta en Home: aparece Impuestos como habitual y una operación reciente. El código se guarda como texto, incluso con ceros y caracteres enmascarados.

### Sueldo — caso probado

Crear categoría Sueldo → líneas `1700 ARS → EFT`, `1200 USD → USD EFT`. La billetera USD EFT de tipo cash, ubicación Colchón, se creó dentro del mismo formulario, preservando el monto ARS. Fecha de cobro 07/09/2026; período económico agosto (año editable); recurrencia mensual como **proyección**, sin acreditar billeteras futuras. Mostrar dos monedas separadas.

### Préstamo — caso probado

Egreso/categoría Préstamo → subtipo Devolución → crear préstamo Fiat Argo/acreedor Fiat → 500 ARS EFT, 19/09/2026; principal 500, interés 0, comisión 0; estado deuda pendiente. Agregar capital original 17.999 ARS, anterior devuelto 0 → capital pendiente 17.499; luego plan 18 cuotas fijas de 11.000, 2 declaradas pagadas, 16 previstas desde 05/10/2026. **INCONSISTENCIA NO RESUELTA:** el único pago efectivo de 500 aún no está imputado a una cuota; no concluir intereses = 176.000 - 17.499 ni inferir pagos de 22.000. Exponer bandera de conciliación pendiente.

## 7. Estados, accesibilidad y tratamiento de errores [PROPUESTA]

Cada pantalla: carga, vacío genuino, sin conexión, fallo reintentable, validación inline, confirmación real y regreso correcto. Botones se deshabilitan durante envío para evitar doble envío; idempotencia backend sigue siendo obligatoria. Montos admiten localización decimal, teclado numérico y nunca redondeo binario de dinero. Formulario y acciones soportan lector de pantalla, área táctil adecuada, contraste, tamaños de fuente y confirmación de anulación.
