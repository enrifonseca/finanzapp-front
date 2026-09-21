import { addDecimal, formatDecimal, isZero, parseDecimal, type Dec } from './decimal';

export interface InstallmentPreview {
  readonly principal: string;
  readonly interest: string;
  readonly totalPaid: string;
  /** interés / precio, en % con 2 decimales. */
  readonly percent: string;
}

const mul = (d: Dec, n: number): Dec => ({ units: d.units * BigInt(n), scale: d.scale });
const sub = (a: Dec, b: Dec): Dec => {
  const scale = Math.max(a.scale, b.scale);
  const ra = a.units * 10n ** BigInt(scale - a.scale);
  const rb = b.units * 10n ** BigInt(scale - b.scale);
  return { units: ra - rb, scale };
};

/**
 * Vista previa del interés de una compra en cuotas: cantidad × cuota − precio (decimales exactos, sin float).
 * Devuelve null si falta algún dato o si las cuotas suman menos que el precio (el backend también lo rechaza).
 */
export function previewInstallments(price: string, count: number, installment: string): InstallmentPreview | null {
  const p = parseDecimal(price);
  const c = parseDecimal(installment);
  if (!p || !c || isZero(p) || isZero(c) || !Number.isInteger(count) || count < 1) return null;
  const total = mul(c, count);
  const interest = sub(total, p);
  if (interest.units < 0n) return null;
  // porcentaje = interés / precio * 100, con 2 decimales (mitad hacia arriba)
  const scale = Math.max(interest.scale, p.scale);
  const i = interest.units * 10n ** BigInt(scale - interest.scale);
  const q = p.units * 10n ** BigInt(scale - p.scale);
  const hundredths = (i * 10000n * 2n + q) / (q * 2n);
  const percent = `${hundredths / 100n}.${String(hundredths % 100n).padStart(2, '0')}`;
  return { principal: formatDecimal(p), interest: formatDecimal(interest), totalPaid: formatDecimal(addDecimal(p, interest)), percent };
}
