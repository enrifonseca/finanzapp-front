import { Stack } from 'expo-router';
import { useSession } from '@/core-react';
import { AppProviders } from '@/kernel';
import { LoadingScreen } from '@/layout';

function RootNavigator() {
  const { status } = useSession();
  if (status === 'loading') return <LoadingScreen />;
  const signedIn = status === 'signedIn';
  // Las rutas protegidas no existen para quien no corresponde: sin sesión solo se llega a /login.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
