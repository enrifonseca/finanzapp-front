import type { paths } from './schema';

type Json<T> = T extends { content: { 'application/json': infer B } } ? B : never;

export type Wallet = Json<paths['/v1/wallets/{id}']['get']['responses'][200]>;
export type CreateWalletBody = Json<NonNullable<paths['/v1/wallets']['post']['requestBody']>>;
export type Currency = Json<paths['/v1/currencies']['get']['responses'][200]>['items'][number];
export type Bank = Json<paths['/v1/banks']['get']['responses'][200]>['items'][number];
export type WalletType = Wallet['type'];
export type BillingMode = NonNullable<Wallet['creditProfile']>['billingMode'];
