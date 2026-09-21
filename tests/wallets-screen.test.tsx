import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { WalletsScreen } from '@/app/wallets/WalletsScreen';
import { ME, installFakeApi, json } from './helpers/fake-api';
import { VALID_SESSION, renderWithProviders } from './render';
import { routerMock } from './setup';

let fake: ReturnType<typeof installFakeApi>;
afterEach(async () => {
  await cleanup();
  fake?.restore();
  jest.clearAllMocks();
});

const wallet = (over: object) => ({ id: 'w', name: 'EFT', type: 'CASH', bankId: null, bankName: null, locationText: 'Casa', status: 'ACTIVE', currencies: ['ARS'], creditProfile: null, balances: [{ currency: 'ARS', status: 'unknown', observedDelta: '0.00' }], version: 1, ...over });

describe('WalletsScreen', () => {
  it('estado vacío con acción para crear la primera billetera', async () => {
    fake = installFakeApi({ 'GET /v1/me': () => json(ME), 'GET /v1/wallets': () => json({ items: [], nextCursor: null }) });
    await renderWithProviders(<WalletsScreen />, { session: VALID_SESSION });
    await screen.findByText('Todavía no tenés billeteras');
    fireEvent.press(screen.getByText('Crear billetera'));
    expect(routerMock.push).toHaveBeenCalledWith('/wallet-new');
  });

  it('lista cada billetera: el saldo desconocido dice "sin saldo inicial" (nunca 0) y el crédito no inventa fechas', async () => {
    fake = installFakeApi({
      'GET /v1/me': () => json(ME),
      'GET /v1/wallets': () =>
        json({
          items: [
            wallet({ id: 'a', name: 'EFT' }),
            wallet({ id: 'b', name: 'BBVA Master', type: 'CREDIT', bankName: 'BBVA', locationText: null, currencies: ['ARS', 'USD'], balances: [{ currency: 'ARS', status: 'unknown', observedDelta: '0.00' }, { currency: 'USD', status: 'unknown', observedDelta: '0.00' }], creditProfile: { billingMode: 'VARIABLE_PER_PERIOD', setupStatus: 'PARTIAL' } }),
          ],
          nextCursor: null,
        }),
    });
    await renderWithProviders(<WalletsScreen />, { session: VALID_SESSION });
    await screen.findByText('BBVA Master');
    expect(screen.getByText('Efectivo · Casa')).toBeTruthy();
    expect(screen.getByText('Crédito · BBVA')).toBeTruthy();
    expect(screen.getAllByText('sin saldo inicial')).toHaveLength(3);
    expect(screen.getByText(/variables por período · períodos sin configurar/)).toBeTruthy();
    expect(screen.queryByText(/\b0[.,]00\b/)).toBeNull();
  });

  it('error de carga con reintento', async () => {
    fake = installFakeApi({ 'GET /v1/me': () => json(ME), 'GET /v1/wallets': () => json({ code: 'INTERNAL_ERROR' }, 500) });
    await renderWithProviders(<WalletsScreen />, { session: VALID_SESSION });
    await screen.findByText('No se pudieron cargar las billeteras.');
    await waitFor(() => expect(screen.getByText('Reintentar billeteras')).toBeTruthy());
  });
});
