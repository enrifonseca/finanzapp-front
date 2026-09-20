import { addDecimal, formatDecimal, isZero, normalizeAmount, parseDecimal } from '@/core-react';
import { sumByCurrency } from '@/app/movements/MovementForm';

describe('aritmética decimal exacta (sin float)', () => {
  it('parsea punto o coma y rechaza formatos ambiguos', () => {
    expect(normalizeAmount('14999,50')).toBe('14999.50');
    expect(normalizeAmount('  1700 ')).toBe('1700');
    for (const bad of ['', '-5', '1.700,50', '1e3', 'abc', '1,2,3', '.5']) expect(normalizeAmount(bad)).toBeNull();
  });
  it('0.1 + 0.2 = 0.3 exacto', () => {
    expect(formatDecimal(addDecimal(parseDecimal('0.1')!, parseDecimal('0.2')!))).toBe('0.3');
  });
  it('reconoce el cero en cualquier escala', () => {
    expect(isZero(parseDecimal('0.00')!)).toBe(true);
    expect(isZero(parseDecimal('0.01')!)).toBe(false);
  });
  it('suma por moneda sin mezclar monedas (una operación de N monedas = N sumas)', () => {
    expect(sumByCurrency([{ currency: 'ARS', amount: '1000.10' }, { currency: 'USD', amount: '1200' }, { currency: 'ARS', amount: '699,90' }])).toEqual([
      ['ARS', '1700.00'],
      ['USD', '1200'],
    ]);
  });
  it('importes grandes no pierden precisión (más allá de 2^53)', () => {
    expect(formatDecimal(addDecimal(parseDecimal('9007199254740993.01')!, parseDecimal('0.01')!))).toBe('9007199254740993.02');
  });
});
