import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/layout';
import { WalletsList } from './WalletsList';

export function WalletsScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <WalletsList onCreate={() => router.push('/wallet-new')} />
    </ScreenContainer>
  );
}
