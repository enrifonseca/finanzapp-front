import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useMe, useOnboarding, useSession } from '@/core-react';
import { AppProviders } from '@/kernel';
import { ErrorScreen, LoadingScreen } from '@/layout';
import { ROBOTO_FONTS } from '@/ui-system';

/** Sesión + primer uso: sin sesión solo /login; con sesión pero sin billeteras (o dentro del asistente) solo /onboarding. */
function RootNavigator() {
  const { status, signOut } = useSession();
  const signedIn = status === 'signedIn';
  const me = useMe();
  const onboarding = useOnboarding();
  const completed = me.data?.onboardingCompleted;

  // Al detectar primer uso pendiente se "engancha" el asistente para poder ofrecer
  // "Crear otra / Ir a Home" aunque la primera billetera ya cuente como primer uso completo.
  useEffect(() => {
    if (signedIn && completed === false && !onboarding.active) onboarding.start();
  }, [signedIn, completed, onboarding]);

  if (status === 'loading') return <LoadingScreen />;
  if (signedIn && me.isPending) return <LoadingScreen />;
  if (signedIn && me.isError) {
    return <ErrorScreen message="No pudimos cargar tu cuenta." onRetry={() => void me.refetch()} onSecondary={() => void signOut()} secondaryLabel="Cerrar sesión" />;
  }

  const needsOnboarding = signedIn && (completed === false || onboarding.active);
  const inApp = signedIn && !needsOnboarding;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={inApp}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="wallet-new" />
        <Stack.Screen name="movement-new" />
        <Stack.Screen name="operation" />
        <Stack.Screen name="card" />
      </Stack.Protected>
      <Stack.Protected guard={needsOnboarding}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // Roboto se carga antes de dibujar nada; si fallara la carga se sigue con la fuente del sistema (nunca se bloquea la app).
  const [loaded, fontError] = useFonts(ROBOTO_FONTS);
  if (!loaded && !fontError) return null;
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
