import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { useMe, useWallets } from '@/core-react';
import { ScreenContainer } from '@/layout';
import { WalletForm } from '../wallets/WalletForm';

/** Primer uso: crear la primera billetera (o retomar la siguiente). No pide categorías, saldos ni períodos. */
export function OnboardingScreen() {
  const router = useRouter();
  const wallets = useWallets();
  const me = useMe();
  const isFirst = (wallets.data?.length ?? 0) === 0 && !me.data?.onboardingCompleted;
  return (
    <ScreenContainer>
      <Text variant="headlineSmall">{isFirst ? 'Creá tu primera billetera' : 'Crear otra billetera'}</Text>
      <Text variant="bodyMedium">
        {isFirst ? 'Solo necesitamos un nombre, el tipo y las monedas. El resto lo podés completar después.' : 'Podés crear todas las que necesites.'}
      </Text>
      <WalletForm onCreated={(w) => router.replace({ pathname: '/onboarding/done', params: { name: w.name } })} />
    </ScreenContainer>
  );
}
