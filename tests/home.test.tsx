import { screen, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '@/app/home/HomeScreen';
import { ME, installFakeApi, json } from './helpers/fake-api';
import { VALID_SESSION, renderWithProviders, TEST_API } from './render';

let fake: ReturnType<typeof installFakeApi>;
afterEach(() => fake?.restore());

const ready = (status: number) => () => json(status === 200 ? { status: 'ok' } : { code: 'INTERNAL_ERROR' }, status);

describe('HomeScreen: estado de conexión con el backend', () => {
  it('muestra "Conectado" cuando /health/ready responde 200 y consulta la URL correcta', async () => {
    fake = installFakeApi({ 'GET /health/ready': ready(200), 'GET /v1/me': () => json(ME) });
    await renderWithProviders(<HomeScreen />, { session: VALID_SESSION });
    await waitFor(() => expect(screen.getByText('Conectado')).toBeTruthy());
    expect(fake.calls).toContain('GET /health/ready');
    expect(TEST_API).toBe('http://api.test');
  });

  it('muestra "Sin conexión" cuando el backend responde 503', async () => {
    fake = installFakeApi({ 'GET /health/ready': ready(503), 'GET /v1/me': () => json(ME) });
    await renderWithProviders(<HomeScreen />, { session: VALID_SESSION });
    await waitFor(() => expect(screen.getByText('Sin conexión con el backend')).toBeTruthy());
  });

  it('muestra "Sin conexión" cuando la red falla', async () => {
    fake = installFakeApi({
      'GET /health/ready': () => {
        throw new TypeError('Network request failed');
      },
      'GET /v1/me': () => json(ME),
    });
    await renderWithProviders(<HomeScreen />, { session: VALID_SESSION });
    await waitFor(() => expect(screen.getByText('Sin conexión con el backend')).toBeTruthy());
  });
});

describe('HomeScreen: tu cuenta (GET /v1/me)', () => {
  it('muestra el perfil sin inventar datos: moneda "sin definir" y primer uso pendiente', async () => {
    fake = installFakeApi({ 'GET /health/ready': ready(200), 'GET /v1/me': () => json(ME) });
    await renderWithProviders(<HomeScreen />, { session: VALID_SESSION });
    await waitFor(() => expect(screen.getByText('Idioma: es-AR')).toBeTruthy());
    expect(screen.getByText('Moneda preferida: sin definir')).toBeTruthy();
    expect(screen.getByText('Primer uso: pendiente (sin billeteras)')).toBeTruthy();
  });

  it('si /v1/me falla muestra error con reintento', async () => {
    fake = installFakeApi({ 'GET /health/ready': ready(200), 'GET /v1/me': () => json({ code: 'INTERNAL_ERROR' }, 500) });
    await renderWithProviders(<HomeScreen />, { session: VALID_SESSION });
    await waitFor(() => expect(screen.getByText('No se pudo cargar tu perfil.')).toBeTruthy());
    expect(screen.getByText('Reintentar perfil')).toBeTruthy();
  });
});
