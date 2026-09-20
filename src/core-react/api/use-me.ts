import { useQuery } from '@tanstack/react-query';
import { useApi } from './api-context';

/** Perfil del usuario (GET /v1/me). */
export function useMe() {
  const { client } = useApi();
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data, response } = await client.GET('/v1/me');
      if (!data) throw new Error(`HTTP ${response.status}`);
      return data;
    },
    retry: false,
  });
}
