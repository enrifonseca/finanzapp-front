import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';
import { z } from 'zod';
import { AuthError, useRuntimeConfig, useSession } from '@/core-react';
import { ScreenContainer } from '@/layout';
import { ErrorText } from '@/ui-system';

const SandboxForm = z.object({
  name: z.string().trim().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Solo letras, números, guion y guion bajo (máx. 64)'),
});
type SandboxValues = z.infer<typeof SandboxForm>;

const ERROR_TEXT = {
  'invalid-credentials': 'No pudimos verificar tu identidad. Probá de nuevo.',
  'not-configured': 'Este método de acceso no está configurado en el servidor.',
  network: 'No hay conexión con el servidor. Revisá tu red y reintentá.',
  unknown: 'Ocurrió un error inesperado. Reintentá en unos segundos.',
} as const;

export function LoginScreen() {
  const { authSandbox } = useRuntimeConfig();
  const { signIn } = useSession();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<SandboxValues>({ resolver: zodResolver(SandboxForm), defaultValues: { name: '' } });

  const onSubmit = handleSubmit(async ({ name }) => {
    setError(null);
    try {
      await signIn('GOOGLE', `sandbox:${name}`);
    } catch (e) {
      setError(ERROR_TEXT[e instanceof AuthError ? e.kind : 'unknown']);
    }
  });

  return (
    <ScreenContainer title="Finanzas Personales">
      <View style={styles.header}>
        <Text variant="bodyMedium">Ingresá con tu cuenta para empezar.</Text>
      </View>

      <Card>
        <Card.Content style={styles.stack}>
          {/* El login real necesita client IDs de Google/Apple (los crea el dueño del proyecto): ver README. */}
          <Button mode="contained" icon="google" disabled accessibilityLabel="Continuar con Google">
            Continuar con Google
          </Button>
          <Button mode="contained-tonal" icon="apple" disabled accessibilityLabel="Continuar con Apple">
            Continuar con Apple
          </Button>
          <HelperText type="info" visible>
            Google y Apple todavía no están configurados en este entorno.
          </HelperText>
        </Card.Content>
      </Card>

      {authSandbox && (
        <Card>
          <Card.Title title="Modo desarrollo" subtitle="Solo con el backend en AUTH_SANDBOX=true" />
          <Card.Content style={styles.stack}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput mode="outlined"
                  label="Nombre de usuario de prueba"
                  accessibilityLabel="Nombre de usuario de prueba"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={!!formState.errors.name}
                  onSubmitEditing={() => void onSubmit()}
                />
              )}
            />
            <HelperText type="error" visible={!!formState.errors.name}>
              {formState.errors.name?.message}
            </HelperText>
            <Button mode="contained" onPress={() => void onSubmit()} loading={formState.isSubmitting} disabled={formState.isSubmitting}>
              Entrar (modo desarrollo)
            </Button>
          </Card.Content>
        </Card>
      )}

      {error && (
        <ErrorText>{error}</ErrorText>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, paddingTop: 8 },
  stack: { gap: 8 },
});
