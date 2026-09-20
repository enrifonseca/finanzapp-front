import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { habitualesOf } from '@/app/movements/Habituales';
import { MovementsScreen } from '@/app/movements/MovementsScreen';
import { OperationDetailScreen } from '@/app/movements/OperationDetailScreen';
import { RecentOperations } from '@/app/movements/RecentOperations';
import { WalletCard } from '@/app/wallets/WalletCard';
import { json } from './helpers/fake-api';
import { OP, WALLET, movementsApi } from './helpers/movements-api';
import { VALID_SESSION, renderWithProviders } from './render';
import { routerMock } from './setup';

let ctx: ReturnType<typeof movementsApi>;
afterEach(async () => {
  await cleanup();
  ctx?.fake.restore();
  jest.clearAllMocks();
});

const SALARY = OP({
  id: 'op-salary', family: 'INCOME', kind: 'EARNED_INCOME', categoryName: 'Sueldo', concept: 'Sueldo agosto', economicPeriod: '2026-08',
  economicComponents: [
    { direction: 'INCOME', currency: 'ARS', amount: '1700.00', economicDate: null, economicPeriod: '2026-08' },
    { direction: 'INCOME', currency: 'USD', amount: '1200.00', economicDate: null, economicPeriod: '2026-08' },
  ],
  settlements: [
    { walletId: 'w-eft', walletName: 'EFT', currency: 'ARS', amount: '1700.00', effectiveDate: '2026-09-07' },
    { walletId: 'w-usd', walletName: 'USD EFT', currency: 'USD', amount: '1200.00', effectiveDate: '2026-09-07' },
  ],
});

describe('Últimos movimientos (Home)', () => {
  it('estado vacío honesto', async () => {
    ctx = movementsApi();
    await renderWithProviders(<RecentOperations />, { session: VALID_SESSION });
    await screen.findByText('Todavía no hay movimientos');
  });

  it('una fila por operación lógica; el sueldo multimoneda muestra cada moneda por separado (nunca sumadas)', async () => {
    ctx = movementsApi({}, { operations: [SALARY, OP()] });
    await renderWithProviders(<RecentOperations />, { session: VALID_SESSION });
    await screen.findByText('Sueldo agosto');
    expect(screen.getAllByLabelText(/^Operación /)).toHaveLength(2);
    expect(screen.getByText(/\+1700\.00 ARS · \+1200\.00 USD/)).toBeTruthy();
    expect(screen.getByText(/−14999\.00 ARS/)).toBeTruthy();
    fireEvent.press(screen.getByText('Sueldo agosto'));
    expect(routerMock.push).toHaveBeenCalledWith({ pathname: '/operation/[id]', params: { id: 'op-salary' } });
  });

  it('error con reintento', async () => {
    ctx = movementsApi({ 'GET /v1/operations': () => json({ code: 'INTERNAL_ERROR' }, 500) });
    await renderWithProviders(<RecentOperations />, { session: VALID_SESSION });
    await screen.findByText('No se pudieron cargar los movimientos.');
  });
});

describe('Habituales', () => {
  it('salen SOLO de operaciones reales, ordenadas por uso; vacío sin operaciones; ignora revertidas', () => {
    expect(habitualesOf([])).toEqual([]);
    const a = OP({ id: 'a' });
    const b = OP({ id: 'b' });
    const c = OP({ id: 'c', concept: 'Alquiler', categoryId: 'cat-rent', referenceName: 'Dpto 0027', referenceId: 'r1' });
    const reversed = OP({ id: 'd', concept: 'Fantasma', state: 'REVERSED' });
    const h = habitualesOf([a, b, c, reversed] as never);
    expect(h.map((x) => [x.label, x.count])).toEqual([['Impuesto municipal', 2], ['Alquiler · Dpto 0027', 1]]);
    expect(h[1]!.params).toMatchObject({ family: 'EXPENSE', concept: 'Alquiler', categoryId: 'cat-rent', referenceId: 'r1' });
  });
});

