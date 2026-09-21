import { useState } from 'react';
import { View } from 'react-native';
import { Chip, TextInput } from 'react-native-paper';
import { normalizeAmount, useAddCharge, type ChargeKind } from '@/core-react';
import { AmountInput, DateInput, fieldToIso, isoToField } from '../common/fields';
import { FormDialog } from '../common/FormDialog';
import { todayLocal } from '../movements/dates';

const KINDS: Array<[ChargeKind, string]> = [['INTEREST', 'Interés'], ['FEE', 'Comisión'], ['TAX', 'Impuesto'], ['PENALTY', 'Multa / refinanciación']];

/** Cargo propio del resumen: gasto aparte (no cambia el precio de las compras) que suma a lo que se debe. */
export function ChargeDialog({ walletId, periodId, currencies, visible, onDismiss }: { walletId: string; periodId: string; currencies: string[]; visible: boolean; onDismiss: () => void }) {
  const add = useAddCharge(walletId, periodId);
  const [kind, setKind] = useState<ChargeKind>('INTEREST');
  const [currency, setCurrency] = useState(currencies[0] ?? 'ARS');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(isoToField(todayLocal()));
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; date?: string }>({});

  return (
    <FormDialog
      title="Agregar cargo al resumen"
      visible={visible}
      onDismiss={onDismiss}
      submitLabel="Agregar cargo"
      onSubmit={async () => {
        const a = normalizeAmount(amount);
        const d = fieldToIso(date);
        const next = { ...(a ? {} : { amount: 'Ingresá un importe mayor que cero' }), ...(d ? {} : { date: 'Fecha inválida' }) };
        setErrors(next);
        if (!a || !d) throw new Error('validación');
        await add.mutateAsync({ kind, currency, amount: a, date: d, ...(description.trim() ? { description: description.trim() } : {}) });
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {KINDS.map(([k, label]) => (
          <Chip key={k} selected={kind === k} onPress={() => setKind(k)} accessibilityLabel={`Cargo ${label}`}>
            {label}
          </Chip>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {currencies.map((c) => (
          <Chip key={c} selected={currency === c} onPress={() => setCurrency(c)} accessibilityLabel={`Moneda ${c}`}>
            {c}
          </Chip>
        ))}
      </View>
      <AmountInput label="Importe del cargo" value={amount} onChange={setAmount} error={errors.amount} />
      <DateInput label="Fecha del cargo" value={date} onChange={setDate} error={errors.date} />
      <TextInput mode="outlined" label="Detalle (opcional)" accessibilityLabel="Detalle del cargo" value={description} onChangeText={setDescription} />
    </FormDialog>
  );
}
