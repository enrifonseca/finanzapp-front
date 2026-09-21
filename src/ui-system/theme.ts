import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { robotoTypescale } from './fonts';

/**
 * Tema MD3 de la app (React Native Paper): azul como color de marca, tipografía Roboto.
 * Todos los colores salen de acá; las pantallas usan `theme.colors.*` y nunca valores sueltos.
 */
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  fonts: robotoTypescale,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1A5FB4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D6E3FF',
    onPrimaryContainer: '#001B3E',
    secondary: '#565F71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DAE2F9',
    onSecondaryContainer: '#131C2C',
    tertiary: '#3B6AA0',
    tertiaryContainer: '#D3E4FF',
    onTertiaryContainer: '#001C38',
    background: '#F4F7FC',
    onBackground: '#191C20',
    surface: '#FFFFFF',
    onSurface: '#191C20',
    surfaceVariant: '#E0E2EC',
    onSurfaceVariant: '#43474E',
    outline: '#74777F',
    outlineVariant: '#C4C6D0',
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 3,
  fonts: robotoTypescale,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A9C7FF',
    onPrimary: '#002F65',
    primaryContainer: '#00458D',
    onPrimaryContainer: '#D6E3FF',
    secondary: '#BEC6DC',
    onSecondary: '#283041',
    secondaryContainer: '#3E4759',
    onSecondaryContainer: '#DAE2F9',
    tertiary: '#A5C8FF',
    tertiaryContainer: '#1F4977',
    onTertiaryContainer: '#D3E4FF',
    background: '#0F1318',
    onBackground: '#E1E2E8',
    surface: '#111418',
    onSurface: '#E1E2E8',
    surfaceVariant: '#43474E',
    onSurfaceVariant: '#C4C6D0',
    outline: '#8E9099',
    outlineVariant: '#43474E',
    error: '#FFB4AB',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
  },
};

/** Cabecera de pantalla: de marca con texto claro. */
export const headerColors = (theme: MD3Theme) =>
  theme.dark
    ? { background: theme.colors.primaryContainer, foreground: theme.colors.onPrimaryContainer }
    : { background: theme.colors.primary, foreground: theme.colors.onPrimary };
