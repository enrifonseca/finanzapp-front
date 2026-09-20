import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import type { Provider, SessionManager, SessionStatus } from './session-manager';

const AuthContext = createContext<SessionManager | null>(null);

/** Inicializa la sesión guardada al montar y la expone a los hooks. */
export function AuthProvider({ manager, children }: { manager: SessionManager; children: ReactNode }) {
  useEffect(() => {
    void manager.init();
  }, [manager]);
  return <AuthContext.Provider value={manager}>{children}</AuthContext.Provider>;
}

function useManager(): SessionManager {
  const m = useContext(AuthContext);
  if (!m) throw new Error('useSession requiere <AuthProvider>');
  return m;
}

export function useSession(): {
  status: SessionStatus;
  signIn: (provider: Provider, idToken: string, nonce?: string) => Promise<void>;
  signOut: () => Promise<void>;
} {
  const manager = useManager();
  const queryClient = useQueryClient();
  const status = useSyncExternalStore(manager.subscribe, manager.getStatus, manager.getStatus);
  const signOut = useCallback(async () => {
    await manager.signOut();
    queryClient.clear(); // logout borra la caché de datos financieros (docs/spec/09 §1)
  }, [manager, queryClient]);
  return { status, signIn: (p, t, n) => manager.signIn(p, t, n), signOut };
}
