import { useRouter } from 'expo-router';
import { Button, Card, Text } from 'react-native-paper';
import { useApi, useBackendStatus } from '@/core-react';
import { ScreenContainer } from '@/layout';
import { StatusChip } from '@/ui-system';
import { Habituales } from '../movements/Habituales';
import { RecentOperations } from '../movements/RecentOperations';
import { WalletsList } from '../wallets/WalletsList';
import { AccountCard } from './AccountCard';

const LABEL = { checking: 'Verificando…', up: 'Conectado', down: 'Sin conexión con el backend' } as const;
const TONE = { checking: 'neutral', up: 'positive', down: 'negative' } as const;

export function HomeScreen() {
  const { baseUrl } = useApi();
  const { status, refetch, isFetching } = useBackendStatus();
  const router = useRouter();
  return (
    <ScreenContainer bottomInset={80}>
      <Text variant="titleMedium">Billeteras</Text>
      <WalletsList variant="carousel" onCreate={() => router.push('/wallet-new')} />
      <Habituales />
      <Text variant="titleMedium">Últimos movimientos</Text>
      <RecentOperations />
      <AccountCard />
      <Card mode="outlined">
        <Card.Title title="Conexión con el backend" subtitle="Diagnóstico de desarrollo" />
        <Card.Content style={{ gap: 8 }}>
          <StatusChip label={LABEL[status]} tone={TONE[status]} />
          <Text variant="bodySmall">{baseUrl}</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => void refetch()} loading={isFetching} disabled={isFetching}>
            Reintentar
          </Button>
        </Card.Actions>
      </Card>
    </ScreenContainer>
  );
}
