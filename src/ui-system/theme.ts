import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

/**
 * Tema MD3 de la app (React Native Paper): verde esmeralda como color de marca.
 * Todos los colores salen de acá; las pantallas usan `theme.colors.*` y nunca valores sueltos.
 */
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0B8F72',
    onPrimary: '#FFFFFF',
    primaryContainer: '#C4EFE3',
    onPrimaryContainer: '#00201A',
    secondary: '#4A635B',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CCE8DE',
    onSecondaryContainer: '#06201A',
    tertiary: '#3F6375',
    tertiaryContainer: '#C3E8FD',
    onTertiaryContainer: '#001F2B',
    background: '#F3F8F5',
    onBackground: '#161D1A',
    surface: '#FFFFFF',
    onSurface: '#161D1A',
    surfaceVariant: '#DBE5E0',
    onSurfaceVariant: '#3F4945',
    outline: '#6F7975',
    outlineVariant: '#BFC9C4',
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#5FD8B8',
    onPrimary: '#00382C',
    primaryContainer: '#00513F',
    onPrimaryContainer: '#C4EFE3',
    secondary: '#B1CCC2',
    onSecondary: '#1C352E',
    secondaryContainer: '#324B44',
    onSecondaryContainer: '#CCE8DE',
    tertiary: '#A7CCE0',
    tertiaryContainer: '#264C5D',
    onTertiaryContainer: '#C3E8FD',
    background: '#0E1512',
    onBackground: '#DEE4E0',
    surface: '#131B18',
    onSurface: '#DEE4E0',
    surfaceVariant: '#3F4945',
    onSurfaceVariant: '#BFC9C4',
    outline: '#89938E',
    outlineVariant: '#3F4945',
    error: '#FFB4AB',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
  },
};

/** Cabecera de pantalla: verde de marca con texto claro (como las apps de finanzas de referencia). */
export const headerColors = (theme: MD3Theme) => ({ background: theme.colors.primary, foreground: theme.colors.onPrimary });
