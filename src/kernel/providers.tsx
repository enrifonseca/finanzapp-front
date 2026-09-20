import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiProvider, createApiClient, createQueryClient } from '@/core-react';
import { darkTheme, lightTheme } from '@/ui-system';
import { API_BASE_URL } from './config';

/** Raíz de composición: tema, estado de servidor y cliente HTTP. */
export function AppProviders({ children, baseUrl = API_BASE_URL }: { children: ReactNode; baseUrl?: string }) {
  const scheme = useColorScheme();
  const queryClient = useMemo(() => createQueryClient(), []);
  const api = useMemo(() => ({ client: createApiClient(baseUrl), baseUrl }), [baseUrl]);
  return (
    <SafeAreaProvider>
      <PaperProvider theme={scheme === 'dark' ? darkTheme : lightTheme}>
        <QueryClientProvider client={queryClient}>
          <ApiProvider value={api}>{children}</ApiProvider>
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
