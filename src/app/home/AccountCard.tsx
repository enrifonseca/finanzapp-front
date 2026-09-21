import { View } from 'react-native';
import { Button, Card, Switch, Text } from 'react-native-paper';
import { useMe, useSession, useThemeMode } from '@/core-react';

/** Perfil del usuario desde GET /v1/me + cerrar sesión. */
export function AccountCard() {
  const me = useMe();
  const { signOut } = useSession();
  const { mode, setMode } = useThemeMode();
  return (
    <Card mode="outlined">
      <Card.Title title="Tu cuenta" />
      <Card.Content style={{ gap: 4 }}>
        {me.isPending && <Text>Cargando perfil…</Text>}
        {me.isError && <Text accessibilityRole="alert">No se pudo cargar tu perfil.</Text>}
        {me.data && (
          <>
            <Text>Idioma: {me.data.locale}</Text>
            <Text>Zona horaria: {me.data.timezone}</Text>
            <Text>Moneda preferida: {me.data.preferredCurrencyCode ?? 'sin definir'}</Text>
            <Text>Primer uso: {me.data.onboardingCompleted ? 'completo' : 'pendiente (sin billeteras)'}</Text>
          </>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <Text>Modo oscuro</Text>
          <Switch value={mode === 'dark'} onValueChange={(on) => setMode(on ? 'dark' : 'light')} accessibilityLabel="Modo oscuro" />
        </View>
      </Card.Content>
      <Card.Actions>
        {me.isError && <Button onPress={() => void me.refetch()}>Reintentar perfil</Button>}
        <Button onPress={() => void signOut()}>Cerrar sesión</Button>
      </Card.Actions>
    </Card>
  );
}
