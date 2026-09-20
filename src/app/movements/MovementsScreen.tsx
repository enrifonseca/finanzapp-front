import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useOperationsHistory } from '@/core-react';
import { EmptyState, ScreenContainer } from '@/layout';
import { OperationRow } from './OperationRow';

/** Historial completo de operaciones reales, más recientes primero, con paginación por cursor. */
export function MovementsScreen() {
  const router = useRouter();
  const history = useOperationsHistory();
  const ops = history.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <ScreenContainer>
      <Button mode="contained" icon="plus" onPress={() => router.push('/movement-new')}>
        Nuevo movimiento
      </Button>
      {history.isPending && <Text>Cargando movimientos…</Text>}
      {history.isError && (
        <View style={{ gap: 8 }}>
          <Text accessibilityRole="alert">No se pudo cargar el historial.</Text>
          <Button onPress={() => void history.refetch()}>Reintentar historial</Button>
        </View>
      )}
      {history.isSuccess && ops.length === 0 && <EmptyState title="Todavía no hay movimientos" description="Los ingresos y egresos que registres aparecen acá." />}
      {ops.map((op) => (
        <OperationRow key={op.id} op={op} onPress={() => router.push({ pathname: '/operation/[id]', params: { id: op.id } })} />
      ))}
      {history.hasNextPage && (
        <Button onPress={() => void history.fetchNextPage()} loading={history.isFetchingNextPage} disabled={history.isFetchingNextPage}>
          Cargar más
        </Button>
      )}
    </ScreenContainer>
  );
}
