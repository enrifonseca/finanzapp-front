import { dayMonth, formatDate, formatMoney, formatPeriod, formatSigned, parseDate, parsePeriod } from '@/core-react';

describe('formatMoney (es-AR, sin float)', () => {
  it('agrupa miles con punto y decimales con coma, con símbolo de la moneda', () => {
    expect(formatMoney('14999.00', 'ARS')).toBe('$ 14.999,00');
    expect(formatMoney('1200.00', 'USD')).toBe('US$ 1.200,00');
    expect(formatMoney('1234567.89', 'EUR')).toBe('€ 1.234.567,89');
    expect(formatMoney('999', 'ARS')).toBe('$ 999');
    expect(formatMoney('0.50', 'ARS')).toBe('$ 0,50');
  });
  it('monedas sin decimales y sin símbolo conocido', () => {
    expect(formatMoney('1000', 'JPY')).toBe('¥ 1.000');
    expect(formatMoney('10.00', 'XYZ')).toBe('XYZ 10,00');
  });
  it('negativos con signo menos', () => {
    expect(formatMoney('-13299.00', 'ARS')).toBe('−$ 13.299,00');
  });
  it('no altera importes gigantes (más allá de 2^53) ni inventa decimales', () => {
    expect(formatMoney('9007199254740993.01', 'ARS')).toBe('$ 9.007.199.254.740.993,01');
    expect(formatMoney('10.1', 'ARS')).toBe('$ 10,1');
  });
  it('un valor que no es decimal se devuelve tal cual', () => {
    expect(formatMoney('abc', 'ARS')).toBe('abc ARS');
  });
  it('signo según familia', () => {
    expect(formatSigned('1700.00', 'ARS', 'INCOME')).toBe('+$ 1.700,00');
    expect(formatSigned('14999.00', 'ARS', 'EXPENSE')).toBe('−$ 14.999,00');
    expect(formatSigned('-14999.00', 'ARS', 'EXPENSE')).toBe('−$ 14.999,00');
  });
});

describe('fechas DD/MM/YYYY', () => {
  it('formatea y parsea ida y vuelta', () => {
    expect(formatDate('2026-09-19')).toBe('19/09/2026');
    expect(parseDate('19/09/2026')).toBe('2026-09-19');
    expect(parseDate('1/9/2026')).toBe('2026-09-01');
  });
  it('rechaza fechas inexistentes y formatos ISO', () => {
    for (const bad of ['31/02/2026', '2026-09-19', '19-09-2026', '00/01/2026', '', '32/01/2026']) expect(parseDate(bad)).toBeNull();
    expect(parseDate('29/02/2028')).toBe('2028-02-29');
  });
  it('período MM/YYYY', () => {
    expect(formatPeriod('2026-08')).toBe('08/2026');
    expect(parsePeriod('8/2026')).toBe('2026-08');
    expect(parsePeriod('13/2026')).toBeNull();
    expect(parsePeriod('2026-08')).toBeNull();
  });
  it('bloque día/mes para listas', () => {
    expect(dayMonth('2026-09-19')).toEqual({ day: '19', month: 'SEP' });
  });
});
