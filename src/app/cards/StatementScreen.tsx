import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, Divider, List, Text } from 'react-native-paper';
import { formatDate, formatMoney, useCardOverview, type StatementCurrency } from '@/core-react';
import { ErrorScreen, ScreenContainer } from '@/layout';
import { BankTotalDialog } from './BankTotalDialog';
import { ChargeDialog } from './ChargeDialog';
import { MoveInstallmentDialog, type MovableInstallment } from './MoveInstallmentDialog';
import { PayStatementDialog } from './PayStatementDialog';
import { PeriodDatesDialog } from './PeriodDatesDialog';
import { CHARGE_LABEL } from './labels';

type DialogState = null | 'dates' | 'charge' | { bank: string } | { pay: string } | { move: MovableInstallment };

/**
 * Resumen de un período, una sección por moneda (nunca se mezclan). Se puede corregir ANTES de pagarlo: total real del
 * banco, cargos, fechas y cuotas de otro resumen. El pago parcial baja el saldo; lo que falta sigue como deuda.
 */
export function StatementScreen() {
  const { id, periodId } = useLocalSearchParams<{ id: string; periodId: string }>();
  const router = useRouter();
  const overview = useCardOverview(id ?? '');
  const [dialog, setDialog] = useState<DialogState>(null);
  const close = () => setDialog(null);

  if (overview.isPending) return <ScreenContainer title="Resumen" onBack={() => router.back()}><Text>Cargando…</Text></ScreenContainer>;
  if (overview.isError) return <ErrorScreen message="No se pudo cargar el resumen." onRetry={() => void overview.refetch()} onSecondary={() => router.back()} secondaryLabel="Volver" />;
  const statement = overview.data.periods.find((s) => s.period.id === periodId);
  if (!statement) return <ErrorScreen message="No encontramos ese resumen." onRetry={() => router.back()} />;
  const { period } = statement;
  const allPeriods = overview.data.periods.map((s) => s.period);
  const line = (currency: string): StatementCurrency | undefined => statement.currencies.find((c) => c.currency === currency);

  return (
    <ScreenContainer title={`Resumen ${period.cycleLabel}`} onBack={() => router.back()}>
      <Card mode="outlined">
        <Card.Title title="Fechas" right={() => <Chip compact style={{ marginRight: 12 }}>{period.dateConfidence === 'ESTIMATED' ? 'Estimadas' : 'Confirmadas'}</Chip>} />
        <Card.Content style={{ gap: 2 }}>
          <Text>{`Apertura: ${period.openDate ? formatDate(period.openDate) : 'sin cargar'}`}</Text>
          <Text>{`Cierre: ${period.closeDate ? formatDate(period.closeDate) : 'sin cargar'}`}</Text>
          <Text>{`Vencimiento: ${period.dueDate ? formatDate(period.dueDate) : 'sin cargar'}`}</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setDialog('dates')}>Corregir fechas</Button>
        </Card.Actions>
      </Card>

      {statement.currencies.length === 0 && <Text>Este resumen todavía no tiene consumos.</Text>}
      {statement.currencies.map((c) => (
        <Card key={c.currency} mode="outlined" accessibilityLabel={`Resumen en ${c.currency}`}>
          <Card.Title title={`Deuda en ${c.currency}`} />
          <Card.Content style={{ gap: 4 }}>
            <Row label="Total calculado" value={formatMoney(c.computedTotal, c.currency)} />
            {c.bankTotal && <Row label="Total del banco" value={formatMoney(c.bankTotal, c.currency)} />}
            {c.adjustment && <Row label="Ajuste (banco − calculado)" value={formatMoney(c.adjustment, c.currency)} />}
            <Row label="A pagar" value={formatMoney(c.amountDue, c.currency)} strong />
            <Row label="Pagado" value={formatMoney(c.paid, c.currency)} />
            <Row label="Saldo pendiente" value={formatMoney(c.outstanding, c.currency)} strong />
            <Divider style={{ marginVertical: 8 }} />
            {c.installments.map((i) => (
              <List.Item
                key={i.id}
                title={i.concept}
                description={`Cuota ${i.number}/${i.count} · compra del ${formatDate(i.purchaseDate)}`}
                right={() => <Text>{formatMoney(i.amount, c.currency)}</Text>}
                onPress={() => setDialog({ move: { id: i.id, concept: i.concept, number: i.number, count: i.count, amount: i.amount, currency: c.currency, currentPeriodId: period.id } })}
                accessibilityLabel={`Cuota ${i.concept} ${i.number}`}
              />
            ))}
            {c.charges.map((ch) => (
              <List.Item key={ch.id} title={CHARGE_LABEL[ch.kind]} description={ch.description ?? undefined} right={() => <Text>{formatMoney(ch.amount, c.currency)}</Text>} />
            ))}
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => setDialog({ bank: c.currency })}>Total del banco</Button>
            <Button mode="contained" disabled={/^0+(\.0+)?$/.test(c.outstanding)} onPress={() => setDialog({ pay: c.currency })}>
              Pagar
            </Button>
          </Card.Actions>
        </Card>
      ))}
      <Button mode="outlined" icon="plus" onPress={() => setDialog('charge')}>
        Agregar cargo (interés, multa, impuesto)
      </Button>
      <View style={{ height: 8 }} />

      {dialog === 'dates' && <PeriodDatesDialog walletId={id ?? ''} period={period} visible onDismiss={close} />}
      {dialog === 'charge' && <ChargeDialog walletId={id ?? ''} periodId={period.id} currencies={statement.currencies.length ? statement.currencies.map((c) => c.currency) : ['ARS']} visible onDismiss={close} />}
      {typeof dialog === 'object' && dialog && 'bank' in dialog && line(dialog.bank) && (
        <BankTotalDialog walletId={id ?? ''} periodId={period.id} line={line(dialog.bank)!} visible onDismiss={close} />
      )}
      {typeof dialog === 'object' && dialog && 'pay' in dialog && line(dialog.pay) && (
        <PayStatementDialog walletId={id ?? ''} periodId={period.id} line={line(dialog.pay)!} visible onDismiss={close} />
      )}
      {typeof dialog === 'object' && dialog && 'move' in dialog && (
        <MoveInstallmentDialog walletId={id ?? ''} installment={dialog.move} periods={allPeriods.filter((p) => p.id !== period.id)} visible onDismiss={close} />
      )}
    </ScreenContainer>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
      <Text variant={strong ? 'titleSmall' : 'bodyMedium'}>{label}</Text>
      <Text variant={strong ? 'titleSmall' : 'bodyMedium'}>{value}</Text>
    </View>
  );
}
