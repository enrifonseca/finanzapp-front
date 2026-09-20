/** Backend falso por rutas ("METHOD /path"): registra las llamadas y responde JSON. */
export type Handler = (req: Request) => Response | Promise<Response>;

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export function installFakeApi(routes: Record<string, Handler>) {
  const calls: string[] = [];
  const original = global.fetch;
  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(String(input), init);
    const key = `${req.method} ${new URL(req.url).pathname}`;
    calls.push(key);
    const h = routes[key];
    if (!h) return json({ code: 'NOT_FOUND_OR_NOT_OWNED', message: 'sin ruta', requestId: 'x' }, 404);
    return h(req);
  }) as typeof fetch;
  return { calls, restore: () => void (global.fetch = original) };
}

export const tokens = (n: number) => ({ accessToken: `access-${n}`, refreshToken: `refresh-${n}`, tokenType: 'Bearer', expiresIn: 900 });
export const ME = { id: 'u1', locale: 'es-AR', timezone: 'America/Argentina/Buenos_Aires', preferredCurrencyCode: null, onboardingCompleted: false };
