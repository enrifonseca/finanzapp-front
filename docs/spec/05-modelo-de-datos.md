# 05 — Modelo de datos relacional propuesto (PostgreSQL)

**Estado:** [PROPUESTA] para implementación. Este documento representa modelo lógico, no un DDL cerrado; el agente debe crear migraciones revisables y documentar cambios. Las reglas de `03` prevalecen ante colisiones. Todas las tablas privadas llevan `user_id` o se alcanzan sólo a través de su entidad propietaria y se verifican en cada operación. Usar UUID o identificadores opacos; campos `created_at`, `updated_at`, `version`, `deleted_at` según lifecycle. En dinero usar NUMERIC exacto y DTO string; nunca double precision.

## 1. Identidad y catálogos

```text
users(id, locale, timezone, preferred_currency_code, onboarding_completed_at, created_at)
auth_identities(id, user_id, provider[GOOGLE|APPLE], provider_subject, linked_at,
                UNIQUE(provider, provider_subject))
currencies(code, display_name, minor_unit_digits, active)
user_currencies(user_id, currency_code, enabled, is_default)
banks(id, user_id, name, normalized_name, country_code?, active)
categories(id, user_id, family[INCOME|EXPENSE], name, parent_id?, color?, icon?, active)
references(id, user_id, kind[ACCOUNT|CLIENT|PROPERTY|CONTRACT|SERVICE|OTHER],
           display_name, external_code_text?, description?, active)
reference_links(reference_id, related_reference_id, relationship_kind) [fase posterior]
```

`category.family` no es `operation.kind`; Préstamo puede existir en ingreso y egreso y producir efectos distintos. `banks` son entidades creadas por usuario, no catálogos rígidos globales; deduplicación por nombre sólo debe sugerirse, nunca fusionar cuentas de personas diferentes. Un código externo puede contener ceros y caracteres ocultos.

## 2. Billeteras, estado y posiciones

```text
wallets(id, user_id, name, type[CASH|DEBIT|CREDIT], bank_id?, location_text?,
        status[ACTIVE|ARCHIVED], created_at, version)
wallet_currencies(wallet_id, currency_code, enabled, PRIMARY KEY(wallet_id,currency_code))
wallet_opening_balances(id, wallet_id, currency_code, amount_numeric,
                        effective_date, source[USER_ENTERED|RECONCILED], verified, note?)
wallet_postings(id, user_id, wallet_id, currency_code, signed_amount_numeric,
                occurred_at, operation_id, funds_movement_id?, posting_kind, reversal_of_id?)
wallet_position_snapshots(id, wallet_id, currency_code, as_of, balance_numeric,
                          based_on_opening_balance_id?, source_version) [cache reconstruible]
credit_limits(id, wallet_id, currency_code, amount_numeric, valid_from, valid_to?, kind?)
```

Constraints: CASH ⇒ `bank_id IS NULL` y `location_text` opcional; DEBIT/CREDIT ⇒ banco obligatorio y del mismo usuario; wallet_currencies mínimo uno antes de activar. Cash/débito `saldo` = saldo inicial verificado al corte + postings posteriores, en su misma moneda; si no hay apertura ⇒ `known_balance=false`. Saldo “desconocido” no se representa con `0`. No sumar postings de la tarjeta crédito como dinero disponible; deuda/limite son proyecciones separadas.

## 3. Operaciones, hechos económicos, caja, vencimientos

```text
operations(id, user_id, family[INCOME|EXPENSE|INTERNAL], kind, category_id?,
           concept, reference_id?, occurred_economic_date?, economic_period?,
           note?, state[DRAFT|CONFIRMED|REVERSED], recorded_at, updated_at, version)
operation_economic_components(id, operation_id, direction[INCOME|EXPENSE],
           currency_code, amount_numeric, economic_date?, economic_period?,
           subtype[PRINCIPAL_EXCLUDED|ORDINARY|INTEREST|FEE|ADJUSTMENT]?, state)
funds_movements(id, operation_id, occurred_at, effective_local_date?,
           movement_type[EXTERNAL_IN|EXTERNAL_OUT|OWN_TRANSFER|FX|CARD_SETTLEMENT|OPENING_ADJUSTMENT],
           state, note?)
funds_movement_lines(id, funds_movement_id, wallet_id, currency_code,
           signed_amount_numeric, role[SOURCE|DESTINATION|FEE|EXTERNAL], wallet_posting_id?)
dues(id, user_id, operation_id?, card_installment_id?, loan_installment_id?,
           direction[PAYABLE|RECEIVABLE], currency_code, original_amount_numeric,
           due_date?, due_date_confidence[UNKNOWN|ESTIMATED|CONFIRMED],
           state[OPEN|PARTIALLY_SETTLED|SETTLED|CANCELLED], description?, version)
payment_allocations(id, user_id, funds_movement_line_id, due_id,
           amount_in_due_currency_numeric, fx_exchange_id?, created_at, reversed_at?)
```

