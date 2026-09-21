import { divideDecimal, parseDecimal, previewInstallments, subDecimal } from '@/core-react';

describe('previewInstallments: interés = cantidad × cuota − precio (decimales exactos)', () => {
  it('el ejemplo del dueño: 100 en 3 cuotas de 40 => interés 20 (20 %), total 120', () => {
    expect(previewInstallments('100', 3, '40')).toEqual({ principal: '100', interest: '20', totalPaid: '120', percent: '20.00' });
  });
  it('sin interés y con decimales', () => {
    expect(previewInstallments('90000.00', 3, '30000.00')).toMatchObject({ interest: '0.00', totalPaid: '90000.00', percent: '0.00' });
    expect(previewInstallments('3.00', 2, '2.00')).toMatchObject({ interest: '1.00', percent: '33.33' });
    expect(previewInstallments('0.1', 3, '0.1')).toMatchObject({ interest: '0.2' }); // 0.1×3 − 0.1: sin error de float
  });
  it('null si faltan datos o las cuotas suman menos que el precio', () => {
    expect(previewInstallments('100', 3, '30')).toBeNull();
    expect(previewInstallments('', 3, '30')).toBeNull();
    expect(previewInstallments('100', 0, '40')).toBeNull();
    expect(previewInstallments('100', 3, '0')).toBeNull();
    expect(previewInstallments('100', 3, 'abc')).toBeNull();
  });
  it('acepta coma decimal', () => {
    expect(previewInstallments('100,50', 2, '60')).toMatchObject({ interest: '19.50' });
  });
});

describe('cotización implícita', () => {
  it('(pagado − impuestos) / deuda cancelada, a 4 decimales', () => {
    const net = subDecimal(parseDecimal('590000')!, parseDecimal('98000')!);
    expect(divideDecimal(net, parseDecimal('400')!, 4)).toBe('1230.0000');
    expect(divideDecimal(parseDecimal('1')!, parseDecimal('3')!, 4)).toBe('0.3333');
    expect(divideDecimal(parseDecimal('1')!, parseDecimal('0')!, 4)).toBeNull();
  });
});
