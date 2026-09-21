import { useState } from 'react';
import { List, Text } from 'react-native-paper';
import { formatDate, formatMoney, useMoveInstallment, type Period } from '@/core-react';
import { FormDialog } from '../common/FormDialog';

export interface MovableInstallment {
  id: string;
  concept: string;
  number: number;
  count: number;
  amount: string;
  currency: string;
  currentPeriodId: string | null;
}

/** Mover una cuota a otro resumen (o dejarla sin asignar). El gasto de la compra no cambia. */
export function MoveInstallmentDialog({
  walletId, installment, periods, visible, onDismiss,
}: { walletId: string; installment: MovableInstallment | null; periods: Period[]; visible: boolean; onDismiss: () => void }) {
  const move = useMoveInstallment(walletId);
  const [target, setTarget] = useState<string | null | undefined>(undefined);
  const options: Array<{ id: string | null; label: string }> = [
    { id: null, label: 'Sin asignar' },
    ...periods.map((p) => ({ id: p.id, label: `Resumen ${p.cycleLabel}${p.closeDate ? ` · cierra ${formatDate(p.closeDate)}` : ''}` })),
  ].filter((o) => o.id !== installment?.currentPeriodId);

  return (
    <FormDialog
      title="Mover cuota"
      visible={visible && !!installment}
      onDismiss={onDismiss}
      submitLabel="Mover"
      disabled={target === undefined}
      onSubmit={async () => {
        if (!installment || target === undefined) return;
        await move.mutateAsync({ installmentId: installment.id, periodId: target });
      }}
    >
      {installment && (
        <Text variant="bodyMedium">{`${installment.concept} · cuota ${installment.number}/${installment.count} · ${formatMoney(installment.amount, installment.currency)}`}</Text>
      )}
      {options.map((o) => (
        <List.Item
          key={o.id ?? 'none'}
          title={o.label}
          accessibilityLabel={`Destino ${o.label}`}
          left={(p) => <List.Icon {...p} icon={target === o.id ? 'radiobox-marked' : 'radiobox-blank'} />}
          onPress={() => setTarget(o.id)}
        />
      ))}
    </FormDialog>
  );
}
