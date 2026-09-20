import { useRef } from 'react';

const canonical = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canonical).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.entries(v as Record<string, unknown>)
          .filter(([, x]) => x !== undefined)
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([k, x]) => `${JSON.stringify(k)}:${canonical(x)}`)
          .join(',')}}`
      : JSON.stringify(v);

export const newIdempotencyKey = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;

/**
 * Una Idempotency-Key por "intención de envío": reintentar el MISMO contenido (doble toque, red caída)
 * reutiliza la key y el backend no duplica; cambiar el contenido genera una key nueva (si no, sería 409).
 * Tras un éxito se llama a `done()` para que la próxima alta use otra key.
 */
export function useIdempotencyKey() {
  const last = useRef<{ fingerprint: string; key: string } | null>(null);
  return {
    keyFor(payload: unknown): string {
      const fingerprint = canonical(payload);
      if (last.current?.fingerprint !== fingerprint) last.current = { fingerprint, key: newIdempotencyKey() };
      return last.current.key;
    },
    done() {
      last.current = null;
    },
  };
}
