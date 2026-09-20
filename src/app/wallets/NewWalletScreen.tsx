import { useRouter } from 'expo-router';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '@/layout';
import { WalletForm } from './WalletForm';

/** Alta de billetera fuera del primer uso (misma forma, mismo formulario). */
export function NewWalletScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <Text variant="headlineSmall">Nueva billetera</Text>
      <WalletForm onCreated={() => router.replace('/billeteras')} />
      <Button onPress={() => router.back()}>Cancelar</Button>
    </ScreenContainer>
  );
}
