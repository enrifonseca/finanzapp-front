/**
 * Aritmética decimal EXACTA sobre strings (bigint interno). El front nunca convierte importes a number:
 * solo suma por moneda para mostrar totales y validar; el backend es la autoridad.
 */
const RE = /^(\d+)(?:[.,](\d+))?$/;

export interface Dec {
  readonly units: bigint;
  readonly scale: number;
}

/** Acepta coma o punto decimal (teclado local). Devuelve null si no es un decimal positivo o cero. */
export function parseDecimal(text: string): Dec | null {
  const m = RE.exec(text.trim());
  if (!m) return null;
  const frac = m[2] ?? '';
  return { units: BigInt(`${m[1]}${frac}`), scale: frac.length };
}

const rescale = (d: Dec, scale: number): bigint => d.units * 10n ** BigInt(scale - d.scale);

export function addDecimal(a: Dec, b: Dec): Dec {
  const scale = Math.max(a.scale, b.scale);
  return { units: rescale(a, scale) + rescale(b, scale), scale };
}

export const isZero = (d: Dec) => d.units === 0n;
export const decimalsOf = (d: Dec) => d.scale;

/** Forma canónica con punto: "1500" -> "1500", "1500,5" -> "1500.5". No agrega ni quita ceros significativos. */
export function formatDecimal(d: Dec): string {
  const s = d.units.toString().padStart(d.scale + 1, '0');
  return d.scale === 0 ? s : `${s.slice(0, s.length - d.scale)}.${s.slice(s.length - d.scale)}`;
}

/** Normaliza lo que tipea el usuario ("1.700,50" NO se acepta: sin separador de miles) a "1700.50"; null si es inválido. */
export function normalizeAmount(text: string): string | null {
  const d = parseDecimal(text);
  return d ? formatDecimal(d) : null;
}
