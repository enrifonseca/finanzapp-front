import { createContext, useContext, type ReactNode } from 'react';
import type { ApiClient } from './client';

interface ApiContextValue {
  readonly client: ApiClient;
  readonly baseUrl: string;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ value, children }: { value: ApiContextValue; children: ReactNode }) {
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi requiere <ApiProvider>');
  return ctx;
}
