import { useQuery } from '@tanstack/react-query';
import { useSession } from '../auth/auth-context';
import { useApi } from './api-context';
import { call } from './api-error';

/** Perfil del usuario (GET /v1/me). Solo se consulta con sesión: sin ella daría 401 y quedaría cacheado como error. */
export function useMe() {
  const { client } = useApi();
  const { status } = useSession();
  return useQuery({
    queryKey: ['me'],
    enabled: status === 'signedIn',
    queryFn: () => call(() => client.GET('/v1/me')),
    retry: false,
  });
}
