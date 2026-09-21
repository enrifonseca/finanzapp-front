import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './api-context';
import { call } from './api-error';
import { useIdempotencyKey } from './idempotency';
import type { ChargeKind, CreatePurchaseBody, PayStatementBody } from './types';

/** Todo lo que cambia una tarjeta: su resumen, el historial y las billeteras (variación registrada). */
const useInvalidateCard = (walletId: string) => {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: ['card', walletId] }), qc.invalidateQueries({ queryKey: ['operations'] }), qc.invalidateQueries({ queryKey: ['wallets'] })]);
};

export function useCardProfile(walletId: string) {
  const { client } = useApi();
  return useQuery({ queryKey: ['card', walletId, 'profile'], queryFn: () => call(() => client.GET('/v1/cards/{walletId}/profile', { params: { path: { walletId } } })) });
}

/** Día de cierre y de vencimiento (opcionales; null los quita). */
export function useUpdateCardProfile(walletId: string) {
  const { client } = useApi();
  const invalidate = useInvalidateCard(walletId);
  return useMutation({
    mutationFn: (body: { nominalCloseDay?: number | null; nominalDueDay?: number | null }) => call(() => client.PATCH('/v1/cards/{walletId}/profile', { params: { path: { walletId } }, body })),
    onSuccess: invalidate,
  });
}

export function useCardOverview(walletId: string) {
  const { client } = useApi();
  return useQuery({ queryKey: ['card', walletId, 'overview'], queryFn: () => call(() => client.GET('/v1/cards/{walletId}/periods', { params: { path: { walletId } } })) });
}

export function useCreatePeriod(walletId: string) {
  const { client } = useApi();
  const invalidate = useInvalidateCard(walletId);
  return useMutation({
    mutationFn: (body: { closeDate: string; openDate?: string; dueDate?: string }) => call(() => client.POST('/v1/cards/{walletId}/periods', { params: { path: { walletId } }, body })),
    onSuccess: invalidate,
  });
}

/** Corrige fechas de cierre/vencimiento del período: pasan a CONFIRMED. */
export function useUpdatePeriod(walletId: string, periodId: string) {
  const { client } = useApi();
  const invalidate = useInvalidateCard(walletId);
  return useMutation({
    mutationFn: (body: { openDate?: string | null; closeDate?: string | null; dueDate?: string | null; expectedVersion?: number }) =>
      call(() => client.PATCH('/v1/cards/{walletId}/periods/{periodId}', { params: { path: { walletId, periodId } }, body })),
    onSuccess: invalidate,
  });
}

/** Total real del banco (null lo quita). La diferencia con lo calculado queda visible. */
export function useSetBankTotal(walletId: string, periodId: string) {
  const { client } = useApi();
  const invalidate = useInvalidateCard(walletId);
  return useMutation({
    mutationFn: (input: { currency: string; bankTotal: string | null }) =>
      call(() => client.PUT('/v1/cards/{walletId}/periods/{periodId}/bank-totals/{currency}', { params: { path: { walletId, periodId, currency: input.currency } }, body: { bankTotal: input.bankTotal } })),
    onSuccess: invalidate,
  });
}

export function useAddCharge(walletId: string, periodId: string) {
  const { client } = useApi();
  const invalidate = useInvalidateCard(walletId);
  const idem = useIdempotencyKey();
  return useMutation({
    mutationFn: (body: { kind: ChargeKind; currency: string; amount: string; date: string; description?: string }) =>
      call(() => client.POST('/v1/cards/{walletId}/periods/{periodId}/charges', { params: { path: { walletId, periodId }, header: { 'Idempotency-Key': idem.keyFor(body) } }, body })),
    onSuccess: async () => {
      idem.done();
      await invalidate();
    },
  });
}

export function useMoveInstallment(walletId: string) {
  const { client } = useApi();
  const invalidate = useInvalidateCard(walletId);
  return useMutation({
    mutationFn: (input: { installmentId: string; periodId: string | null }) =>
      call(() => client.POST('/v1/cards/{walletId}/installments/{installmentId}/move', { params: { path: { walletId, installmentId: input.installmentId } }, body: { periodId: input.periodId } })),
    onSuccess: invalidate,
  });
}

/** Compra en cuotas (Idempotency-Key estable por contenido). */
export function useCreatePurchase(walletId: string) {
  const { client } = useApi();
  const invalidate = useInvalidateCard(walletId);
  const idem = useIdempotencyKey();
  return useMutation({
    mutationFn: (body: CreatePurchaseBody) => call(() => client.POST('/v1/cards/{walletId}/purchases', { params: { path: { walletId }, header: { 'Idempotency-Key': idem.keyFor(body) } }, body })),
    onSuccess: async () => {
      idem.done();
      await invalidate();
    },
  });
}

/** Pago total o parcial de un resumen (reduce su saldo). */
export function usePayStatement(walletId: string, periodId: string) {
  const { client } = useApi();
  const invalidate = useInvalidateCard(walletId);
  const idem = useIdempotencyKey();
  return useMutation({
    mutationFn: (body: PayStatementBody) => call(() => client.POST('/v1/cards/{walletId}/periods/{periodId}/payments', { params: { path: { walletId, periodId }, header: { 'Idempotency-Key': idem.keyFor(body) } }, body })),
    onSuccess: async () => {
      idem.done();
      await invalidate();
    },
  });
}
