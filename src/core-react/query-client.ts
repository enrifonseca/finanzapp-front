import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, retry: process.env.NODE_ENV === 'test' ? false : 1, ...(process.env.NODE_ENV === 'test' ? { gcTime: 0 } : {}) } } });
}
