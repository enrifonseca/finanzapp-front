import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as RN from 'react-native';
import { useTheme } from 'react-native-paper';
import { Text } from 'react-native';
import { AccountCard } from '@/app/home/AccountCard';
import { MemoryPreferences } from '@/core-react';
import { darkTheme, FONT, lightTheme, robotoTypescale } from '@/ui-system';
import { ME, installFakeApi, json } from './helpers/fake-api';
import { VALID_SESSION, renderWithProviders } from './render';

let fake: ReturnType<typeof installFakeApi>;
afterEach(async () => {
  await cleanup();
  fake?.restore();
  jest.restoreAllMocks();
});

const Probe = () => {
  const t = useTheme();
  return <Text>{`primary:${t.colors.primary}|bg:${t.colors.background}`}</Text>;
};

const hue = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round(((h * 60) + 360) % 360);
};

describe('paleta azul', () => {
  it('el color de marca y sus contenedores son azules (tono 200°–240°) en claro y oscuro', () => {
    const outside = [lightTheme, darkTheme]
      .flatMap((t) => [t.colors.primary, t.colors.primaryContainer, t.colors.secondaryContainer, t.colors.tertiaryContainer])
      .filter((c) => hue(c) < 200 || hue(c) > 240);
    expect(outside).toEqual([]);
  });
});

describe('modo claro por defecto; el oscuro lo activa el usuario', () => {
  it('arranca en claro AUNQUE el sistema esté en oscuro', async () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
    await renderWithProviders(<Probe />);
    expect(await screen.findByText(`primary:${lightTheme.colors.primary}|bg:${lightTheme.colors.background}`)).toBeTruthy();
  });

  it('el usuario activa el oscuro desde su cuenta y se recuerda para la próxima vez', async () => {
    fake = installFakeApi({ 'GET /v1/me': () => json(ME) });
    const prefs = new MemoryPreferences();
    await renderWithProviders(<><Probe /><AccountCard /></>, { session: VALID_SESSION, preferences: prefs });
    await screen.findByText('Idioma: es-AR');
    fireEvent(screen.getByLabelText('Modo oscuro'), 'valueChange', true);
    await waitFor(() => expect(screen.getByText(`primary:${darkTheme.colors.primary}|bg:${darkTheme.colors.background}`)).toBeTruthy());
    expect(await prefs.get('finanzapp.themeMode')).toBe('dark');
    await cleanup();
    await renderWithProviders(<Probe />, { preferences: prefs }); // "otra sesión": recuerda oscuro
    await waitFor(() => expect(screen.getByText(`primary:${darkTheme.colors.primary}|bg:${darkTheme.colors.background}`)).toBeTruthy());
  });

  it('volver a claro también se recuerda', async () => {
    const prefs = new MemoryPreferences();
    await prefs.set('finanzapp.themeMode', 'dark');
    fake = installFakeApi({ 'GET /v1/me': () => json(ME) });
    await renderWithProviders(<><Probe /><AccountCard /></>, { session: VALID_SESSION, preferences: prefs });
    await waitFor(() => expect(screen.getByText(`primary:${darkTheme.colors.primary}|bg:${darkTheme.colors.background}`)).toBeTruthy());
    fireEvent(screen.getByLabelText('Modo oscuro'), 'valueChange', false);
    await waitFor(() => expect(screen.getByText(`primary:${lightTheme.colors.primary}|bg:${lightTheme.colors.background}`)).toBeTruthy());
    expect(await prefs.get('finanzapp.themeMode')).toBe('light');
  });
});

describe('tipografía: solo Roboto', () => {
  it('todas las variantes de la escala MD3 usan una familia Roboto y ninguna depende de fontWeight', () => {
    const families = new Set<string>(Object.values(FONT));
    const bad = Object.entries(robotoTypescale)
      .filter(([, spec]) => !families.has((spec as { fontFamily: string }).fontFamily) || (spec as { fontWeight?: string }).fontWeight !== 'normal')
      .map(([variant]) => variant);
    expect(bad).toEqual([]);
    expect(lightTheme.fonts).toBe(robotoTypescale);
    expect(darkTheme.fonts).toBe(robotoTypescale);
  });

  it('respeta los pesos de MD3: títulos y etiquetas en Medium, cuerpo en Regular', () => {
    expect(robotoTypescale.titleMedium.fontFamily).toBe(FONT.medium);
    expect(robotoTypescale.labelLarge.fontFamily).toBe(FONT.medium);
    expect(robotoTypescale.bodyLarge.fontFamily).toBe(FONT.regular);
  });
});
