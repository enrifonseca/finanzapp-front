import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/layout';
import { WalletForm } from './WalletForm';

/** Alta de billetera fuera del primer uso (misma forma, mismo formulario). */
export function NewWalletScreen() {
  const router = useRouter();
  return (
    <ScreenContainer title="Nueva billetera" onBack={() => router.back()}>
      <WalletForm onCreated={() => router.replace('/billeteras')} />
    </ScreenContainer>
  );
}
