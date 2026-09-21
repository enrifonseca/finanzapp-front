import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { MovementForm } from '@/app/movements/MovementForm';
import { OperationDetailScreen } from '@/app/movements/OperationDetailScreen';
import { OperationRow, operationAmounts, operationNote } from '@/app/movements/OperationRow';
import { cardsApi } from './helpers/cards-api';
import { json } from './helpers/fake-api';
import { OP } from './helpers/movements-api';
import { VALID_SESSION, renderWithProviders } from './render';
import { routerMock } from './setup';

let ctx: ReturnType<typeof cardsApi>;
afterEach(async () => {
  await cleanup();
  ctx?.fake.restore();
  routerMock.params = {};
  jest.restoreAllMocks();
});

const press = async (label: string) => fireEvent.press(await screen.findByLabelText(label));
const text = async (label: string, v: string) => fireEvent.changeText(await screen.findByLabelText(label), v);
const setup = async () => {
  ctx = cardsApi();
  const created: unknown[] = [];
  await renderWithProviders(<MovementForm onCreated={(o) => created.push(o)} />, { session: VALID_SESSION });
  await screen.findByLabelText('Familia Egreso');
  return created;
};
const pickCard = async () => {
  await press('Elegir billetera línea 1');
  fireEvent.press(await screen.findByText('BBVA Master'));
  await press('Moneda ARS línea 1');
};

describe('compra con tarjeta en cuotas', () => {
  it('el crédito se ofrece para egresos pero NUNCA para ingresos', async () => {
    await setup();
    await press('Familia Ingreso');
    await press('Elegir billetera línea 1');
    await screen.findByText('EFT');
    expect(screen.queryByText('BBVA Master')).toBeNull();
    await cleanup();
    ctx.fake.restore();
    await setup();
    await press('Familia Egreso');
    await press('Elegir billetera línea 1');
    expect(await screen.findByText('BBVA Master')).toBeTruthy();
  });

  it('al elegir la tarjeta aparecen cuotas; el interés se calcula en vivo: 100 en 3 cuotas de 40 => interés 20 (20 %), total 120', async () => {
    await setup();
    await press('Familia Egreso');
    await text('Concepto', 'Producto');
    await pickCard();
    await text('Importe línea 1', '100');
    await text('Cantidad de cuotas', '3');
    await text('Monto de cada cuota', '40');
    await waitFor(() => expect(screen.getByLabelText('Resumen de cuotas')).toHaveTextContent('Precio $ 100 · Interés $ 20 (20.00 %) · Total a pagar $ 120', { exact: false }));
    expect(screen.queryByLabelText('Agregar línea')).toBeNull(); // una compra es UNA línea
  });

  it('envía la compra a /cards/{id}/purchases con precio, cantidad y monto de cada cuota (fecha ISO, Idempotency-Key)', async () => {
    const created = await setup();
    await press('Familia Egreso');
    await text('Concepto', 'Heladera');
    await pickCard();
    await text('Importe línea 1', '90000');
    await text('Cantidad de cuotas', '3');
    await text('Monto de cada cuota', '30000');
    await text('Fecha', '10/09/2026');
    fireEvent.press(screen.getByText('Confirmar movimiento'));
    await waitFor(() => expect(created).toHaveLength(1));
    const w = ctx.writes.find((x) => x.route === 'purchase')!;
    expect(w.body).toEqual({ purchaseDate: '2026-09-10', currency: 'ARS', concept: 'Heladera', price: '90000', installmentCount: 3, installmentAmount: '30000' });
    expect(w.key).toMatch(/^[A-Za-z0-9._:-]{8,128}$/);
    expect(ctx.posted).toEqual([]); // no pasa por /v1/operations
  });

  it('una sola cuota no pide monto de cuota', async () => {
    const created = await setup();
    await press('Familia Egreso');
    await text('Concepto', 'Contado');
    await pickCard();
    await text('Importe línea 1', '500');
    expect(screen.queryByLabelText('Monto de cada cuota')).toBeNull();
    fireEvent.press(screen.getByText('Confirmar movimiento'));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(ctx.writes.find((x) => x.route === 'purchase')!.body).toMatchObject({ price: '500', installmentCount: 1 });
    expect(ctx.writes.find((x) => x.route === 'purchase')!.body.installmentAmount).toBeUndefined();
  });

  it('cuotas que suman menos que el precio o cuota faltante se rechazan antes de llamar al backend', async () => {
    await setup();
    await press('Familia Egreso');
    await text('Concepto', 'X');
    await pickCard();
    await text('Importe línea 1', '100');
    await text('Cantidad de cuotas', '3');
    fireEvent.press(screen.getByText('Confirmar movimiento'));
    await waitFor(() => expect(screen.getByText('Ingresá el monto de cada cuota')).toBeTruthy());
    await text('Monto de cada cuota', '30');
    fireEvent.press(screen.getByText('Confirmar movimiento'));
    await waitFor(() => expect(screen.getByText('Las cuotas suman menos que el precio')).toBeTruthy());
    expect(ctx.writes).toEqual([]);
  });

  it('error del servidor en la compra se muestra sin perder el borrador', async () => {
    ctx = cardsApi({}, { 'POST /v1/cards/w-card/purchases': () => json({ code: 'WALLET_CURRENCY_NOT_ALLOWED', message: 'La billetera no admite esa moneda', fieldErrors: { currency: 'La billetera no admite esta moneda' }, requestId: 'r' }, 422) });
    await renderWithProviders(<MovementForm onCreated={() => undefined} />, { session: VALID_SESSION });
    await press('Familia Egreso');
    await text('Concepto', 'Borrador');
    await pickCard();
    await text('Importe línea 1', '100');
    fireEvent.press(screen.getByText('Confirmar movimiento'));
    await waitFor(() => expect(screen.getByText('La billetera no admite esta moneda')).toBeTruthy());
    expect(screen.getByLabelText('Concepto').props.value).toBe('Borrador');
  });
});

