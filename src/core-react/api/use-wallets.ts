import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './api-context';
import { call } from './api-error';
import { useIdempotencyKey } from './idempotency';
import type { CreateWalletBody } from './types';

export function useWallets() {
  const { client } = useApi();
  return useQuery({ queryKey: ['wallets'], queryFn: async () => (await call(() => client.GET('/v1/wallets', { params: { query: { limit: 100 } } }))).items });
}

/**
 * Alta de billetera con Idempotency-Key estable por contenido: si la respuesta se pierde
 * y el usuario reintenta, el backend devuelve la misma billetera en vez de crear otra.
 */
export function useCreateWallet() {
  const { client } = useApi();
  const qc = useQueryClient();
  const idem = useIdempotencyKey();
  return useMutation({
    mutationFn: (body: CreateWalletBody) =>
      call(() => client.POST('/v1/wallets', { body, params: { header: { 'Idempotency-Key': idem.keyFor(body) } } })),
    onSuccess: async () => {
      idem.done();
      await Promise.all([qc.invalidateQueries({ queryKey: ['wallets'] }), qc.invalidateQueries({ queryKey: ['me'] })]);
    },
  });
}
