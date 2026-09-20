import { cleanup, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { MemoryTokenStorage, useMe, useSession } from '@/core-react';
import { ME, installFakeApi, json, tokens } from './helpers/fake-api';
import { renderWithProviders } from './render';

let fake: ReturnType<typeof installFakeApi>;
afterEach(async () => {
  await cleanup();
  fake?.restore();
});

function Probe() {
  const { status, signIn } = useSession();
  const me = useMe();
  return (
    <>
      <Text>{`status:${status}`}</Text>
      <Text>{`me:${me.isPending ? 'pending' : me.isError ? 'error' : me.data?.locale}`}</Text>
      <Text onPress={() => void signIn('GOOGLE', 'sandbox:ana')}>entrar</Text>
    </>
  );
}

describe('useMe', () => {
  it('sin sesión NO llama a /v1/me; tras iniciar sesión lo consulta y no queda un error cacheado (regresión: 401 previo al login)', async () => {
    fake = installFakeApi({ 'POST /v1/auth/exchange': () => json(tokens(1)), 'GET /v1/me': (r) => (r.headers.get('authorization') ? json(ME) : json({ code: 'UNAUTHENTICATED' }, 401)) });
    await renderWithProviders(<Probe />, { storage: new MemoryTokenStorage() });
    await screen.findByText('status:signedOut');
    expect(fake.calls).not.toContain('GET /v1/me');
    (await screen.findByText('entrar')).props.onPress();
    await waitFor(() => expect(screen.getByText('me:es-AR')).toBeTruthy());
    expect(fake.calls.filter((c) => c === 'GET /v1/me')).toHaveLength(1);
  });
});
