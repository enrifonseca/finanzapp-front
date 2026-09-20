import { useQuery } from '@tanstack/react-query';
import { useApi } from './api-context';

export type BackendStatus = 'checking' | 'up' | 'down';

/** Consulta /health/ready (proceso + base de datos). Diagnóstico de conexión, no lógica de negocio. */
export function useBackendStatus() {
  const { client } = useApi();
  const query = useQuery({
    queryKey: ['backend', 'ready'],
    queryFn: async () => {
      const { response } = await client.GET('/health/ready');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return true;
    },
    retry: false,
    refetchInterval: 15_000,
  });
  const status: BackendStatus = query.isPending ? 'checking' : query.isSuccess ? 'up' : 'down';
  return { status, refetch: query.refetch, isFetching: query.isFetching };
}
