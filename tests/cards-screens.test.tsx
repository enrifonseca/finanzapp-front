import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { CardDetailScreen, debtByCurrency } from '@/app/cards/CardDetailScreen';
import { StatementScreen } from '@/app/cards/StatementScreen';
import { CARD_WALLET, LINE, OVERVIEW, PERIOD, PROFILE, cardsApi } from './helpers/cards-api';
import { json } from './helpers/fake-api';
import { VALID_SESSION, renderWithProviders } from './render';
import { routerMock } from './setup';

let ctx: ReturnType<typeof cardsApi>;
afterEach(async () => {
  await cleanup();
  ctx?.fake.restore();
  routerMock.params = {};
  jest.clearAllMocks();
});

const press = async (label: string) => fireEvent.press(await screen.findByLabelText(label));
const type = async (label: string, v: string) => fireEvent.changeText(await screen.findByLabelText(label), v);
const openStatement = async (api = cardsApi()) => {
  ctx = api;
  routerMock.params = { id: 'w-card', periodId: 'p1' };
  await renderWithProviders(<StatementScreen />, { session: VALID_SESSION });
  await screen.findByText('Deuda en ARS');
};

describe('CardDetailScreen', () => {
  it('muestra la deuda por moneda (resúmenes + cuotas sin asignar), sin mezclar monedas', async () => {
    const o = OVERVIEW({
      periods: [{ period: PERIOD(), currencies: [LINE(), LINE({ currency: 'USD', outstanding: '50.00', installments: [], computedTotal: '50.00', amountDue: '50.00' })] }],
      unassigned: [{ id: 'u1', purchaseId: 'pu2', operationId: 'op2', concept: 'Sin fecha', number: 2, count: 3, amount: '10000.00', purchaseDate: '2026-09-10', currency: 'ARS' }],
    });
    expect(debtByCurrency(o as never)).toEqual([['ARS', '40000.00'], ['USD', '50.00']]);
    ctx = cardsApi({ overview: o });
    routerMock.params = { id: 'w-card' };
    await renderWithProviders(<CardDetailScreen />, { session: VALID_SESSION });
    await screen.findByText('$ 40.000,00');
    expect(screen.getByText('US$ 50,00')).toBeTruthy();
    expect(screen.getByText(/Cuota 2\/3 · compra del 10\/09\/2026/)).toBeTruthy();
    expect(screen.getByText('Vence 05/10/2026')).toBeTruthy();
    expect(screen.getByText('Estimado')).toBeTruthy();
  });

  it('sin días de cierre/vencimiento avisa que las compras quedan sin período (no inventa fechas)', async () => {
    ctx = cardsApi({ profile: PROFILE({ nominalCloseDay: null, nominalDueDay: null }), overview: OVERVIEW({ periods: [] }) });
    routerMock.params = { id: 'w-card' };
    await renderWithProviders(<CardDetailScreen />, { session: VALID_SESSION });
    await screen.findByText('Día de cierre: sin cargar');
    expect(screen.getByText(/período y vencimiento desconocidos/)).toBeTruthy();
    expect(screen.getByText('Todavía no hay resúmenes.')).toBeTruthy();
  });

  it('editar los días: son opcionales y se envían como números o null', async () => {
    ctx = cardsApi();
    routerMock.params = { id: 'w-card' };
    await renderWithProviders(<CardDetailScreen />, { session: VALID_SESSION });
    fireEvent.press(await screen.findByText('Editar días'));
    await type('Día de cierre', '25');
    await type('Día de vencimiento', '');
    fireEvent.press(await screen.findByText('Guardar'));
    await waitFor(() => expect(ctx.writes.find((w) => w.route === 'profile')).toBeTruthy());
    expect(ctx.writes.find((w) => w.route === 'profile')!.body).toEqual({ nominalCloseDay: 25, nominalDueDay: null });
  });

  it('cargar un período nuevo con fechas DD/MM/AAAA y enviarlas en ISO', async () => {
    ctx = cardsApi();
    routerMock.params = { id: 'w-card' };
    await renderWithProviders(<CardDetailScreen />, { session: VALID_SESSION });
    fireEvent.press(await screen.findByText('Cargar un período'));
    await type('Cierre', '23/10/2026');
    await type('Vencimiento', '09/11/2026');
    fireEvent.press(await screen.findByText('Guardar'));
    await waitFor(() => expect(ctx.writes.find((w) => w.route === 'createPeriod')).toBeTruthy());
    expect(ctx.writes.find((w) => w.route === 'createPeriod')!.body).toEqual({ closeDate: '2026-10-23', dueDate: '2026-11-09' });
  });
});