describe('Historial (Movimientos)', () => {
  it('lista y permite empezar un movimiento nuevo', async () => {
    ctx = movementsApi({}, { operations: [OP({ id: 'x1' })] });
    await renderWithProviders(<MovementsScreen />, { session: VALID_SESSION });
    await screen.findByText('Impuesto municipal');
    fireEvent.press(screen.getByText('Nuevo movimiento'));
    expect(routerMock.push).toHaveBeenCalledWith('/movement-new');
  });

  it('pagina por cursor con "Cargar más" sin repetir filas', async () => {
    let call = 0;
    ctx = movementsApi({
      'GET /v1/operations': (r) => {
        const cursor = new URL(r.url).searchParams.get('cursor');
        call++;
        return cursor ? json({ items: [OP({ id: 'p2', concept: 'Segunda página' })], nextCursor: null }) : json({ items: [OP({ id: 'p1', concept: 'Primera página' })], nextCursor: 'CURSOR-1' });
      },
    });
    await renderWithProviders(<MovementsScreen />, { session: VALID_SESSION });
    await screen.findByText('Primera página');
    fireEvent.press(screen.getByText('Cargar más'));
    await screen.findByText('Segunda página');
    expect(screen.getAllByLabelText(/^Operación /)).toHaveLength(2);
    expect(screen.queryByText('Cargar más')).toBeNull();
    expect(call).toBe(2);
  });
});

describe('Detalle de operación', () => {
  const setup = async (op: object, extra: Record<string, (r: Request) => Response | Promise<Response>> = {}) => {
    const { useLocalSearchParams } = jest.requireMock('expo-router');
    void useLocalSearchParams;
    ctx = movementsApi({ 'GET /v1/operations/op-x': () => json(op), ...extra } as never);
    await renderWithProviders(<OperationDetailScreen />, { session: VALID_SESSION });
  };

  it('separa lo ganado/gastado (economía) de lo cobrado/pagado (caja), cada moneda por separado', async () => {
    jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValue({ id: 'op-x' });
    await setup(SALARY);
    await screen.findByText('Sueldo agosto');
    expect(screen.getByText('Ganado (economía)')).toBeTruthy();
    expect(screen.getByText('Cobrado (caja)')).toBeTruthy();
    expect(screen.getByText('1700.00 ARS')).toBeTruthy();
    expect(screen.getByText('USD EFT: 1200.00 USD · 2026-09-07')).toBeTruthy();
    expect(screen.getByText('Período: 2026-08')).toBeTruthy();
  });

  it('revertir pide confirmación y llama al endpoint con Idempotency-Key', async () => {
    jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValue({ id: 'op-x' });
    let key: string | null = null;
    await setup(OP({ id: 'op-x' }), {
      'POST /v1/operations/op-x/reversal': (r) => ((key = r.headers.get('idempotency-key')), json(OP({ id: 'op-x', state: 'REVERSED' }))),
    });
    await screen.findByText('Revertir operación');
    fireEvent.press(screen.getByText('Revertir operación'));
    await screen.findByText('¿Revertir esta operación?');
    expect(ctx.fake.calls).not.toContain('POST /v1/operations/op-x/reversal'); // todavía no
    fireEvent.press(screen.getByText('Sí, revertir'));
    await waitFor(() => expect(ctx.fake.calls).toContain('POST /v1/operations/op-x/reversal'));
    expect(key).toMatch(/^[A-Za-z0-9._:-]{8,128}$/);
  });

  it('una operación revertida no ofrece acciones', async () => {
    jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValue({ id: 'op-x' });
    await setup(OP({ id: 'op-x', state: 'REVERSED' }));
    await screen.findAllByText('Revertida');
    expect(screen.queryByText('Revertir operación')).toBeNull();
    expect(screen.queryByText('Asociar referencia')).toBeNull();
  });
});

describe('Billeteras con movimientos', () => {
  it('muestra la variación REGISTRADA sin afirmar el saldo; sin movimientos solo "sin saldo inicial"', async () => {
    ctx = movementsApi();
    const withMoves = WALLET({ balances: [{ currency: 'ARS', status: 'unknown', observedDelta: '-13299.00' }] });
    await renderWithProviders(<WalletCard wallet={withMoves as never} />, { session: VALID_SESSION });
    expect(screen.getByText(/ARS: sin saldo inicial · movimientos registrados: -13299\.00/)).toBeTruthy();
    await cleanup();
    await renderWithProviders(<WalletCard wallet={WALLET() as never} />, { session: VALID_SESSION });
    expect(screen.getByText('ARS: sin saldo inicial')).toBeTruthy();
    expect(screen.queryByText(/movimientos registrados/)).toBeNull();
  });
});
