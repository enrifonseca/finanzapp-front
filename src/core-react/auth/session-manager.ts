import createClient from 'openapi-fetch';
import type { paths } from '../api/schema';
import type { StoredSession, TokenStorage } from './token-storage';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';
export type Provider = 'GOOGLE' | 'APPLE';

export class AuthError extends Error {
  constructor(
    readonly kind: 'invalid-credentials' | 'not-configured' | 'network' | 'unknown',
    message: string,
  ) {
    super(message);
  }
}

/**
 * Sesión del usuario, independiente de React: guarda tokens, renueva con single-flight
 * (dos requests con 401 a la vez generan un solo refresh) y notifica cambios.
 */
export class SessionManager {
  private session: StoredSession | null = null;
  private status: SessionStatus = 'loading';
  private refreshing: Promise<boolean> | null = null;
  private listeners = new Set<() => void>();
  // Cliente SIN middleware: los endpoints /v1/auth/* no llevan Bearer ni reintentan.
  private readonly bare;

  constructor(
    baseUrl: string,
    private readonly storage: TokenStorage,
    private readonly now: () => number = Date.now,
    fetchImpl: typeof fetch = (...a) => fetch(...a),
  ) {
    this.bare = createClient<paths>({ baseUrl, fetch: (req) => fetchImpl(req) });
  }

  getStatus = (): SessionStatus => this.status;
  getAccessToken(): string | null {
    return this.session?.accessToken ?? null;
  }
  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => void this.listeners.delete(cb);
  };

  /** Carga la sesión guardada; si el access venció intenta renovarla. */
  async init(): Promise<void> {
    const stored = await this.storage.get();
    if (!stored) return this.set(null);
    this.session = stored;
    if (stored.accessExpiresAt - 5_000 <= this.now()) await this.refresh();
    else this.set(stored);
  }

  async signIn(provider: Provider, idToken: string, nonce?: string): Promise<void> {
    let res;
    try {
      res = await this.bare.POST('/v1/auth/exchange', { body: { provider, idToken, ...(nonce ? { nonce } : {}) } });
    } catch {
      throw new AuthError('network', 'No se pudo conectar con el servidor');
    }
    if (res.response.status === 401) throw new AuthError('invalid-credentials', 'La identidad no pudo verificarse');
    if (res.response.status === 501) throw new AuthError('not-configured', 'Este método de acceso no está configurado en el servidor');
    if (!res.data) throw new AuthError('unknown', `Error inesperado (${res.response.status})`);
    await this.adopt(res.data);
  }

  /** Renueva tokens. Devuelve false (y cierra sesión) si el refresh es inválido o reutilizado. */
  refresh(): Promise<boolean> {
    this.refreshing ??= this.doRefresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  async signOut(): Promise<void> {
    const token = this.session?.accessToken;
    this.set(null);
    await this.storage.clear();
    if (token) {
      // Best-effort: revoca en servidor; si falla, la sesión local ya se borró.
      try {
        await this.bare.POST('/v1/auth/logout', { headers: { authorization: `Bearer ${token}` } });
      } catch {
        /* sin red: el token vence solo */
      }
    }
  }

  private async doRefresh(): Promise<boolean> {
    const current = this.session;
    if (!current) return false;
    try {
      const res = await this.bare.POST('/v1/auth/refresh', { body: { refreshToken: current.refreshToken } });
      if (res.data) {
        await this.adopt(res.data);
        return true;
      }
      if (res.response.status === 401) await this.expire();
      return false;
    } catch {
      // Sin red: se conserva la sesión para reintentar más tarde; no se desloguea por un corte.
      if (this.status === 'loading') this.set(current);
      return false;
    }
  }

  private async adopt(data: { accessToken: string; refreshToken: string; expiresIn: number }): Promise<void> {
    const s: StoredSession = { accessToken: data.accessToken, refreshToken: data.refreshToken, accessExpiresAt: this.now() + data.expiresIn * 1000 };
    await this.storage.set(s);
    this.set(s);
  }

  private async expire(): Promise<void> {
    await this.storage.clear();
    this.set(null);
  }

  private set(s: StoredSession | null): void {
    this.session = s;
    this.status = s ? 'signedIn' : 'signedOut';
    this.listeners.forEach((l) => l());
  }
}
