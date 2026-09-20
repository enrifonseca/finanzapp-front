import { Stack } from 'expo-router';

/** Agrupa el asistente de primer uso como UNA pantalla del Stack raíz, para poder protegerla con un guard. */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
