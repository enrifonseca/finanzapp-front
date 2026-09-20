# Contexto del proyecto — Finanzas Personales

Repo: finanzapp-front
Fuente de verdad funcional: docs/spec/ (README + 01-11 + FLUJO-* + escenarios.json)
Plan de ejecución completo: docs/PLAN-EJECUCION-CLAUDE-CODE.md

## Reglas obligatorias en TODA sesión, sin excepción

1. Antes de tocar código, releé docs/spec/README.md y los docs 01-11 relevantes
   a la tarea. Los FLUJO-*.md son evidencia complementaria, no reemplazan 01-11.
2. Respetá [VALIDADO]/[PROPUESTA]/[PENDIENTE]. Si una tarea toca un punto
   [PENDIENTE] (ver docs/spec/11-decisiones-pendientes.md) y no hay una decisión
   ya registrada en docs/DECISIONES.md, PARÁ Y PREGUNTAME. No lo resuelvas solo,
   aunque "auto mode" esté activo — esta regla tiene prioridad sobre avanzar rápido.
3. Nunca dupliques un hecho económico (cuotas, pago de tarjeta, devolución de
   capital). Ver docs/spec/03 "Invariante de no duplicación" antes de sumar nada.
4. Dinero: decimal exacto, nunca float. Moneda explícita siempre. unknown ≠ 0.
5. Trabajá una vertical por vez, según las fases de docs/PLAN-EJECUCION-CLAUDE-CODE.md
   sección 2. No adelantes fases ni crees pantallas/infraestructura de features futuras.
6. Toda feature de dinero necesita: migración si aplica, caso de uso, contrato
   OpenAPI, UI si es frontend, tests, manejo de estado vacío/error.
7. No declares nada "terminado" sin correr los tests y mostrarme el resultado real.
8. No hagas migraciones destructivas ni pongas datos financieros reales en seeds.

## Protocolo de sesión

Al EMPEZAR cada sesión: leé docs/ESTADO.md. Decime en una línea en qué fase estás
y cuál es el próximo paso concreto, antes de hacer nada más.

Al TERMINAR cada tarea: actualizá docs/ESTADO.md con qué se hizo, qué quedó
mockeado/pendiente, y qué decisión de docs/spec/11 tuviste que consultarme
(anotala también en docs/DECISIONES.md si tomamos una definición nueva).
