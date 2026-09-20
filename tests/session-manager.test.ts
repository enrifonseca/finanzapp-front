import { AuthError, MemoryTokenStorage, SessionManager } from '@/core-react';
import { installFakeApi, json, tokens } from './helpers/fake-api';

const BASE = 'http://api.test';
let fake: ReturnType<typeof installFakeApi>;
afterEach(() => fake?.restore());

describe('SessionManager', () => {
  it('signIn guarda la sesión, notifica y signOut la borra y revoca en el servidor', async () => {
    fake = installFakeApi({
      'POST /v1/auth/exchange': async (r) => {
        expect(await r.json()).toEqual({ provider: 'GOOGLE', idToken: 'sandbox:ana' });
        return json({ ...tokens(1), isNewUser: true });
      },
      'POST /v1/auth/logout': (r) => {
        expect(r.headers.get('authorization')).toBe('Bearer access-1');
        return new Response(null, { status: 204 });
      },
    });
    const storage = new MemoryTokenStorage();
    const m = new SessionManager(BASE, storage);
    const seen: string[] = [];
    m.subscribe(() => seen.push(m.getStatus()));
    await m.signIn('GOOGLE', 'sandbox:ana');
    expect(m.getStatus()).toBe('signedIn');
    expect((await storage.get())?.refreshToken).toBe('refresh-1');
    await m.signOut();
    expect(m.getStatus()).toBe('signedOut');
    expect(await storage.get()).toBeNull();
    expect(fake.calls).toEqual(['POST /v1/auth/exchange', 'POST /v1/auth/logout']);
    expect(seen).toEqual(['signedIn', 'signedOut']);
  });

  it('mapea 401, 501 y caída de red a AuthError tipados', async () => {
    fake = installFakeApi({ 'POST /v1/auth/exchange': () => json({ code: 'UNAUTHENTICATED' }, 401) });
    await expect(new SessionManager(BASE, new MemoryTokenStorage()).signIn('GOOGLE', 'x')).rejects.toMatchObject({ kind: 'invalid-credentials' });
    fake.restore();
    fake = installFakeApi({ 'POST /v1/auth/exchange': () => json({ code: 'NOT_IMPLEMENTED' }, 501) });
    await expect(new SessionManager(BASE, new MemoryTokenStorage()).signIn('APPLE', 'x')).rejects.toMatchObject({ kind: 'not-configured' });
    fake.restore();
    fake = installFakeApi({
      'POST /v1/auth/exchange': () => {
        throw new TypeError('Network request failed');
      },
    });
    const err = await new SessionManager(BASE, new MemoryTokenStorage()).signIn('GOOGLE', 'x').catch((e) => e);
    expect(err).toBeInstanceOf(AuthError);
    expect(err.kind).toBe('network');
  });

  it('refresh es single-flight: dos llamadas simultáneas hacen un solo request', async () => {
    let n = 0;
    fake = installFakeApi({
      'POST /v1/auth/exchange': () => json(tokens(1)),
      'POST /v1/auth/refresh': async () => {
        n++;
        await new Promise((r) => setTimeout(r, 20));
        return json(tokens(2));
      },
    });
    const m = new SessionManager(BASE, new MemoryTokenStorage());
    await m.signIn('GOOGLE', 'sandbox:a');
    const [a, b] = await Promise.all([m.refresh(), m.refresh()]);
    expect([a, b, n]).toEqual([true, true, 1]);
    expect(m.getAccessToken()).toBe('access-2');
  });

  it('si el refresh es rechazado (401) se cierra la sesión y se limpia el almacenamiento', async () => {
    fake = installFakeApi({ 'POST /v1/auth/exchange': () => json(tokens(1)), 'POST /v1/auth/refresh': () => json({ code: 'UNAUTHENTICATED' }, 401) });
    const storage = new MemoryTokenStorage();
    const m = new SessionManager(BASE, storage);
    await m.signIn('GOOGLE', 'sandbox:a');
    expect(await m.refresh()).toBe(false);
    expect(m.getStatus()).toBe('signedOut');
    expect(await storage.get()).toBeNull();
  });

  it('un corte de red durante el refresh NO desloguea', async () => {
    fake = installFakeApi({
      'POST /v1/auth/exchange': () => json(tokens(1)),
      'POST /v1/auth/refresh': () => {
        throw new TypeError('offline');
      },
    });
    const m = new SessionManager(BASE, new MemoryTokenStorage());
    await m.signIn('GOOGLE', 'sandbox:a');
    expect(await m.refresh()).toBe(false);
    expect(m.getStatus()).toBe('signedIn');
  });

  it('init: sin sesión guardada => signedOut; con access vigente => signedIn sin llamar al servidor; vencido => refresca', async () => {
    fake = installFakeApi({ 'POST /v1/auth/refresh': () => json(tokens(9)) });
    const empty = new SessionManager(BASE, new MemoryTokenStorage());
    await empty.init();
    expect(empty.getStatus()).toBe('signedOut');

    const now = 1_000_000;
    const fresh = new MemoryTokenStorage();
    await fresh.set({ accessToken: 'a', refreshToken: 'r', accessExpiresAt: now + 600_000 });
    const m1 = new SessionManager(BASE, fresh, () => now);
    await m1.init();
    expect([m1.getStatus(), fake.calls.length]).toEqual(['signedIn', 0]);

    const stale = new MemoryTokenStorage();
    await stale.set({ accessToken: 'a', refreshToken: 'r', accessExpiresAt: now - 1 });
    const m2 = new SessionManager(BASE, stale, () => now);
    await m2.init();
    expect(m2.getAccessToken()).toBe('access-9');
  });
});
