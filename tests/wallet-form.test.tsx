import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { WalletForm } from '@/app/wallets/WalletForm';
import { ME, installFakeApi, json, type Handler } from './helpers/fake-api';
import { VALID_SESSION, renderWithProviders } from './render';

let fake: ReturnType<typeof installFakeApi>;
afterEach(async () => {
  await cleanup();
  fake?.restore();
});

const BASE_CURRENCIES = [
  { code: 'ARS', displayName: 'Peso argentino', minorUnitDigits: 2, enabled: true, isDefault: true },
  { code: 'USD', displayName: 'Dólar', minorUnitDigits: 2, enabled: true, isDefault: false },
  { code: 'EUR', displayName: 'Euro', minorUnitDigits: 2, enabled: false, isDefault: false },
];
const WALLET = { id: 'w1', name: 'EFT', type: 'CASH', bankId: null, bankName: null, locationText: null, status: 'ACTIVE', currencies: ['ARS'], creditProfile: null, balances: [{ currency: 'ARS', status: 'unknown' }], version: 1 };

function api(overrides: Record<string, Handler> = {}) {
  const currencies = BASE_CURRENCIES.map((c) => ({ ...c }));
  const banks: Array<{ id: string; name: string; countryCode: null; active: boolean }> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posted: Array<{ body: any; key: string | null }> = [];
  fake = installFakeApi({
    'GET /v1/me': () => json(ME),
    'GET /v1/currencies': () => json({ items: currencies }),
    'POST /v1/currencies': async (r) => {
      const { code } = await r.json();
      const c = currencies.find((x) => x.code === code)!;
      c.enabled = true;
      return json(c);
    },
    'GET /v1/banks': () => json({ items: banks, nextCursor: null }),
    'POST /v1/banks': async (r) => {
      const { name } = await r.json();
      const b = { id: `bank-${banks.length + 1}`, name, countryCode: null, active: true };
      banks.push(b);
      return json({ ...b, possibleDuplicateIds: [] }, 201);
    },
    'POST /v1/wallets': async (r) => {
      posted.push({ body: await r.json(), key: r.headers.get('idempotency-key') });
      return json(WALLET, 201);
    },
    ...overrides,
  });
  return { posted, banks };
}

const setup = async () => {
  const created: unknown[] = [];
  await renderWithProviders(<WalletForm onCreated={(w) => created.push(w)} />, { session: VALID_SESSION });
  await screen.findByLabelText('Moneda ARS');
  return created;
};
const press = async (label: string) => fireEvent.press(await screen.findByLabelText(label));
const type = async (label: string, text: string) => fireEvent.changeText(await screen.findByLabelText(label), text);
const submit = async () => fireEvent.press(screen.getByText('Crear billetera'));

describe('WalletForm: validación por tipo (FLUJO-001 §4)', () => {
  it('muestra solo los campos inválidos y no llama al backend', async () => {
    const { posted } = api();
    await setup();
    await submit();
    await waitFor(() => expect(screen.getByText('Ingresá un nombre')).toBeTruthy());
    expect(screen.getByText('Elegí un tipo de billetera')).toBeTruthy();
    expect(screen.getByText('Elegí al menos una moneda')).toBeTruthy();
    expect(posted).toEqual([]);
  });

  it('efectivo: ubicación opcional y sin banco ni modo de fechas', async () => {
    api();
    await setup();
    await press('Tipo Efectivo');
    expect(await screen.findByLabelText('Ubicación')).toBeTruthy();
    expect(screen.queryByLabelText('Elegir banco')).toBeNull();
    expect(screen.queryByText('¿Cómo son las fechas de cierre y vencimiento?')).toBeNull();
  });

  it('débito exige banco; crédito exige además elegir fijo/variable (sin valor por defecto)', async () => {
    const { posted } = api();
    await setup();
    await type('Nombre de la billetera', 'BBVA Master');
    await press('Tipo Crédito');
    await press('Moneda ARS');
    await submit();
    await waitFor(() => expect(screen.getByText('Elegí un banco')).toBeTruthy());
    expect(screen.getByText('Indicá si las fechas son fijas o variables')).toBeTruthy();
    expect(posted).toEqual([]);
  });
});

describe('WalletForm: alta y bodies', () => {
  it('efectivo: envía nombre, tipo, monedas y ubicación, con Idempotency-Key', async () => {
    const { posted } = api();
    const created = await setup();
    await type('Nombre de la billetera', '  EFT ');
    await press('Tipo Efectivo');
    await press('Moneda ARS');
    await type('Ubicación', 'Casa');
    await submit();
    await waitFor(() => expect(created).toHaveLength(1));
    expect(posted[0]!.body).toEqual({ name: 'EFT', type: 'CASH', currencies: ['ARS'], locationText: 'Casa' });
    expect(posted[0]!.key).toMatch(/^[A-Za-z0-9._:-]{8,128}$/);
  });

  it('crédito variable: envía creditProfile con el modo elegido y NINGUNA fecha', async () => {
    const { posted } = api();
    await setup();
    await type('Nombre de la billetera', 'Master');
    await press('Tipo Crédito');
    await press('Moneda ARS');
    await press('Moneda USD');
    await press('Elegir banco');
    fireEvent.press(await screen.findByText('+ Crear banco'));
    await type('Nombre del banco', 'BBVA');
    fireEvent.press(await screen.findByText('Crear y elegir'));
    await waitFor(() => expect(screen.getByText('BBVA')).toBeTruthy());
    await press('Fechas de cierre y vencimiento variables por período');
    await submit();
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]!.body).toEqual({
      name: 'Master', type: 'CREDIT', currencies: ['ARS', 'USD'], bankId: 'bank-1', creditProfile: { billingMode: 'VARIABLE_PER_PERIOD' },
    });
    expect(JSON.stringify(posted[0]!.body)).not.toMatch(/date|close|due/i);
  });
});

