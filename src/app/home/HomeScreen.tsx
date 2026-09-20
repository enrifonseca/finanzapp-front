import { Button, Card, Text } from 'react-native-paper';
import { useApi, useBackendStatus } from '@/core-react';
import { EmptyState, ScreenContainer } from '@/layout';
import { StatusChip } from '@/ui-system';

const LABEL = { checking: 'Verificando…', up: 'Conectado', down: 'Sin conexión con el backend' } as const;
const TONE = { checking: 'neutral', up: 'positive', down: 'negative' } as const;

export function HomeScreen() {
  const { baseUrl } = useApi();
  const { status, refetch, isFetching } = useBackendStatus();
  return (
    <ScreenContainer>
      <Card>
        <Card.Title title="Conexión con el backend" subtitle="Diagnóstico de desarrollo (Fase 0)" />
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
      <EmptyState title="Inicio" description="Billeteras, habituales y últimos movimientos llegan en las Fases 2 y 3." />
    </ScreenContainer>
  );
}
