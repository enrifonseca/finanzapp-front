import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface Onboarding {
  /** Verdadero mientras la persona está en el asistente de primer uso (aunque ya haya creado una billetera). */
  readonly active: boolean;
  start(): void;
  finish(): void;
}

const Ctx = createContext<Onboarding | null>(null);

/**
 * Mantiene el asistente abierto tras crear la primera billetera para poder ofrecer
 * "Crear otra billetera" / "Ir a Home" (FLUJO-001 §8 bis) aunque el backend ya marque el primer uso como completo.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const value = useMemo(() => ({ active, start: () => setActive(true), finish: () => setActive(false) }), [active]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding(): Onboarding {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOnboarding requiere <OnboardingProvider>');
  return v;
}
