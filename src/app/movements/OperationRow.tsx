import { Chip, List } from 'react-native-paper';
import type { Operation } from '@/core-react';

/** Resumen de una operación lógica: una fila, con cada moneda por separado (nunca sumadas entre sí). */
export function operationSummary(op: Operation): string {
  const sign = op.family === 'INCOME' ? '+' : '−';
  return op.economicComponents.map((c) => `${sign}${c.amount} ${c.currency}`).join(' · ');
}

export function OperationRow({ op, onPress }: { op: Operation; onPress: () => void }) {
  const detail = [op.categoryName, op.referenceName].filter(Boolean).join(' · ');
  return (
    <List.Item
      title={op.concept}
      description={[operationSummary(op), detail].filter(Boolean).join('\n')}
      descriptionNumberOfLines={3}
      onPress={onPress}
      accessibilityLabel={`Operación ${op.concept}`}
      right={() => (op.state === 'REVERSED' ? <Chip compact>Revertida</Chip> : null)}
    />
  );
}
