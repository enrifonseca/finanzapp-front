import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { MovementForm } from '@/app/movements/MovementForm';
import { json } from './helpers/fake-api';
import { OP, WALLET, movementsApi } from './helpers/movements-api';
import { VALID_SESSION, renderWithProviders } from './render';

let ctx: ReturnType<typeof movementsApi>;
afterEach(async () => {
  await cleanup();
  ctx?.fake.restore();
});

const setup = async (api = movementsApi(), draft = {}) => {
  ctx = api;
  const created: unknown[] = [];
  await renderWithProviders(<MovementForm draft={draft} onCreated={(o) => created.push(o)} />, { session: VALID_SESSION });
  await screen.findByLabelText('Familia Egreso');
  return created;
};
const press = async (label: string) => fireEvent.press(await screen.findByLabelText(label));
const text = async (label: string, value: string) => fireEvent.changeText(await screen.findByLabelText(label), value);
const submit = async () => fireEvent.press(screen.getByText('Confirmar movimiento'));
const pickWallet = async (line: number, name: string) => {
  await press(`Elegir billetera línea ${line}`);
  fireEvent.press(await screen.findByText(name));
};

describe('MovementForm: siempre empieza por familia', () => {
  it('sin familia no muestra el resto; validar vacío marca familia, concepto, billetera e importe', async () => {
    await setup();
    expect(screen.queryByLabelText('Concepto')).toBeNull();
    await submit();
    await waitFor(() => expect(screen.getByText('Elegí Ingreso o Egreso')).toBeTruthy());
  });

  it('con familia muestra los campos y valida lo obligatorio sin llamar al backend', async () => {
    await setup();
    await press('Familia Egreso');
    await submit();
    await waitFor(() => expect(screen.getByText('Ingresá un concepto')).toBeTruthy());
    expect(screen.getByText('Elegí una billetera')).toBeTruthy();
    expect(screen.getByText('Ingresá un importe mayor que cero')).toBeTruthy();
    expect(ctx.posted).toEqual([]);
  });
});

describe('MovementForm: impuesto municipal (E2E-03)', () => {
  it('categoría creada EN CONTEXTO, un gasto y un pago; envía economía y caja por separado', async () => {
    const created = await setup();
    await press('Familia Egreso');
    await press('Elegir categoría');
    fireEvent.press(await screen.findByText('+ Crear categoría'));
    await text('Nombre de la categoría', 'Impuestos');
    fireEvent.press(await screen.findByText('Crear y elegir'));
    await waitFor(() => expect(screen.getByLabelText('Elegir categoría')).toHaveTextContent('Impuestos', { exact: false }));
    await text('Concepto', 'Impuesto municipal');
    await pickWallet(1, 'EFT');
    await text('Importe línea 1', '14999,00');
    await submit();
    await waitFor(() => expect(created).toHaveLength(1));
    const { body, key } = ctx.posted[0]!;
    expect(body).toMatchObject({ family: 'EXPENSE', concept: 'Impuesto municipal', categoryId: 'cat-1' });
    expect(body.economicComponents).toEqual([{ currency: 'ARS', amount: '14999.00', economicDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }]);
    expect(body.settlements).toEqual([{ walletId: 'w-eft', currency: 'ARS', amount: '14999.00', effectiveDate: body.economicComponents[0].economicDate }]);
    expect(key).toMatch(/^[A-Za-z0-9._:-]{8,128}$/);
  });

  it('referencia creada en contexto con código conservado tal cual', async () => {
    await setup();
    await press('Familia Egreso');
    await press('Elegir referencia');
    fireEvent.press(await screen.findByText('+ Agregar cuenta o cliente'));
    await text('Nombre de la referencia', 'Dpto 0027');
    await text('Código de la referencia', 'xxxxx00027');
    fireEvent.press(await screen.findByText('Crear y elegir'));
    await waitFor(() => expect(screen.getByLabelText('Elegir referencia')).toHaveTextContent('Dpto 0027', { exact: false }));
    expect(ctx.references[0]).toMatchObject({ displayName: 'Dpto 0027', externalCodeText: 'xxxxx00027' });
  });
});