describe('StatementScreen: correcciones antes de pagar', () => {
  it('muestra total calculado, a pagar, pagado y saldo, con cuotas y cargos; las fechas estimadas se indican', async () => {
    await openStatement();
    expect(screen.getByText('Estimadas')).toBeTruthy();
    expect(screen.getByText('Cierre: 20/09/2026')).toBeTruthy();
    expect(screen.getByText('Total calculado')).toBeTruthy();
    expect(screen.getAllByText('$ 30.000,00').length).toBeGreaterThan(0);
    expect(screen.getByText('Heladera')).toBeTruthy();
    expect(screen.getByText('Cuota 1/3 · compra del 10/09/2026')).toBeTruthy();
  });

  it('total del banco: la diferencia queda visible (ajuste) y se envía el importe normalizado', async () => {
    await openStatement(cardsApi({ overview: OVERVIEW({ periods: [{ period: PERIOD(), currencies: [LINE({ bankTotal: '31000.00', adjustment: '1000.00', amountDue: '31000.00', outstanding: '31000.00' })] }] }) }));
    expect(screen.getByText('Ajuste (banco − calculado)')).toBeTruthy();
    expect(screen.getByText('$ 1.000,00')).toBeTruthy();
    fireEvent.press(screen.getAllByText('Total del banco').at(-1)!); // el último es el botón (el primero es la fila del resumen)
    await type('Total informado por el banco', '31.500,50'.replace('.', ''));
    fireEvent.press(await screen.findByText('Guardar'));
    await waitFor(() => expect(ctx.writes.find((w) => w.route === 'bankTotal')).toBeTruthy());
    expect(ctx.writes.find((w) => w.route === 'bankTotal')!.body).toEqual({ bankTotal: '31500.50' });
  });

  it('total del banco vacío vuelve al calculado (null)', async () => {
    await openStatement();
    fireEvent.press(screen.getByText('Total del banco'));
    fireEvent.press(await screen.findByText('Guardar'));
    await waitFor(() => expect(ctx.writes.find((w) => w.route === 'bankTotal')).toBeTruthy());
    expect(ctx.writes.find((w) => w.route === 'bankTotal')!.body).toEqual({ bankTotal: null });
  });

  it('agregar cargo (multa/refinanciación): envía tipo, importe, fecha ISO e Idempotency-Key', async () => {
    await openStatement();
    fireEvent.press(screen.getByText('Agregar cargo (interés, multa, impuesto)'));
    await press('Cargo Multa / refinanciación');
    await type('Importe del cargo', '2500');
    await type('Fecha del cargo', '10/10/2026');
    fireEvent.press(await screen.findByText('Agregar cargo'));
    await waitFor(() => expect(ctx.writes.find((w) => w.route === 'charge')).toBeTruthy());
    const w = ctx.writes.find((x) => x.route === 'charge')!;
    expect(w.body).toEqual({ kind: 'PENALTY', currency: 'ARS', amount: '2500', date: '2026-10-10' });
    expect(w.key).toMatch(/^[A-Za-z0-9._:-]{8,128}$/);
  });

  it('valida el cargo sin llamar al backend', async () => {
    await openStatement();
    fireEvent.press(screen.getByText('Agregar cargo (interés, multa, impuesto)'));
    fireEvent.press(await screen.findByText('Agregar cargo'));
    await waitFor(() => expect(screen.getByText('Ingresá un importe mayor que cero')).toBeTruthy());
    expect(ctx.writes).toEqual([]);
  });

  it('corregir fechas: DD/MM/AAAA -> ISO con la versión para el control de concurrencia', async () => {
    await openStatement();
    fireEvent.press(screen.getByText('Corregir fechas'));
    await type('Cierre', '24/09/2026');
    await type('Vencimiento', '08/10/2026');
    fireEvent.press(await screen.findByText('Guardar'));
    await waitFor(() => expect(ctx.writes.find((w) => w.route === 'period')).toBeTruthy());
    expect(ctx.writes.find((w) => w.route === 'period')!.body).toEqual({ openDate: '2026-08-21', closeDate: '2026-09-24', dueDate: '2026-10-08', expectedVersion: 1 });
  });

  it('mover una cuota a "Sin asignar" u otro resumen', async () => {
    const o = OVERVIEW({ periods: [{ period: PERIOD(), currencies: [LINE()] }, { period: PERIOD({ id: 'p2', cycleLabel: '2026-10', closeDate: '2026-10-20' }), currencies: [] }] });
    await openStatement(cardsApi({ overview: o }));
    fireEvent.press(screen.getByLabelText('Cuota Heladera 1'));
    await press('Destino Sin asignar');
    fireEvent.press(await screen.findByText('Mover'));
    await waitFor(() => expect(ctx.writes.find((w) => w.route === 'move')).toBeTruthy());
    expect(ctx.writes.find((w) => w.route === 'move')!.body).toEqual({ periodId: null });
    expect(screen.queryByLabelText('Destino Resumen 2026-09 · cierra 20/09/2026')).toBeNull(); // no se ofrece el mismo resumen
  });
});

