import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './api-context';
import { call } from './api-error';

export function useCurrencies() {
  const { client } = useApi();
  return useQuery({ queryKey: ['currencies'], queryFn: async () => (await call(() => client.GET('/v1/currencies'))).items });
}

/** Habilita una moneda del catálogo en contexto (sin salir del formulario). */
export function useEnableCurrency() {
  const { client } = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { code: string; makeDefault?: boolean }) => call(() => client.POST('/v1/currencies', { body: { code: input.code, makeDefault: input.makeDefault ?? false } })),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['currencies'] }), qc.invalidateQueries({ queryKey: ['me'] })]),
  });
}

export function useBanks() {
  const { client } = useApi();
  return useQuery({ queryKey: ['banks'], queryFn: async () => (await call(() => client.GET('/v1/banks', { params: { query: { limit: 100 } } }))).items });
}

/** Alta contextual de banco: devuelve el banco creado para seleccionarlo automáticamente. */
export function useCreateBank() {
  const { client } = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) => call(() => client.POST('/v1/banks', { body: { name: input.name } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banks'] }),
  });
}
