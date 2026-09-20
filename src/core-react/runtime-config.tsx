import { createContext, useContext, type ReactNode } from 'react';

export interface RuntimeConfig {
  /** Login de desarrollo habilitado (el backend debe tener AUTH_SANDBOX=true). */
  readonly authSandbox: boolean;
}

const Ctx = createContext<RuntimeConfig>({ authSandbox: false });

export function RuntimeConfigProvider({ value, children }: { value: RuntimeConfig; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useRuntimeConfig = () => useContext(Ctx);