describe('StatementScreen: pago parcial y USD con pesos', () => {
  it('pago parcial: la deuda que se cancela es editable y sale de una billetera de efectivo/débito', async () => {
    await openStatement();
    fireEvent.press(screen.getByText('Pagar'));
    await press('Origen EFT');
    await type('Deuda que cancelás (ARS)', '10000');
    await type('Total que sale de la billetera (ARS)', '10000');
    await type('Fecha del pago', '05/10/2026');
    fireEvent.press((await screen.findAllByText('Pagar')).at(-1)!);
    await waitFor(() => expect(ctx.writes.find((w) => w.route === 'pay')).toBeTruthy());
    const w = ctx.writes.find((x) => x.route === 'pay')!;
    expect(w.body).toEqual({ currency: 'ARS', appliedAmount: '10000', walletId: 'w-eft', walletCurrency: 'ARS', walletAmount: '10000', effectiveDate: '2026-10-05' });
    expect(w.key).toBeTruthy();
  });

  it('las tarjetas no se ofrecen como origen del pago', async () => {
    await openStatement();
    fireEvent.press(screen.getByText('Pagar'));
    await screen.findByLabelText('Origen EFT');
    expect(screen.queryByLabelText('Origen BBVA Master')).toBeNull();
  });

  it('deuda en USD pagada con pesos: cotización implícita en vivo, impuestos aparte y envío correcto', async () => {
    const o = OVERVIEW({ periods: [{ period: PERIOD(), currencies: [LINE({ currency: 'USD', computedTotal: '1000.00', amountDue: '1000.00', outstanding: '1000.00' })] }] });
    ctx = cardsApi({ overview: o }, { 'POST /v1/cards/w-card/periods/p1/payments': async (r) => (ctx.writes.push({ route: 'pay', body: await r.json(), key: r.headers.get('idempotency-key') }), json({ id: 'op' }, 201)) });
    routerMock.params = { id: 'w-card', periodId: 'p1' };
    await renderWithProviders(<StatementScreen />, { session: VALID_SESSION });
    await screen.findByText('Deuda en USD');
    fireEvent.press(screen.getByText('Pagar'));
    await press('Origen EFT'); // EFT solo admite ARS => paga en pesos
    await type('Deuda que cancelás (USD)', '400');
    await type('Total que sale de la billetera (ARS)', '590000');
    await type('Impuestos incluidos, si hubo (ARS)', '98000');
    await waitFor(() => expect(screen.getByLabelText('Cotización implícita')).toHaveTextContent('$ 1.230,0000 por USD', { exact: false }));
    expect(screen.getByText(/El monto exacto se conoce al pagar/)).toBeTruthy();
    fireEvent.press((await screen.findAllByText('Pagar')).at(-1)!);
    await waitFor(() => expect(ctx.writes.find((w) => w.route === 'pay')).toBeTruthy());
    expect(ctx.writes.find((w) => w.route === 'pay')!.body).toMatchObject({ currency: 'USD', appliedAmount: '400', walletCurrency: 'ARS', walletAmount: '590000', taxAmount: '98000' });
  });

  it('si el pago supera el saldo, el diálogo queda abierto con el error y el borrador', async () => {
    ctx = cardsApi({}, { 'POST /v1/cards/w-card/periods/p1/payments': () => json({ code: 'DUE_OVERALLOCATED', message: 'x', fieldErrors: { appliedAmount: 'El saldo pendiente es 30000.00' }, requestId: 'r' }, 422) });
    routerMock.params = { id: 'w-card', periodId: 'p1' };
    await renderWithProviders(<StatementScreen />, { session: VALID_SESSION });
    await screen.findByText('Deuda en ARS');
    fireEvent.press(screen.getByText('Pagar'));
    await press('Origen EFT');
    await type('Deuda que cancelás (ARS)', '99999');
    await type('Total que sale de la billetera (ARS)', '99999');
    fireEvent.press((await screen.findAllByText('Pagar')).at(-1)!);
    await waitFor(() => expect(screen.getAllByText('El saldo pendiente es 30000.00').length).toBeGreaterThan(0));
    expect(screen.getByLabelText('Deuda que cancelás (ARS)').props.value).toBe('99999');
  });

  it('sin saldo pendiente el botón Pagar queda deshabilitado', async () => {
    await openStatement(cardsApi({ overview: OVERVIEW({ periods: [{ period: PERIOD(), currencies: [LINE({ paid: '30000.00', outstanding: '0.00' })] }] }) }));
    expect(screen.getByText('Pagar')).toBeTruthy();
    expect(CARD_WALLET().type).toBe('CREDIT');
  });
});
