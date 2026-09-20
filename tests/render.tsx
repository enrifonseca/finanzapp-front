import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { MemoryTokenStorage, type StoredSession, type TokenStorage } from '@/core-react';
import { AppProviders } from '@/kernel';

export const TEST_API = 'http://api.test';

export async function renderWithProviders(ui: ReactElement, opts: { storage?: TokenStorage; session?: StoredSession; authSandbox?: boolean } = {}) {
  const storage = opts.storage ?? new MemoryTokenStorage();
  if (opts.session) await storage.set(opts.session);
  return await render(
    <AppProviders baseUrl={TEST_API} storage={storage} authSandbox={opts.authSandbox ?? false}>
      {ui}
    </AppProviders>,
  );
}

export const VALID_SESSION: StoredSession = { accessToken: 'access-1', refreshToken: 'refresh-1', accessExpiresAt: Date.now() + 10 * 60_000 };
