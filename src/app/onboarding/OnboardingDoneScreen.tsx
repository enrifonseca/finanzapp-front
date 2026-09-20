import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useOnboarding } from '@/core-react';
import { ScreenContainer } from '@/layout';

/** Confirmación tras CADA alta: "Crear otra billetera" o "Ir a Home" (FLUJO-001 §8 bis). */
export function OnboardingDoneScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const router = useRouter();
  const onboarding = useOnboarding();
  return (
    <ScreenContainer>
      <View style={{ gap: 4 }}>
        <Text variant="headlineSmall">Billetera creada</Text>
        <Text variant="bodyLarge">{name}</Text>
      </View>
      <Button mode="contained" onPress={() => onboarding.finish()}>
        Ir a Home
      </Button>
      <Button mode="outlined" onPress={() => router.replace('/onboarding')}>
        Crear otra billetera
      </Button>
    </ScreenContainer>
  );
}
