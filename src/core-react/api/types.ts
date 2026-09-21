import type { paths } from './schema';

type Json<T> = T extends { content: { 'application/json': infer B } } ? B : never;

export type Wallet = Json<paths['/v1/wallets/{id}']['get']['responses'][200]>;
export type CreateWalletBody = Json<NonNullable<paths['/v1/wallets']['post']['requestBody']>>;
export type Currency = Json<paths['/v1/currencies']['get']['responses'][200]>['items'][number];
export type Bank = Json<paths['/v1/banks']['get']['responses'][200]>['items'][number];
export type WalletType = Wallet['type'];
export type BillingMode = NonNullable<Wallet['creditProfile']>['billingMode'];

export type Operation = Json<paths['/v1/operations/{id}']['get']['responses'][200]>;
/** `recurrence` (Fase 6, D-08) no se envía: el contrato generado la tipa como null/undefined. */
export type CreateOperationBody = Omit<Json<NonNullable<paths['/v1/operations']['post']['requestBody']>>, 'recurrence'>;
export type OperationFamily = Operation['family'];
export type Category = Json<paths['/v1/categories']['get']['responses'][200]>['items'][number];
export type Reference = Json<paths['/v1/references']['get']['responses'][200]>['items'][number];
export type ReferenceKind = Reference['kind'];

export type CardProfile = Json<paths['/v1/cards/{walletId}/profile']['get']['responses'][200]>;
export type CardOverview = Json<paths['/v1/cards/{walletId}/periods']['get']['responses'][200]>;
export type Statement = CardOverview['periods'][number];
export type StatementCurrency = Statement['currencies'][number];
export type Period = Statement['period'];
export type UnassignedInstallment = CardOverview['unassigned'][number];
export type ChargeKind = Json<NonNullable<paths['/v1/cards/{walletId}/periods/{periodId}/charges']['post']['requestBody']>>['kind'];
export type CreatePurchaseBody = Json<NonNullable<paths['/v1/cards/{walletId}/purchases']['post']['requestBody']>>;
export type PayStatementBody = Json<NonNullable<paths['/v1/cards/{walletId}/periods/{periodId}/payments']['post']['requestBody']>>;
