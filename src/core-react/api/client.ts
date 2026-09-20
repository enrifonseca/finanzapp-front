import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';

/** Lo mínimo que el cliente necesita de la sesión (evita acoplar api/ con auth/). */
export interface TokenProvider {
  getAccessToken(): string | null;
  refresh(): Promise<boolean>;
}

const isAuthRoute = (url: string) => new URL(url).pathname.startsWith('/v1/auth/');

/**
 * Cliente HTTP tipado generado desde el OpenAPI del backend (nunca importa clases del backend).
 * Con `tokens`: agrega Bearer y, ante un 401, renueva la sesión una vez y reintenta la request.
 */
export function createApiClient(baseUrl: string, tokens?: TokenProvider) {
  const client = createClient<paths>({ baseUrl });
  if (tokens) {
    const originals = new WeakMap<Request, Request>();
    const mw: Middleware = {
      async onRequest({ request }) {
        if (isAuthRoute(request.url)) return request;
        const token = tokens.getAccessToken();
        if (token) request.headers.set('authorization', `Bearer ${token}`);
        originals.set(request, request.clone()); // el body se consume al enviar: se guarda una copia para reintentar
        return request;
      },
      async onResponse({ request, response }) {
        if (response.status !== 401 || isAuthRoute(request.url)) return response;
        const original = originals.get(request);
        if (!original || !(await tokens.refresh())) return response;
        const retry = new Request(original);
        retry.headers.set('authorization', `Bearer ${tokens.getAccessToken() ?? ''}`);
        return fetch(retry);
      },
    };
    client.use(mw);
  }
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