describe('MovementForm: sueldo multimoneda (E2E-02)', () => {
  it('cobrar USD sin billetera USD: crea la billetera EN CONTEXTO y vuelve con las líneas previas intactas', async () => {
    const created = await setup();
    await press('Familia Ingreso');
    await text('Concepto', 'Sueldo agosto');
    await text('Período', '08/2026');
    await pickWallet(1, 'EFT');
    await text('Importe línea 1', '1700');
    await press('Agregar línea');
    await press('Elegir billetera línea 2');
    fireEvent.press(await screen.findByText('+ Crear billetera'));
    await text('Nombre de la billetera', 'USD EFT');
    await press('Tipo Efectivo');
    await press('Moneda USD');
    fireEvent.press(await screen.findByText('Crear billetera'));
    await waitFor(() => expect(screen.getByLabelText('Elegir billetera línea 2')).toHaveTextContent('USD EFT', { exact: false }));
    // las líneas y el borrador anteriores siguen ahí
    expect(screen.getByLabelText('Importe línea 1').props.value).toBe('1700');
    expect(screen.getByLabelText('Concepto').props.value).toBe('Sueldo agosto');
    expect(screen.getByLabelText('Elegir billetera línea 1')).toHaveTextContent('EFT', { exact: false });
    await text('Importe línea 2', '1200');
    expect(screen.getByLabelText('Totales por moneda')).toHaveTextContent('$ 1.700 · US$ 1.200', { exact: false });
    await submit();
    await waitFor(() => expect(created).toHaveLength(1));
    const body = ctx.posted[0]!.body;
    expect(body).toMatchObject({ family: 'INCOME', economicPeriod: '2026-08' });
    expect(body.economicComponents).toEqual([{ currency: 'ARS', amount: '1700' }, { currency: 'USD', amount: '1200' }]);
    expect(body.economicComponents.every((c: { economicDate?: string }) => c.economicDate === undefined)).toBe(true); // "ganado" sin fecha inventada
    expect(body.settlements.map((s: { currency: string }) => s.currency)).toEqual(['ARS', 'USD']);
  });

  it('la fecha se ve y se escribe DD/MM/AAAA pero la API recibe ISO; el período MM/AAAA viaja como AAAA-MM', async () => {
    await setup();
    await press('Familia Ingreso');
    await text('Concepto', 'Sueldo');
    await text('Período', '08/2026');
    await pickWallet(1, 'EFT');
    await text('Importe línea 1', '100');
    expect((screen.getByLabelText('Fecha').props.value as string)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    await text('Fecha', '07/09/2026');
    await submit();
    await waitFor(() => expect(ctx.posted).toHaveLength(1));
    expect(ctx.posted[0]!.body.settlements[0].effectiveDate).toBe('2026-09-07');
    expect(ctx.posted[0]!.body.economicPeriod).toBe('2026-08');
  });

  it('una fecha ISO o inexistente se rechaza con mensaje', async () => {
    await setup();
    await press('Familia Egreso');
    await text('Fecha', '2026-09-07');
    await submit();
    await waitFor(() => expect(screen.getByText('Fecha inválida (DD/MM/AAAA)')).toBeTruthy());
    await text('Fecha', '31/02/2026');
    await submit();
    await waitFor(() => expect(screen.getByText('Fecha inválida (DD/MM/AAAA)')).toBeTruthy());
    expect(ctx.posted).toEqual([]);
  });

  it('dos líneas de la misma moneda se suman en UN componente económico', async () => {
    const api = movementsApi({}, { wallets: [WALLET(), WALLET({ id: 'w-2', name: 'EFT 2' })] });
    await setup(api);
    await press('Familia Egreso');
    await text('Concepto', 'Compra dividida');
    await pickWallet(1, 'EFT');
    await text('Importe línea 1', '600');
    await press('Agregar línea');
    await pickWallet(2, 'EFT 2');
    await text('Importe línea 2', '400,50');
    await submit();
    await waitFor(() => expect(ctx.posted).toHaveLength(1));
    expect(ctx.posted[0]!.body.economicComponents).toEqual([expect.objectContaining({ currency: 'ARS', amount: '1000.50' })]);
    expect(ctx.posted[0]!.body.settlements).toHaveLength(2);
  });

  it('el crédito no se ofrece como billetera de cobro/pago', async () => {
    const api = movementsApi({}, { wallets: [WALLET(), WALLET({ id: 'w-cc', name: 'BBVA Master', type: 'CREDIT', bankId: 'b', bankName: 'BBVA' })] });
    await setup(api);
    await press('Familia Egreso');
    await press('Elegir billetera línea 1');
    await screen.findByText('EFT');
    expect(screen.queryByText('BBVA Master')).toBeNull();
  });
});

describe('MovementForm: errores y reintentos', () => {
  it('un habitual precarga familia y concepto pero todo sigue editable', async () => {
    await setup(movementsApi(), { family: 'EXPENSE', concept: 'Impuesto municipal' });
    expect(screen.getByLabelText('Concepto').props.value).toBe('Impuesto municipal');
    await text('Concepto', 'Otro concepto');
    expect(screen.getByLabelText('Concepto').props.value).toBe('Otro concepto');
  });

  it('cobro que no iguala el importe: el mensaje del servidor se muestra completo', async () => {
    const api = movementsApi({ 'POST /v1/operations': () => json({ code: 'SETTLEMENT_MISMATCH', message: 'x', fieldErrors: { settlements: 'En ARS el cobro/pago debe igualar el importe' }, requestId: 'r' }, 422) });
    await setup(api);
    await press('Familia Egreso');
    await text('Concepto', 'X');
    await pickWallet(1, 'EFT');
    await text('Importe línea 1', '10');
    await submit();
    await waitFor(() => expect(screen.getByText('En ARS el cobro/pago debe igualar el importe')).toBeTruthy());
  });

  it('error por línea del servidor se muestra en esa línea', async () => {
    const api = movementsApi({ 'POST /v1/operations': () => json({ code: 'WALLET_CURRENCY_NOT_ALLOWED', message: 'x', fieldErrors: { 'settlements.0.currency': 'La billetera no admite esta moneda' }, requestId: 'r' }, 422) });
    await setup(api);
    await press('Familia Egreso');
    await text('Concepto', 'X');
    await pickWallet(1, 'EFT');
    await text('Importe línea 1', '10');
    await submit();
    await waitFor(() => expect(screen.getByText('La billetera no admite esta moneda')).toBeTruthy());
  });

  it('corte de red: conserva el borrador y reintentar el MISMO contenido reutiliza la Idempotency-Key', async () => {
    const keys: Array<string | null> = [];
    let n = 0;
    const api = movementsApi({
      'POST /v1/operations': async (r) => {
        keys.push(r.headers.get('idempotency-key'));
        if (++n === 1) throw new TypeError('offline');
        return json(OP(), 201);
      },
    });
    const created = await setup(api);
    await press('Familia Egreso');
    await text('Concepto', 'Con reintento');
    await pickWallet(1, 'EFT');
    await text('Importe línea 1', '10');
    await submit();
    await waitFor(() => expect(screen.getByText(/Tu borrador se conserva/)).toBeTruthy());
    expect(screen.getByLabelText('Concepto').props.value).toBe('Con reintento');
    await submit();
    await waitFor(() => expect(created).toHaveLength(1));
    expect(keys[0]).toBe(keys[1]);
  });
});
