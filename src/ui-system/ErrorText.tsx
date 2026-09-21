import { Text, useTheme } from 'react-native-paper';

/** Mensaje de error de formulario con el color de error del tema (nunca un color suelto). */
export function ErrorText({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
      {children}
    </Text>
  );
}
