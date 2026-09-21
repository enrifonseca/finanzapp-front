import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useRecentOperations } from '@/core-react';
import { EmptyState } from '@/layout';
import { OperationRow } from './OperationRow';

/** Últimas 10 operaciones reales (una fila por operación lógica). Estados: carga, error, vacío. */
export function RecentOperations() {
  const router = useRouter();
  const recent = useRecentOperations(10);
  if (recent.isPending) return <Text>Cargando movimientos…</Text>;
  if (recent.isError) {
    return (
      <View style={{ gap: 8 }}>
        <Text accessibilityRole="alert">No se pudieron cargar los movimientos.</Text>
        <Button onPress={() => void recent.refetch()}>Reintentar movimientos</Button>
      </View>
    );
  }
  if (recent.data.length === 0) {
    return <EmptyState title="Todavía no hay movimientos" description="Registrá tu primer ingreso o egreso con “Nuevo movimiento”." />;
  }
  return (
    <View style={{ gap: 8 }}>
      {recent.data.map((op) => (
        <OperationRow key={op.id} op={op} onPress={() => router.push({ pathname: '/operation/[id]', params: { id: op.id } })} />
      ))}
      <Button onPress={() => router.push('/movimientos')}>Ver todos</Button>
    </View>
  );
}
