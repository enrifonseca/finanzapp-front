import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './api-context';
import { call } from './api-error';
import { useIdempotencyKey } from './idempotency';
import type { CreateOperationBody, OperationFamily, ReferenceKind } from './types';

/** Un movimiento cambia historial, billeteras (variación registrada) y "habituales". */
const invalidateLedger = (qc: ReturnType<typeof useQueryClient>) =>
  Promise.all([qc.invalidateQueries({ queryKey: ['operations'] }), qc.invalidateQueries({ queryKey: ['wallets'] })]);

/** Últimas operaciones reales (Home: 10). Una fila por operación lógica. */
export function useRecentOperations(limit = 10) {
  const { client } = useApi();
  return useQuery({
    queryKey: ['operations', 'recent', limit],
    queryFn: async () => (await call(() => client.GET('/v1/operations', { params: { query: { limit } } }))).items,
  });
}

/** Historial completo con paginación por cursor. */
export function useOperationsHistory() {
  const { client } = useApi();
  return useInfiniteQuery({
    queryKey: ['operations', 'history'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => call(() => client.GET('/v1/operations', { params: { query: { limit: 25, ...(pageParam ? { cursor: pageParam } : {}) } } })),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useOperation(id: string) {
  const { client } = useApi();
  return useQuery({ queryKey: ['operations', 'detail', id], queryFn: () => call(() => client.GET('/v1/operations/{id}', { params: { path: { id } } })) });
}

/** Alta con Idempotency-Key estable por contenido (reintento tras corte de red no duplica). */
export function useCreateOperation() {
  const { client } = useApi();
  const qc = useQueryClient();
  const idem = useIdempotencyKey();
  return useMutation({
    mutationFn: (body: CreateOperationBody) => call(() => client.POST('/v1/operations', { body: body as never, params: { header: { 'Idempotency-Key': idem.keyFor(body) } } })),
    onSuccess: async () => {
      idem.done();
      await invalidateLedger(qc);
    },
  });
}

export function useReverseOperation() {
  const { client } = useApi();
  const qc = useQueryClient();
  const idem = useIdempotencyKey();
  return useMutation({
    mutationFn: (id: string) => call(() => client.POST('/v1/operations/{id}/reversal', { params: { path: { id }, header: { 'Idempotency-Key': idem.keyFor({ id }) } } })),
    onSuccess: async () => {
      idem.done();
      await invalidateLedger(qc);
    },
  });
}

/** Solo etiquetas (referencia, categoría, concepto, nota): no toca la caja. */
export function usePatchOperation(id: string) {
  const { client } = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { referenceId?: string | null; categoryId?: string | null; note?: string | null }) =>
      call(() => client.PATCH('/v1/operations/{id}', { params: { path: { id } }, body })),
    onSuccess: () => invalidateLedger(qc),
  });
}

export function useCategories(family: OperationFamily) {
  const { client } = useApi();
  return useQuery({
    queryKey: ['categories', family],
    queryFn: async () => (await call(() => client.GET('/v1/categories', { params: { query: { family, limit: 100 } } }))).items,
  });
}

/** Alta contextual de categoría: la familia ya está elegida en el movimiento. */
export function useCreateCategory() {
  const { client } = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { family: OperationFamily; name: string }) => call(() => client.POST('/v1/categories', { body: input })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useReferences() {
  const { client } = useApi();
  return useQuery({ queryKey: ['references'], queryFn: async () => (await call(() => client.GET('/v1/references', { params: { query: { limit: 100 } } }))).items });
}

export function useCreateReference() {
  const { client } = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { kind: ReferenceKind; displayName: string; externalCodeText?: string }) => call(() => client.POST('/v1/references', { body: input })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['references'] }),
  });
}
