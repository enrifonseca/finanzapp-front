import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, Dialog, Portal, Text } from 'react-native-paper';
import { ApiRequestError, useOperation, usePatchOperation, useReverseOperation } from '@/core-react';
import { ErrorScreen, ScreenContainer } from '@/layout';
import { ReferencePickerDialog } from './ReferencePickerDialog';

/**
 * Detalle: separa lo ECONÓMICO (ganado/gastado por moneda) de lo EFECTIVO (cobrado/pagado por billetera).
 * Asociar una referencia después no crea otro gasto ni toca la caja; revertir compensa y conserva el historial.
 */
export function OperationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const op = useOperation(id ?? '');
  const reverse = useReverseOperation();
  const patch = usePatchOperation(id ?? '');
  const [confirming, setConfirming] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (op.isPending) return <ScreenContainer><Text>Cargando…</Text></ScreenContainer>;
  if (op.isError) return <ErrorScreen message="No se pudo cargar la operación." onRetry={() => void op.refetch()} onSecondary={() => router.back()} secondaryLabel="Volver" />;
  const o = op.data;
  const verbs = o.family === 'INCOME' ? { econ: 'Ganado', cash: 'Cobrado' } : { econ: 'Gastado', cash: 'Pagado' };

  const doReverse = async () => {
    setError(null);
    try {
      await reverse.mutateAsync(o.id);
      setConfirming(false);
    } catch (e) {
      setConfirming(false);
      setError(e instanceof ApiRequestError && e.code === 'OPERATION_ALREADY_REVERSED' ? 'Esta operación ya estaba revertida.' : 'No se pudo revertir. Reintentá.');
    }
  };

  return (
    <ScreenContainer>
      <View style={{ gap: 4 }}>
        <Text variant="headlineSmall">{o.concept}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Chip compact>{o.family === 'INCOME' ? 'Ingreso' : 'Egreso'}</Chip>
          {o.state === 'REVERSED' && <Chip compact>Revertida</Chip>}
          {o.categoryName && <Chip compact>{o.categoryName}</Chip>}
          {o.referenceName && <Chip compact>{o.referenceName}</Chip>}
        </View>
        {o.economicPeriod && <Text variant="bodySmall">Período: {o.economicPeriod}</Text>}
        {o.note && <Text variant="bodySmall">{o.note}</Text>}
      </View>

      <Card>
        <Card.Title title={`${verbs.econ} (economía)`} subtitle="Cuenta una sola vez, por moneda" />
        <Card.Content style={{ gap: 2 }}>
          {o.economicComponents.map((c) => (
            <Text key={c.currency}>{`${c.amount} ${c.currency}${c.economicDate ? ` · ${c.economicDate}` : ''}`}</Text>
          ))}
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title={`${verbs.cash} (caja)`} subtitle="Lo que efectivamente se movió en cada billetera" />
        <Card.Content style={{ gap: 2 }}>
          {o.settlements.map((s, i) => (
            <Text key={i}>{`${s.walletName}: ${s.amount} ${s.currency} · ${s.effectiveDate}`}</Text>
          ))}
        </Card.Content>
      </Card>

      {error && <Text accessibilityRole="alert" style={{ color: '#B3261E' }}>{error}</Text>}
      {o.state === 'CONFIRMED' && (
        <View style={{ gap: 8 }}>
          <Button mode="outlined" icon="link-variant" onPress={() => setPicking(true)} disabled={patch.isPending}>
            {o.referenceName ? 'Cambiar referencia' : 'Asociar referencia'}
          </Button>
          <Button mode="outlined" icon="undo" onPress={() => setConfirming(true)}>
            Revertir operación
          </Button>
        </View>
      )}
      <Button onPress={() => router.back()}>Volver</Button>

      <ReferencePickerDialog visible={picking} onDismiss={() => setPicking(false)} onSelect={(refId) => void patch.mutateAsync({ referenceId: refId })} />
      <Portal>
        <Dialog visible={confirming} onDismiss={() => setConfirming(false)}>
          <Dialog.Title>¿Revertir esta operación?</Dialog.Title>
          <Dialog.Content>
            <Text>Se compensan sus efectos en la caja y queda marcada como revertida. El historial se conserva.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirming(false)}>Cancelar</Button>
            <Button onPress={() => void doReverse()} loading={reverse.isPending} disabled={reverse.isPending}>
              Sí, revertir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenContainer>
  );
}
