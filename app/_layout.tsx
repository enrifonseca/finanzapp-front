import { Stack } from 'expo-router';
import { AppProviders } from '@/kernel';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
