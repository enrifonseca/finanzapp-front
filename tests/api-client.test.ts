import { MemoryTokenStorage, SessionManager, createApiClient } from '@/core-react';
import { ME, installFakeApi, json, tokens } from './helpers/fake-api';

const BASE = 'http://api.test';
let fake: ReturnType<typeof installFakeApi>;
afterEach(() => fake?.restore());

async function signedInManager() {
  const m = new SessionManager(BASE, new MemoryTokenStorage());
  await m.signIn('GOOGLE', 'sandbox:a');
  return m;
}

describe('cliente API autenticado', () => {
  it('agrega el Bearer a las rutas protegidas', async () => {
    let auth: string | null = null;
    fake = installFakeApi({
      'POST /v1/auth/exchange': () => json(tokens(1)),
      'GET /v1/me': (r) => {
        auth = r.headers.get('authorization');
        return json(ME);
      },
    });
    const m = await signedInManager();
    const { data } = await createApiClient(BASE, m).GET('/v1/me');
    expect(auth).toBe('Bearer access-1');
    expect(data?.locale).toBe('es-AR');
  });

  it('ante 401 renueva la sesión UNA vez y reintenta con el token nuevo', async () => {
    const seen: (string | null)[] = [];
    fake = installFakeApi({
      'POST /v1/auth/exchange': () => json(tokens(1)),
      'POST /v1/auth/refresh': () => json(tokens(2)),
      'GET /v1/me': (r) => {
        seen.push(r.headers.get('authorization'));
        return r.headers.get('authorization') === 'Bearer access-2' ? json(ME) : json({ code: 'UNAUTHENTICATED' }, 401);
      },
    });
    const m = await signedInManager();
    const { data, response } = await createApiClient(BASE, m).GET('/v1/me');
    expect(response.status).toBe(200);
    expect(data?.id).toBe('u1');
    expect(seen).toEqual(['Bearer access-1', 'Bearer access-2']);
    expect(fake.calls.filter((c) => c === 'POST /v1/auth/refresh')).toHaveLength(1);
  });

  it('reintenta también requests con body (POST) sin perderlo', async () => {
    const bodies: unknown[] = [];
    fake = installFakeApi({
      'POST /v1/auth/exchange': () => json(tokens(1)),
      'POST /v1/auth/refresh': () => json(tokens(2)),
      'POST /v1/banks': async (r) => {
        bodies.push(await r.json());
        return r.headers.get('authorization') === 'Bearer access-2' ? json({ id: 'b1' }, 201) : json({ code: 'UNAUTHENTICATED' }, 401);
      },
    });
    const m = await signedInManager();
    const res = await createApiClient(BASE, m).POST('/v1/banks', { body: { name: 'BBVA' } });
    expect(res.response.status).toBe(201);
    expect(bodies).toEqual([{ name: 'BBVA' }, { name: 'BBVA' }]);
  });

  it('si el refresh falla devuelve el 401 original y la sesión queda cerrada; no reintenta en bucle', async () => {
    fake = installFakeApi({
      'POST /v1/auth/exchange': () => json(tokens(1)),
      'POST /v1/auth/refresh': () => json({ code: 'UNAUTHENTICATED' }, 401),
      'GET /v1/me': () => json({ code: 'UNAUTHENTICATED' }, 401),
    });
    const m = await signedInManager();
    const { response } = await createApiClient(BASE, m).GET('/v1/me');
    expect(response.status).toBe(401);
    expect(m.getStatus()).toBe('signedOut');
    expect(fake.calls.filter((c) => c === 'GET /v1/me')).toHaveLength(1);
  });

  it('las rutas /v1/auth/* no llevan Bearer ni disparan refresh', async () => {
    let auth: string | null = 'x';
    fake = installFakeApi({ 'POST /v1/auth/refresh': (r) => ((auth = r.headers.get('authorization')), json({ code: 'UNAUTHENTICATED' }, 401)) });
    const m = new SessionManager(BASE, new MemoryTokenStorage());
    const res = await createApiClient(BASE, m).POST('/v1/auth/refresh', { body: { refreshToken: 'r' } });
    expect(res.response.status).toBe(401);
    expect(auth).toBeNull();
    expect(fake.calls).toEqual(['POST /v1/auth/refresh']);
  });
});
