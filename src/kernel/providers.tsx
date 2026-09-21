import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ApiProvider, AuthProvider, OnboardingProvider, RuntimeConfigProvider, SessionManager, ThemeModeProvider, devicePreferences, useThemeMode, createApiClient, createQueryClient, secureTokenStorage, type PreferenceStorage, type TokenStorage,
} from '@/core-react';
import { darkTheme, lightTheme } from '@/ui-system';
import { API_BASE_URL, AUTH_SANDBOX } from './config';

interface Props {
  children: ReactNode;
  baseUrl?: string;
  storage?: TokenStorage;
  authSandbox?: boolean;
  preferences?: PreferenceStorage;
}

/** Paper con el tema elegido: claro por defecto; oscuro solo si el usuario lo activó. */
function ThemedPaper({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode();
  return <PaperProvider theme={mode === 'dark' ? darkTheme : lightTheme}>{children}</PaperProvider>;
}

/** Raíz de composición: tema, estado de servidor, sesión y cliente HTTP autenticado. */
export function AppProviders({ children, baseUrl = API_BASE_URL, storage = secureTokenStorage, authSandbox = AUTH_SANDBOX, preferences = devicePreferences }: Props) {
  const queryClient = useMemo(() => createQueryClient(), []);
  const manager = useMemo(() => new SessionManager(baseUrl, storage), [baseUrl, storage]);
  const api = useMemo(() => ({ client: createApiClient(baseUrl, manager), baseUrl }), [baseUrl, manager]);
  const runtime = useMemo(() => ({ authSandbox }), [authSandbox]);
  // OJO con el orden: el contenido de un <Portal> (diálogos) se renderiza bajo PaperProvider, así que
  // PaperProvider debe ir DENTRO de los providers de datos/sesión para que los diálogos puedan usar hooks de API.
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RuntimeConfigProvider value={runtime}>
          <ApiProvider value={api}>
            <AuthProvider manager={manager}>
              <OnboardingProvider>
                <ThemeModeProvider storage={preferences}>
                  <ThemedPaper>{children}</ThemedPaper>
                </ThemeModeProvider>
              </OnboardingProvider>
            </AuthProvider>
          </ApiProvider>
        </RuntimeConfigProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
