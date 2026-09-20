import type { BillingMode, WalletType } from '@/core-react';

export const TYPE_LABEL: Record<WalletType, string> = { CASH: 'Efectivo', DEBIT: 'Débito', CREDIT: 'Crédito' };

export const BILLING_LABEL: Record<BillingMode, string> = {
  FIXED_PATTERN: 'Fechas de cierre y vencimiento fijas',
  VARIABLE_PER_PERIOD: 'Fechas de cierre y vencimiento variables por período',
};