**Importantísimo:** `funds_movement_lines` permiten una operación sueldo con 1.700 ARS/EFT + 1.200 USD/USD EFT como entrada real *con un solo `operation_id`*. Para cash/débito cada línea real genera un posting de wallet en transacción. Una compra con tarjeta genera hecho económico y deuda en tarjeta, **no** posting de salida de una cuenta bancaria/cash en ese momento. La liquidación de resumen usa `CARD_SETTLEMENT` + posting de salida de cash/débito + asignación a dues existentes y componentes separados por intereses/cargos si aplican.

`dues` nunca se considera pagada sólo por llegar `due_date`. Su saldo = original menos allocations netas + ajustes válidos. La suma de allocations no excede el pendiente; importes de moneda diferente exigen FX explícito. Si pago mayor, registrar crédito a favor/no asignado con su moneda; no atribuirlo silenciosamente a capital/intereses. Cuando `DRAFT` no existe posting de caja confirmado.

**Balanceo mínimo:** para transacciones internas/FX, grupo `funds_movements` debe tener patas consistentes (origen/destino reales y comisión separada); para transferencias misma moneda origen y destino importes opuestos más comisión explícita; para transacciones externas puede existir contrapartida virtual `EXTERNAL_CLEARING` dentro del ledger contable, no visible como billetera. Diseñar catálogo fijo de cuentas internas si se implementa libro de doble entrada. Prohibido simular un posting de billetera ajena para “balancear” una compra de tarjeta.

## 4. Crédito

```text
credit_card_profiles(wallet_id PK, billing_mode[FIXED_PATTERN|VARIABLE_PER_PERIOD],
                     nominal_close_day?, nominal_due_rule?, setup_status[PARTIAL|COMPLETE])
card_billing_periods(id, wallet_id, cycle_label, open_date?, close_date?, due_date?,
                     date_confidence, state[ESTIMATED|CONFIGURED|CLOSED|SETTLED],
                     UNIQUE(wallet_id,cycle_label), version)
card_purchases(id, operation_id, wallet_id, purchase_date, bank_posted_date?,
               currency_code, original_amount_numeric, installment_count, merchant?,
               billing_period_id?, period_assignment_confidence)
card_installments(id, card_purchase_id, number, total_count, currency_code,
                  amount_numeric, billing_period_id?, due_id?, state)
card_statement_lines(id, period_id, currency_code, kind[PURCHASE|INSTALLMENT|FEE|INTEREST|TAX|ADJUSTMENT],
                     source_id?, amount_numeric, state)
card_statements(id, period_id, currency_code, amount_due_numeric?, min_payment_numeric?,
                confirmed_at?, state[OPEN|ISSUED|PARTIAL|PAID])
card_promotions(id, wallet_id, merchant_pattern?, category_id?, currency_code?,
                valid_from, valid_to, installment_count?, interest_rate?,
                cashback_rule_json?, discount_rule_json?, cap_numeric?, exclusions_json?,
                source_label, verified_at?, confidence) [fase comparador]
```

No imponer un vencimiento fijo global. Si el modo es variable, fechas concretas vienen por período y pueden estar pendientes. Si `FIXED_PATTERN`, fechas calculadas = ESTIMATED hasta confirmarlas. `card_statement_lines` reflejan cargos/consumos de un período; **no** duplican gastos económicos. [PENDIENTE] reglas específicas del emisor sobre día de cierre, cuotas, fechas de contabilización, moneda de pago, percepciones e impuesto se configuran, no se suponen.

## 5. Préstamos

```text
loans(id, user_id, direction[RECEIVED|GRANTED], creditor_or_debtor_name,
      reference_id?, display_name, currency_code?, principal_original_numeric?,
      originated_at?, state[ACTIVE|SETTLED|UNKNOWN], source_info[USER_DECLARED|VERIFIED], version)
loan_plans(id, loan_id, plan_type[FIXED|VARIABLE|FREE|MANUAL], installment_count?,
           nominal_installment_numeric?, frequency_rule_json?, effective_from?,
           payment_day_rule?, terms_text?, state)
loan_installments(id, loan_plan_id, sequence_no, due_date?, total_due_numeric?,
                  principal_component_numeric?, interest_component_numeric?, fee_component_numeric?,
                  payment_status[UNCONFIRMED|PARTIAL|SETTLED], status_source, due_id?)
loan_principal_events(id, loan_id, operation_id, currency_code,
                      signed_delta_numeric, event_kind[DISBURSEMENT|REPAYMENT|ADJUSTMENT],
                      occurred_at?, source_status[USER_DECLARED|ACTUAL_MOVEMENT|VERIFIED])
loan_payment_allocations(id, funds_movement_id, loan_installment_id?,
                         principal_numeric?, interest_numeric?, fee_numeric?, unallocated_numeric?,
                         allocation_status[CONFIRMED|UNRECONCILED])
```

