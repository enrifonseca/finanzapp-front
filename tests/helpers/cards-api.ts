import { json, type Handler } from './fake-api';
import { WALLET, movementsApi } from './movements-api';

export const CARD_WALLET = (over: object = {}) =>
  WALLET({
    id: 'w-card', name: 'BBVA Master', type: 'CREDIT', bankId: 'b1', bankName: 'BBVA', currencies: ['ARS', 'USD'],
    creditProfile: { billingMode: 'FIXED_PATTERN', setupStatus: 'PARTIAL', nominalCloseDay: 20, nominalDueDay: 5 },
    balances: [{ currency: 'ARS', status: 'unknown', observedDelta: '0.00' }, { currency: 'USD', status: 'unknown', observedDelta: '0.00' }], ...over,
  });

export const PROFILE = (over: object = {}) => ({ walletId: 'w-card', billingMode: 'FIXED_PATTERN', setupStatus: 'PARTIAL', nominalCloseDay: 20, nominalDueDay: 5, ...over });

export const PERIOD = (over: object = {}) => ({
  id: 'p1', walletId: 'w-card', cycleLabel: '2026-09', openDate: '2026-08-21', closeDate: '2026-09-20', dueDate: '2026-10-05', dateConfidence: 'ESTIMATED', version: 1, ...over,
});

export const LINE = (over: object = {}) => ({
  currency: 'ARS',
  installments: [{ id: 'i1', purchaseId: 'pu1', operationId: 'op1', concept: 'Heladera', number: 1, count: 3, amount: '30000.00', purchaseDate: '2026-09-10' }],
  charges: [], computedTotal: '30000.00', bankTotal: null, adjustment: null, amountDue: '30000.00', paid: '0.00', outstanding: '30000.00', ...over,
});

export const OVERVIEW = (over: object = {}) => ({ periods: [{ period: PERIOD(), currencies: [LINE()] }], unassigned: [], ...over });

/** Backend falso de tarjetas: captura las escrituras (con su Idempotency-Key) y devuelve el resumen configurado. */
export function cardsApi(seed: { overview?: object; profile?: object } = {}, extra: Record<string, Handler> = {}) {
  const writes: Array<{ route: string; body: any; key: string | null }> = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  const record = (route: string, respond: (b: any) => Response): Handler => async (r) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const body = r.headers.get('content-type')?.includes('json') ? await r.json() : undefined;
    writes.push({ route, body, key: r.headers.get('idempotency-key') });
    return respond(body);
  };
  const ctx = movementsApi(
    {
      'GET /v1/cards/w-card/profile': () => json(seed.profile ?? PROFILE()),
      'GET /v1/cards/w-card/periods': () => json(seed.overview ?? OVERVIEW()),
      'PATCH /v1/cards/w-card/profile': record('profile', (b) => json(PROFILE(b))),
      'PATCH /v1/cards/w-card/periods/p1': record('period', (b) => json(PERIOD({ ...b, dateConfidence: 'CONFIRMED', version: 2 }))),
      'PUT /v1/cards/w-card/periods/p1/bank-totals/ARS': record('bankTotal', () => json({})),
      'POST /v1/cards/w-card/periods': record('createPeriod', (b) => json(PERIOD({ ...b, id: 'p-new' }), 201)),
      'POST /v1/cards/w-card/periods/p1/charges': record('charge', () => json({ id: 'op-ch' }, 201)),
      'POST /v1/cards/w-card/periods/p1/payments': record('pay', () => json({ id: 'op-pay' }, 201)),
      'POST /v1/cards/w-card/installments/i1/move': record('move', () => json(OVERVIEW())),
      'POST /v1/cards/w-card/purchases': record('purchase', (b) => json({ id: 'op-buy', concept: b.concept, family: 'EXPENSE' }, 201)),
      ...extra,
    },
    { wallets: [WALLET(), WALLET({ id: 'w-usd', name: 'USD EFT', currencies: ['USD'] }), CARD_WALLET()] },
  );
  return { ...ctx, writes };
}
