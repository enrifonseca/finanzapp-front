/**
 * Formato de presentación (es-AR). Todo opera sobre STRINGS decimales: los importes nunca pasan por number/float.
 * Solo cambia cómo se ven; los valores que viajan a la API siguen siendo "14999.00" y "2026-09-19".
 */
const SYMBOL: Record<string, string> = {
  ARS: '$', USD: 'US$', EUR: '€', BRL: 'R$', GBP: '£', JPY: '¥', CNY: 'CN¥', CHF: 'CHF', CAD: 'CA$',
  UYU: '$U', CLP: 'CLP$', MXN: 'MX$', COP: 'COL$', PEN: 'S/', BOB: 'Bs', PYG: '₲',
};

const AMOUNT_RE = /^(-?)(\d+)(?:\.(\d+))?$/;
const MINUS = '−'; // U+2212: se distingue del guion en montos

/** "14999.00" + ARS -> "$ 14.999,00". Un valor que no sea decimal se devuelve tal cual (nunca se inventa). */
export function formatMoney(amount: string, currency: string): string {
  const m = AMOUNT_RE.exec(amount.trim());
  if (!m) return `${amount} ${currency}`;
  const [, neg, int, frac] = m;
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const symbol = SYMBOL[currency] ?? currency;
  return `${neg ? MINUS : ''}${symbol} ${grouped}${frac ? `,${frac}` : ''}`;
}

/** Con signo explícito según la familia: ingreso "+$ 1.700,00", egreso "−$ 14.999,00". */
export function formatSigned(amount: string, currency: string, family: 'INCOME' | 'EXPENSE'): string {
  const magnitude = amount.startsWith('-') ? amount.slice(1) : amount;
  const body = formatMoney(magnitude, currency);
  return `${family === 'INCOME' ? '+' : MINUS}${body}`;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-09-19" -> "19/09/2026". */
export function formatDate(iso: string): string {
  const m = ISO_DATE.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** "19/09/2026" -> "2026-09-19" (valida el calendario real); null si es inválida. */
export function parseDate(text: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** "2026-08" -> "08/2026". */
export function formatPeriod(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  return m ? `${m[2]}/${m[1]}` : period;
}

/** "08/2026" -> "2026-08"; null si es inválido. */
export function parsePeriod(text: string): string | null {
  const m = /^(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) return null;
  return `${m[2]}-${String(Number(m[1])).padStart(2, '0')}`;
}

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/** Bloque de fecha compacto para listas: { day: "19", month: "SEP" }. */
export function dayMonth(iso: string): { day: string; month: string } {
  const m = ISO_DATE.exec(iso);
  return m ? { day: m[3]!, month: MONTHS[Number(m[2]) - 1] ?? '' } : { day: '', month: '' };
}
