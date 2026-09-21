import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PreferenceStorage } from './preferences';

export type ThemeMode = 'light' | 'dark';
const KEY = 'finanzapp.themeMode';

interface Ctx {
  readonly mode: ThemeMode;
  setMode(mode: ThemeMode): void;
}
const ThemeModeContext = createContext<Ctx | null>(null);

/**
 * Modo de tema. SIEMPRE arranca en claro, sin mirar el modo del sistema: el oscuro lo activa el usuario
 * y se recuerda entre sesiones.
 */
export function ThemeModeProvider({ storage, children }: { storage: PreferenceStorage; children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    let alive = true;
    void storage.get(KEY).then((v) => {
      if (alive && v === 'dark') setModeState('dark');
    });
    return () => {
      alive = false;
    };
  }, [storage]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      void storage.set(KEY, next);
    },
    [storage],
  );
  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode(): Ctx {
  const v = useContext(ThemeModeContext);
  if (!v) throw new Error('useThemeMode requiere <ThemeModeProvider>');
  return v;
}
