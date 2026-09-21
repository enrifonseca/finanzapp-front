import { useState } from 'react';
import { Text } from 'react-native-paper';
import { formatMoney, normalizeAmount, useSetBankTotal, type StatementCurrency } from '@/core-react';
import { AmountInput } from '../common/fields';
import { FormDialog } from '../common/FormDialog';

/** Total REAL que informa el banco. La diferencia con lo que calcula la app queda visible como ajuste. */
export function BankTotalDialog({ walletId, periodId, line, visible, onDismiss }: { walletId: string; periodId: string; line: StatementCurrency; visible: boolean; onDismiss: () => void }) {
  const set = useSetBankTotal(walletId, periodId);
  const [value, setValue] = useState(line.bankTotal ?? '');
  const [error, setError] = useState<string | undefined>();

  return (
    <FormDialog
      title={`Total del banco (${line.currency})`}
      visible={visible}
      onDismiss={onDismiss}
      submitLabel="Guardar"
      onSubmit={async () => {
        // Vacío = volver al total calculado por la app.
        const total = value.trim() === '' ? null : normalizeAmount(value);
        if (value.trim() !== '' && total === null) {
          setError('Importe inválido');
          throw new Error('validación');
        }
        setError(undefined);
        await set.mutateAsync({ currency: line.currency, bankTotal: total });
      }}
    >
      <Text variant="bodySmall">La app calcula {formatMoney(line.computedTotal, line.currency)}. Si el resumen del banco dice otro total, cargalo: la diferencia queda visible y es lo que se paga. Dejalo vacío para volver al total calculado.</Text>
      <AmountInput label="Total informado por el banco" value={value} onChange={setValue} error={error} />
    </FormDialog>
  );
}