const PURCHASE = OP({
  id: 'buy', kind: 'CREDIT_CARD_PURCHASE', concept: 'Producto', categoryName: null, settlements: [],
  economicComponents: [
    { direction: 'EXPENSE', currency: 'ARS', amount: '100.00', economicDate: '2026-09-10', economicPeriod: null, subtype: null },
    { direction: 'EXPENSE', currency: 'ARS', amount: '20.00', economicDate: '2026-09-10', economicPeriod: null, subtype: 'INTEREST' },
  ],
  cardPurchase: {
    walletId: 'w-card', walletName: 'BBVA Master', purchaseDate: '2026-09-10', currency: 'ARS', principal: '100.00', interest: '20.00', totalPaid: '120.00',
    installmentCount: 3, installmentAmount: '40.00',
    installments: [
      { id: 'i1', number: 1, amount: '40.00', state: 'ACTIVE', periodId: 'p1', cycleLabel: '2026-09', closeDate: '2026-09-20', dueDate: '2026-10-05' },
      { id: 'i2', number: 2, amount: '40.00', state: 'ACTIVE', periodId: null, cycleLabel: null, closeDate: null, dueDate: null },
    ],
  },
});

describe('una compra con tarjeta en el historial y el detalle', () => {
  it('la fila muestra el PRECIO como gasto y el interés aparte (no sumados)', () => {
    expect(operationAmounts(PURCHASE as never)).toEqual(['−$ 100,00']);
    expect(operationNote(PURCHASE as never)).toBe('Interés $ 20,00');
  });

  it('un pago de resumen muestra lo que salió de la billetera (no tiene gasto propio)', () => {
    const pay = OP({ kind: 'CARD_SETTLEMENT', concept: 'Pago de resumen', economicComponents: [], settlements: [{ walletId: 'w', walletName: 'EFT', currency: 'ARS', amount: '60000.00', effectiveDate: '2026-10-05' }] });
    expect(operationAmounts(pay as never)).toEqual(['−$ 60.000,00']);
  });

  it('el detalle muestra precio, interés calculado, total a pagar y cada cuota con su resumen (o "sin resumen asignado")', async () => {
    ctx = cardsApi({}, { 'GET /v1/operations/buy': () => json(PURCHASE) });
    routerMock.params = { id: 'buy' };
    await renderWithProviders(<OperationDetailScreen />, { session: VALID_SESSION });
    await screen.findByText('Compra con tarjeta');
    expect(screen.getByText('Precio: $ 100,00')).toBeTruthy();
    expect(screen.getByText('Interés (calculado): $ 20,00')).toBeTruthy();
    expect(screen.getByText('Total a pagar: $ 120,00')).toBeTruthy();
    expect(screen.getByText('3 cuotas de $ 40,00')).toBeTruthy();
    expect(screen.getByText('Cuota 1: resumen 2026-09 · vence 05/10/2026')).toBeTruthy();
    expect(screen.getByText('Cuota 2: sin resumen asignado')).toBeTruthy();
    expect(screen.getByText('Interés: $ 20,00 · 10/09/2026')).toBeTruthy();
    expect(screen.queryByText('Pagado (caja)')).toBeNull(); // una compra con tarjeta no mueve caja
  });

  it('la fila abre el detalle', async () => {
    ctx = cardsApi();
    await renderWithProviders(<OperationRow op={PURCHASE as never} onPress={() => routerMock.push('x')} />, { session: VALID_SESSION });
    fireEvent.press(screen.getByLabelText('Operación Producto'));
    expect(routerMock.push).toHaveBeenCalled();
  });
});
