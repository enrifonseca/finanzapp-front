import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '@/app/auth/LoginScreen';
import { MemoryTokenStorage } from '@/core-react';
import { installFakeApi, json, tokens } from './helpers/fake-api';
import { renderWithProviders } from './render';

let fake: ReturnType<typeof installFakeApi>;
afterEach(async () => {
  await cleanup();
  fake?.restore();
});

describe('LoginScreen', () => {
  it('Google y Apple aparecen deshabilitados (sin credenciales OAuth) y el modo desarrollo está oculto por defecto', async () => {
    await renderWithProviders(<LoginScreen />);
    expect(screen.getByLabelText('Continuar con Google')).toBeDisabled();
    expect(screen.getByLabelText('Continuar con Apple')).toBeDisabled();
    expect(screen.queryByText('Entrar (modo desarrollo)')).toBeNull();
  });

  it('modo desarrollo: valida el nombre antes de llamar al backend', async () => {
    fake = installFakeApi({});
    await renderWithProviders(<LoginScreen />, { authSandbox: true });
    await fireEvent.changeText(screen.getByLabelText('Nombre de usuario de prueba'), 'nombre con espacios');
    await fireEvent.press(screen.getByText('Entrar (modo desarrollo)'));
    await waitFor(() => expect(screen.getByText(/Solo letras, números/)).toBeTruthy());
    expect(fake.calls).toEqual([]);
  });

  it('modo desarrollo: envía sandbox:<nombre> y guarda la sesión', async () => {
    let sent: unknown;
    fake = installFakeApi({ 'POST /v1/auth/exchange': async (r) => ((sent = await r.json()), json(tokens(1))) });
    const storage = new MemoryTokenStorage();
    await renderWithProviders(<LoginScreen />, { authSandbox: true, storage });
    await fireEvent.changeText(await screen.findByLabelText('Nombre de usuario de prueba'), 'ana');
    await fireEvent.press(screen.getByText('Entrar (modo desarrollo)'));
    await waitFor(async () => expect((await storage.get())?.accessToken).toBe('access-1'));
    expect(sent).toEqual({ provider: 'GOOGLE', idToken: 'sandbox:ana' });
  });

  it.each([
    [401, 'No pudimos verificar tu identidad. Probá de nuevo.'],
    [501, 'Este método de acceso no está configurado en el servidor.'],
  ])('muestra un mensaje claro ante HTTP %s', async (status, message) => {
    fake = installFakeApi({ 'POST /v1/auth/exchange': () => json({ code: 'X' }, status) });
    await renderWithProviders(<LoginScreen />, { authSandbox: true });
    await fireEvent.changeText(await screen.findByLabelText('Nombre de usuario de prueba'), 'ana');
    await fireEvent.press(screen.getByText('Entrar (modo desarrollo)'));
    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
  });

  it('muestra un mensaje de red cuando el servidor no responde', async () => {
    fake = installFakeApi({
      'POST /v1/auth/exchange': () => {
        throw new TypeError('offline');
      },
    });
    await renderWithProviders(<LoginScreen />, { authSandbox: true });
    await fireEvent.changeText(await screen.findByLabelText('Nombre de usuario de prueba'), 'ana');
    await fireEvent.press(screen.getByText('Entrar (modo desarrollo)'));
    await waitFor(() => expect(screen.getByText('No hay conexión con el servidor. Revisá tu red y reintentá.')).toBeTruthy());
  });
});
