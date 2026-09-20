export interface StoredSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Epoch ms en que vence el access token. */
  readonly accessExpiresAt: number;
}

/** Almacenamiento de la sesión. El refresh token NUNCA va en AsyncStorage ni en logs. */
export interface TokenStorage {
  get(): Promise<StoredSession | null>;
  set(session: StoredSession): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryTokenStorage implements TokenStorage {
  private value: StoredSession | null = null;
  async get() {
    return this.value;
  }
  async set(session: StoredSession) {
    this.value = session;
  }
  async clear() {
    this.value = null;
  }
}
