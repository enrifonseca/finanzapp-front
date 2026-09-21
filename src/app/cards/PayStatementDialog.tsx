import { useState } from 'react';
import { View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import {
  ApiRequestError, describeError, divideDecimal, formatMoney, normalizeAmount, parseDecimal, subDecimal, usePayStatement, useWallets, type StatementCurrency,
} from '@/core-react';
import { AmountInput, DateInput, fieldToIso, isoToField } from '../common/fields';
import { FormDialog } from '../common/FormDialog';
import { todayLocal } from '../movements/dates';

/**
 * Pago total o parcial. Lo que se paga reduce el saldo del resumen; el resto sigue como deuda. Si la deuda está en una
 * moneda y se paga con otra, el monto exacto se conoce recién al pagar: se cargan lo que salió de la billetera y los
 * impuestos, y la cotización implícita se calcula sola.
 */
export function PayStatementDialog({ walletId, periodId, line, visible, onDismiss }: { walletId: string; periodId: string; line: StatementCurrency; visible: boolean; onDismiss: () => void }) {
  const pay = usePayStatement(walletId, periodId);
  const wallets = useWallets();
  const sources = (wallets.data ?? []).filter((w) => w.type !== 'CREDIT');
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [sourceCurrency, setSourceCurrency] = useState<string | null>(null);
  const [applied, setApplied] = useState(line.outstanding);
  const [walletAmount, setWalletAmount] = useState(line.outstanding);
  const [tax, setTax] = useState('');
  const [date, setDate] = useState(isoToField(todayLocal()));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const source = sources.find((w) => w.id === sourceId);
  const walletCurrency = sourceCurrency ?? line.currency;
  const converting = walletCurrency !== line.currency;
  const a = parseDecimal(applied);
  const w = parseDecimal(walletAmount);
  const t = parseDecimal(tax || '0');
  const rate = converting && a && w && t ? divideDecimal(subDecimal(w, t), a, 4) : null;

  return (
    <FormDialog
      title={`Pagar resumen (${line.currency})`}
      visible={visible}
      onDismiss={onDismiss}
      submitLabel="Pagar"
      onSubmit={async () => {
        const next: Record<string, string> = {};
        const ap = normalizeAmount(applied);
        const wa = normalizeAmount(walletAmount);
        const tx = tax.trim() === '' ? '0' : normalizeAmount(tax);
        const d = fieldToIso(date);
        if (!source) next.source = 'Elegí de qué billetera sale el pago';
        if (!ap) next.applied = 'Ingresá cuánta deuda cancelás';
        if (!wa) next.walletAmount = 'Ingresá cuánto salió de la billetera';
        if (tx === null) next.tax = 'Importe inválido';
        if (!d) next.date = 'Fecha inválida';
        setErrors(next);
        if (Object.keys(next).length > 0 || !source || !ap || !wa || tx === null || !d) throw new Error('validación');
        try {
          await pay.mutateAsync({ currency: line.currency, appliedAmount: ap, walletId: source.id, walletCurrency, walletAmount: wa, ...(tx !== '0' ? { taxAmount: tx } : {}), effectiveDate: d });
        } catch (e) {
          // Errores por campo del servidor (p. ej. el pago supera el saldo) se muestran en su campo.
          if (e instanceof ApiRequestError && e.fieldErrors.appliedAmount) {
            setErrors({ applied: e.fieldErrors.appliedAmount });
            throw new Error(describeError(e));
          }
          throw e;
        }
      }}
    >
      <Text variant="bodySmall">{`Saldo pendiente: ${formatMoney(line.outstanding, line.currency)}. Podés pagar una parte: el resto sigue como deuda.`}</Text>
      <Text variant="titleSmall">¿De qué billetera sale?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {sources.map((s) => (
          <Chip
            key={s.id}
            selected={sourceId === s.id}
            onPress={() => {
              setSourceId(s.id);
              setSourceCurrency(s.currencies.includes(line.currency) ? line.currency : (s.currencies[0] ?? null));
            }}
            accessibilityLabel={`Origen ${s.name}`}
          >
            {s.name}
          </Chip>
        ))}
      </View>
      {errors.source && <Text style={{ fontSize: 12 }}>{errors.source}</Text>}
      {source && source.currencies.length > 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {source.currencies.map((c) => (
            <Chip key={c} selected={walletCurrency === c} onPress={() => setSourceCurrency(c)} accessibilityLabel={`Pagar en ${c}`}>
              {`Pagar en ${c}`}
            </Chip>
          ))}
        </View>
      )}
      <AmountInput label={`Deuda que cancelás (${line.currency})`} value={applied} onChange={(v) => { setApplied(v); if (!converting) setWalletAmount(v); }} error={errors.applied} />
      <AmountInput label={`Total que sale de la billetera (${walletCurrency})`} value={walletAmount} onChange={setWalletAmount} error={errors.walletAmount} />
      <AmountInput label={`Impuestos incluidos, si hubo (${walletCurrency})`} value={tax} onChange={setTax} error={errors.tax} />
      {converting && (
        <Text variant="bodySmall" accessibilityLabel="Cotización implícita">
          {rate ? `Cotización implícita: ${formatMoney(rate, walletCurrency)} por ${line.currency}` : 'Cargá los importes para ver la cotización implícita'}
        </Text>
      )}
      {converting && <Text variant="bodySmall">El monto exacto se conoce al pagar: cargá lo que efectivamente te cobraron, con los impuestos aparte.</Text>}
      <DateInput label="Fecha del pago" value={date} onChange={setDate} error={errors.date} />
    </FormDialog>
  );
}