describe('WalletForm: tarjeta con día de cierre y vencimiento OPCIONALES', () => {
  const credit = async (closeDay: string, dueDay: string) => {
    const { posted } = api();
    const created = await setup();
    await type('Nombre de la billetera', 'Master');
    await press('Tipo Crédito');
    await press('Moneda ARS');
    await press('Elegir banco');
    fireEvent.press(await screen.findByText('+ Crear banco'));
    await type('Nombre del banco', 'BBVA');
    fireEvent.press(await screen.findByText('Crear y elegir'));
    await waitFor(() => expect(screen.getByLabelText('Elegir banco')).toHaveTextContent('BBVA', { exact: false }));
    await press('Fechas de cierre y vencimiento fijas');
    if (closeDay) await type('Día de cierre', closeDay);
    if (dueDay) await type('Día de vencimiento', dueDay);
    await submit();
    return { posted, created };
  };

  it('se pueden dejar vacíos: la tarjeta se crea igual, sin días (las compras quedarán sin período)', async () => {
    const { posted, created } = await credit('', '');
    await waitFor(() => expect(created).toHaveLength(1));
    expect(posted[0]!.body.creditProfile).toEqual({ billingMode: 'FIXED_PATTERN' });
  });

  it('con días, se envían como números', async () => {
    const { posted, created } = await credit('20', '5');
    await waitFor(() => expect(created).toHaveLength(1));
    expect(posted[0]!.body.creditProfile).toEqual({ billingMode: 'FIXED_PATTERN', nominalCloseDay: 20, nominalDueDay: 5 });
  });

  it('valida 1 a 31 sin llamar al backend', async () => {
    const { posted } = await credit('32', '0');
    await waitFor(() => expect(screen.getAllByText('Día entre 1 y 31').length).toBeGreaterThan(0));
    expect(posted).toEqual([]);
  });
});

describe('WalletForm: creación contextual sin perder el borrador', () => {
  it('crear un banco desde el selector deja el nombre y el tipo ya ingresados y selecciona el banco', async () => {
    api();
    await setup();
    await type('Nombre de la billetera', 'Mi débito');
    await press('Tipo Débito');
    await press('Elegir banco');
    fireEvent.press(await screen.findByText('+ Crear banco'));
    await type('Nombre del banco', 'Galicia');
    fireEvent.press(await screen.findByText('Crear y elegir'));
    await waitFor(() => expect(screen.getByLabelText('Elegir banco')).toHaveTextContent('Galicia', { exact: false }));
    expect(screen.getByLabelText('Nombre de la billetera').props.value).toBe('Mi débito');
    expect(screen.getByLabelText('Tipo Débito')).toBeTruthy();
  });

  it('habilitar una moneda del catálogo en contexto la agrega y la selecciona', async () => {
    const { posted } = api();
    await setup();
    await type('Nombre de la billetera', 'Euros');
    await press('Tipo Efectivo');
    await press('Agregar moneda');
    fireEvent.press(await screen.findByText('EUR · Euro'));
    await screen.findByLabelText('Moneda EUR'); // aparece como chip habilitado
    expect(screen.getByLabelText('Nombre de la billetera').props.value).toBe('Euros'); // el borrador sigue
    await submit();
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]!.body.currencies).toEqual(['EUR']); // quedó seleccionada automáticamente
  });
});

describe('WalletForm: errores y reintentos', () => {
  it('mapea fieldErrors del servidor al campo correspondiente', async () => {
    api({ 'POST /v1/wallets': () => json({ code: 'WALLET_CURRENCY_NOT_ALLOWED', message: 'x', fieldErrors: { currencies: 'Monedas no habilitadas: USD' }, requestId: 'r' }, 422) });
    await setup();
    await type('Nombre de la billetera', 'W');
    await press('Tipo Efectivo');
    await press('Moneda ARS');
    await submit();
    await waitFor(() => expect(screen.getByText('Monedas no habilitadas: USD')).toBeTruthy());
  });

  it('corte de red: conserva el borrador y el reintento del MISMO contenido reutiliza la Idempotency-Key', async () => {
    const keys: Array<string | null> = [];
    let calls = 0;
    api({
      'POST /v1/wallets': async (r) => {
        keys.push(r.headers.get('idempotency-key'));
        if (++calls === 1) throw new TypeError('Network request failed');
        return json(WALLET, 201);
      },
    });
    const created = await setup();
    await type('Nombre de la billetera', 'Reintento');
    await press('Tipo Efectivo');
    await press('Moneda ARS');
    await submit();
    await waitFor(() => expect(screen.getByText(/Tu borrador se conserva/)).toBeTruthy());
    expect(screen.getByLabelText('Nombre de la billetera').props.value).toBe('Reintento');
    await submit();
    await waitFor(() => expect(created).toHaveLength(1));
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
  });

  it('si cambia el contenido tras un fallo, usa una key NUEVA (con la vieja sería 409)', async () => {
    const keys: Array<string | null> = [];
    api({
      'POST /v1/wallets': async (r) => {
        keys.push(r.headers.get('idempotency-key'));
        return json({ code: 'INTERNAL_ERROR', message: 'boom', requestId: 'r' }, 500);
      },
    });
    await setup();
    await type('Nombre de la billetera', 'Uno');
    await press('Tipo Efectivo');
    await press('Moneda ARS');
    await submit();
    await waitFor(() => expect(keys).toHaveLength(1));
    await type('Nombre de la billetera', 'Dos');
    await submit();
    await waitFor(() => expect(keys).toHaveLength(2));
    expect(keys[0]).not.toBe(keys[1]);
  });
});
