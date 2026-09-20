import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ApiProvider, AuthProvider, OnboardingProvider, RuntimeConfigProvider, SessionManager, createApiClient, createQueryClient, secureTokenStorage, type TokenStorage,
} from '@/core-react';
import { darkTheme, lightTheme } from '@/ui-system';
import { API_BASE_URL, AUTH_SANDBOX } from './config';

interface Props {
  children: ReactNode;
  baseUrl?: string;
  storage?: TokenStorage;
  authSandbox?: boolean;
}

/** Raíz de composición: tema, estado de servidor, sesión y cliente HTTP autenticado. */
export function AppProviders({ children, baseUrl = API_BASE_URL, storage = secureTokenStorage, authSandbox = AUTH_SANDBOX }: Props) {
  const scheme = useColorScheme();
  const queryClient = useMemo(() => createQueryClient(), []);
  const manager = useMemo(() => new SessionManager(baseUrl, storage), [baseUrl, storage]);
  const api = useMemo(() => ({ client: createApiClient(baseUrl, manager), baseUrl }), [baseUrl, manager]);
  const runtime = useMemo(() => ({ authSandbox }), [authSandbox]);
  return (
    <SafeAreaProvider>
      <PaperProvider theme={scheme === 'dark' ? darkTheme : lightTheme}>
        <QueryClientProvider client={queryClient}>
          <RuntimeConfigProvider value={runtime}>
            <ApiProvider value={api}>
              <AuthProvider manager={manager}>
                <OnboardingProvider>{children}</OnboardingProvider>
              </AuthProvider>
            </ApiProvider>
          </RuntimeConfigProvider>
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
