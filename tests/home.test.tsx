import { screen, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '@/app/home/HomeScreen';
import { renderWithProviders, TEST_API } from './render';

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
});

const mockFetch = (impl: () => Promise<Response>) => {
  global.fetch = jest.fn(impl) as unknown as typeof fetch;
};

describe('HomeScreen: estado de conexión con el backend', () => {
  it('muestra "Conectado" cuando /health/ready responde 200 y consulta la URL correcta', async () => {
    mockFetch(async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByText('Verificando…')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Conectado')).toBeTruthy());
    const req = (global.fetch as jest.Mock).mock.calls[0][0] as Request;
    expect(req.url).toBe(`${TEST_API}/health/ready`);
  });

  it('muestra "Sin conexión" cuando el backend responde 503', async () => {
    mockFetch(async () => new Response(JSON.stringify({ code: 'INTERNAL_ERROR' }), { status: 503, headers: { 'content-type': 'application/json' } }));
    await renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByText('Sin conexión con el backend')).toBeTruthy());
  });

  it('muestra "Sin conexión" cuando la red falla', async () => {
    mockFetch(async () => {
      throw new TypeError('Network request failed');
    });
    await renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByText('Sin conexión con el backend')).toBeTruthy());
  });
});
