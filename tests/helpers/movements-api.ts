import { ME, installFakeApi, json, type Handler } from './fake-api';

export const WALLET = (over: object = {}) => ({
  id: 'w-eft', name: 'EFT', type: 'CASH', bankId: null, bankName: null, locationText: null, status: 'ACTIVE', currencies: ['ARS'],
  creditProfile: null, balances: [{ currency: 'ARS', status: 'unknown', observedDelta: '0.00' }], version: 1, ...over,
});

export const OP = (over: object = {}) => ({
  id: 'op1', family: 'EXPENSE', kind: 'INCURRED_EXPENSE', categoryId: 'cat-tax', categoryName: 'Impuestos', concept: 'Impuesto municipal',
  referenceId: null, referenceName: null, economicPeriod: null, note: null, state: 'CONFIRMED', recordedAt: '2026-09-19T12:00:00.000Z',
  economicComponents: [{ direction: 'EXPENSE', currency: 'ARS', amount: '14999.00', economicDate: '2026-09-19', economicPeriod: null }],
  settlements: [{ walletId: 'w-eft', walletName: 'EFT', currency: 'ARS', amount: '14999.00', effectiveDate: '2026-09-19' }],
  version: 1, ...over,
});

/** Backend falso con estado para catálogos y billeteras; captura los POST de operaciones. */
export function movementsApi(overrides: Record<string, Handler> = {}, seed: { wallets?: object[]; operations?: object[] } = {}) {
  const wallets: Array<Record<string, unknown>> = (seed.wallets ?? [WALLET()]) as never;
  const categories: Array<{ id: string; family: string; name: string; parentId: null; color: null; icon: null; active: boolean }> = [];
  const references: Array<Record<string, unknown>> = [];
  const operations = (seed.operations ?? []) as Array<Record<string, unknown>>;
  const posted: Array<{ body: any; key: string | null }> = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  const fake = installFakeApi({
    'GET /v1/me': () => json({ ...ME, onboardingCompleted: true }),
    'GET /v1/wallets': () => json({ items: wallets, nextCursor: null }),
    'POST /v1/wallets': async (r) => {
      const b = await r.json();
      const w = WALLET({ id: `w-${wallets.length + 1}`, name: b.name, type: b.type, currencies: b.currencies, balances: b.currencies.map((c: string) => ({ currency: c, status: 'unknown', observedDelta: '0.00' })) });
      wallets.push(w);
      return json(w, 201);
    },
    'GET /v1/currencies': () => json({ items: ['ARS', 'USD'].map((code) => ({ code, displayName: code, minorUnitDigits: 2, enabled: true, isDefault: code === 'ARS' })) }),
    'GET /v1/banks': () => json({ items: [], nextCursor: null }),
    'GET /v1/categories': (r) => json({ items: categories.filter((c) => c.family === new URL(r.url).searchParams.get('family')), nextCursor: null }),
    'POST /v1/categories': async (r) => {
      const b = await r.json();
      const c = { id: `cat-${categories.length + 1}`, family: b.family, name: b.name, parentId: null, color: null, icon: null, active: true };
      categories.push(c);
      return json(c, 201);
    },
    'GET /v1/references': () => json({ items: references, nextCursor: null }),
    'POST /v1/references': async (r) => {
      const b = await r.json();
      const ref = { id: `ref-${references.length + 1}`, kind: b.kind, displayName: b.displayName, externalCodeText: b.externalCodeText ?? null, description: null, active: true };
      references.push(ref);
      return json(ref, 201);
    },
    'GET /v1/operations': () => json({ items: operations, nextCursor: null }),
    'POST /v1/operations': async (r) => {
      const body = await r.json();
      posted.push({ body, key: r.headers.get('idempotency-key') });
      const op = OP({ id: `op-new-${posted.length}`, concept: body.concept, family: body.family });
      operations.unshift(op);
      return json(op, 201);
    },
    ...overrides,
  });
  return { fake, posted, wallets, categories, references, operations };
}