Préstamo creado desde devolución puede tener `principal_original` NULL. Si se declara después original 17.999 ARS y devolución verificada 500, pendiente principal 17.499; registrar origen informado como **dato histórico declarado**, no crear entrada de fondos EFT en 2026-08-01 sin confirmación del desembolso. Declarar “dos cuotas completas pagadas” actualiza estado informado del plan, no fabrica 22.000 de salida de fondos. Marcar inconsistencia si cuota 11.000 y pago 500 no imputado; permitir reconciliar más tarde.

## 6. Recurrencia, proyección, presupuestos y decisiones

```text
recurrence_rules(id, user_id, template_kind, source_operation_id?,
                 schedule_json, start_date, end_date?, timezone,
                 amounts_json, target_wallet_ids_json?, state[ACTIVE|PAUSED|ENDED], version)
forecast_occurrences(id, recurrence_rule_id?, loan_installment_id?, card_installment_id?,
                     date?, period?, amount_numeric, currency_code,
                     basis[RECURRING|DUE|CARD|LOAN|SCENARIO], confidence, source_version,
                     materialized_operation_id?, dismissed_at?, UNIQUE(source,basis,occurrence_key))
budgets(id, user_id, name, currency_code, period_type, start_date, end_date,
        category_id?, reference_id?, wallet_id?, limit_numeric,
        basis[ECONOMIC_EXPENSE|CASH_OUT|COMMITTED], rollover_rule, state)
budget_alerts(id, budget_id, threshold_percent, enabled, channel?, last_notified_at?)
comparison_scenarios(id, user_id, label, purchase_amount_numeric, currency_code,
                     purchase_date, merchant?, selected_card_ids_json,
                     assumptions_json, result_snapshot_json?, evaluated_at?)
fx_rates(id, user_id?, base_currency, quote_currency, rate_decimal,
         effective_at, source_label, rate_kind[ACTUAL|MANUAL|ESTIMATE], verified_at?)
audit_events(id, user_id, actor_id, entity_type, entity_id, action,
             reason?, before_json?, after_json?, occurred_at, request_id)
idempotency_records(id, user_id, endpoint, key, request_hash, response_json,
                    status, created_at, expires_at, UNIQUE(user_id,endpoint,key))
outbox_events(id, kind, aggregate_id, payload_json, created_at, processed_at?, retry_count)
```

Los JSON en reglas/escenarios sirven sólo donde esquema versionado y validado esté definido; **no** usar JSON arbitrario para el ledger, cuotas, obligaciones, saldos o dinero real.

## 7. Relaciones y restricciones

```text
User 1--N Wallet / Category / Bank / Reference / Operation / Loan / Budget
Wallet N--1 Bank? ; Wallet N--M Currency ; Wallet 1--N BillingPeriod (credit)
Operation 1--N EconomicComponent ; Operation 1--N FundsMovement ; Operation 1--N Due
FundsMovement 1--N FundsMovementLine ; FundsMovementLine N--M Due via Allocation
CardPurchase N--1 Operation ; CardPurchase 1--N CardInstallment ; CardInstallment N--1 BillingPeriod?
Loan 1--N LoanPlan ; LoanPlan 1--N LoanInstallment ; LoanInstallment 0..1--1 Due
RecurrenceRule 1--N ForecastOccurrence ; Budget N--0..1 Category/Reference/Wallet
```

- FKs con mismo propietario a nivel servicio y, cuando viable, claves compuestas con `user_id`. Acceso API `id` ajeno devuelve 404/403 consistente sin filtrar existencia.
- Categoría usada no se elimina físicamente; archivado y nueva selección. Banco o billetera usados: archivar, no cascade destructivo. Moneda usada conserva identidad histórica.
- Índices: `operations(user_id, recorded_at DESC,id DESC)`, por `economic_date`, `category_id`, `reference_id`; `wallet_postings(wallet_id,currency_code,occurred_at)`; `dues(user_id,due_date,state)`; `card_billing_periods(wallet_id,close_date)`, `loan_installments(loan_plan_id,sequence_no)`; unicidad de idempotencia y versión.
- Cada mutación financiera y su auditoría en una transacción. Migraciones forward y backfill compatibles; cero ALTER destructivos sobre datos monetarios sin herramienta de verificación de invariantes.
