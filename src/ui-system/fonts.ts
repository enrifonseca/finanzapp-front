import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

type MD3Typescale = MD3Theme['fonts'];

/** Toda la tipografía de la app es Roboto. Un archivo por peso: en móvil el peso se elige por familia, no por fontWeight. */
export const FONT = { regular: 'Roboto_400Regular', medium: 'Roboto_500Medium', bold: 'Roboto_700Bold' } as const;

/** Para `useFonts` de expo-font. */
export const ROBOTO_FONTS = { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold };

const familyFor = (weight: unknown): string => {
  const w = String(weight ?? '400');
  if (w === '700' || w === 'bold' || w === '600' || w === '800' || w === '900') return FONT.bold;
  if (w === '500') return FONT.medium;
  return FONT.regular;
};

/** Escala tipográfica MD3 de Paper reasignada a Roboto, respetando el peso que MD3 define para cada variante. */
export const robotoTypescale = Object.fromEntries(
  Object.entries(MD3LightTheme.fonts).map(([variant, spec]) => [variant, { ...spec, fontFamily: familyFor(spec.fontWeight), fontWeight: 'normal' as const }]),
) as unknown as MD3Typescale;
