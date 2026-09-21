import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, List, Text } from 'react-native-paper';
import { addDecimal, formatDate, formatMoney, formatDecimal, parseDecimal, useCardOverview, useCardProfile, useWallets, type CardOverview } from '@/core-react';
import { ErrorScreen, ScreenContainer } from '@/layout';
import { BILLING_LABEL } from '../wallets/labels';
import { CardProfileDialog } from './CardProfileDialog';
import { MoveInstallmentDialog, type MovableInstallment } from './MoveInstallmentDialog';
import { PeriodDatesDialog } from './PeriodDatesDialog';

/** Deuda total por moneda = saldo pendiente de los resúmenes + cuotas sin asignar. Cada moneda por separado. */
export function debtByCurrency(o: CardOverview): Array<[string, string]> {
  const sums = new Map<string, { units: bigint; scale: number }>();
  const add = (cur: string, v: string) => {
    const d = parseDecimal(v);
    if (d) sums.set(cur, addDecimal(sums.get(cur) ?? { units: 0n, scale: 0 }, d));
  };
  for (const s of o.periods) for (const c of s.currencies) add(c.currency, c.outstanding);
  for (const u of o.unassigned) add(u.currency, u.amount);
  return [...sums].map(([c, d]) => [c, formatDecimal(d)]);
}

export function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const walletId = id ?? '';
  const wallets = useWallets();
  const profile = useCardProfile(walletId);
  const overview = useCardOverview(walletId);
  const [dialog, setDialog] = useState<null | 'profile' | 'period' | { move: MovableInstallment }>(null);
  const wallet = wallets.data?.find((w) => w.id === walletId);
  const title = wallet?.name ?? 'Tarjeta';

  if (profile.isPending || overview.isPending) return <ScreenContainer title={title} onBack={() => router.back()}><Text>Cargando…</Text></ScreenContainer>;
  if (profile.isError || overview.isError) return <ErrorScreen message="No se pudo cargar la tarjeta." onRetry={() => { void profile.refetch(); void overview.refetch(); }} onSecondary={() => router.back()} secondaryLabel="Volver" />;
  const p = profile.data;
  const o = overview.data;
  const debts = debtByCurrency(o);

  return (
    <ScreenContainer title={title} onBack={() => router.back()}>
      <Card mode="outlined">
        <Card.Title title="Deuda" subtitle="Cada moneda por separado" />
        <Card.Content style={{ gap: 2 }}>
          {debts.length === 0 && <Text>Sin deuda registrada.</Text>}
          {debts.map(([c, v]) => (
            <Text key={c} variant="titleMedium" accessibilityLabel={`Deuda ${c}`}>{formatMoney(v, c)}</Text>
          ))}
        </Card.Content>
      </Card>

      <Card mode="outlined">
        <Card.Title title="Fechas de la tarjeta" subtitle={BILLING_LABEL[p.billingMode]} />
        <Card.Content style={{ gap: 2 }}>
          <Text>{`Día de cierre: ${p.nominalCloseDay ?? 'sin cargar'}`}</Text>
          <Text>{`Día de vencimiento: ${p.nominalDueDay ?? 'sin cargar'}`}</Text>
          {(p.nominalCloseDay === null || p.nominalDueDay === null) && <Text variant="bodySmall">Sin estos días, las compras quedan con período y vencimiento desconocidos.</Text>}
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setDialog('profile')}>Editar días</Button>
        </Card.Actions>
      </Card>

      <Text variant="titleMedium">Resúmenes</Text>
      {o.periods.length === 0 && <Text>Todavía no hay resúmenes.</Text>}
      {o.periods.map((s) => (
        <Card key={s.period.id} mode="outlined" onPress={() => router.push({ pathname: '/card/[id]/period/[periodId]', params: { id: walletId, periodId: s.period.id } })} accessibilityLabel={`Resumen ${s.period.cycleLabel}`}>
          <Card.Title
            title={`Resumen ${s.period.cycleLabel}`}
            subtitle={s.period.dueDate ? `Vence ${formatDate(s.period.dueDate)}` : 'Vencimiento sin cargar'}
            right={() => <Chip compact style={{ marginRight: 12 }}>{s.period.dateConfidence === 'ESTIMATED' ? 'Estimado' : 'Confirmado'}</Chip>}
          />
          <Card.Content style={{ gap: 2 }}>
            {s.currencies.map((c) => (
              <Text key={c.currency}>{`${c.currency}: pendiente ${formatMoney(c.outstanding, c.currency)} de ${formatMoney(c.amountDue, c.currency)}`}</Text>
            ))}
          </Card.Content>
        </Card>
      ))}
      <Button mode="outlined" icon="plus" onPress={() => setDialog('period')}>
        Cargar un período
      </Button>

      {o.unassigned.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text variant="titleMedium">Cuotas sin resumen asignado</Text>
          <Text variant="bodySmall">Se guardaron sin período porque las fechas todavía no están cargadas. Cargá el período y movelas.</Text>
          {o.unassigned.map((u) => (
            <List.Item
              key={u.id}
              title={u.concept}
              description={`Cuota ${u.number}/${u.count} · compra del ${formatDate(u.purchaseDate)}`}
              right={() => <Text>{formatMoney(u.amount, u.currency)}</Text>}
              onPress={() => setDialog({ move: { id: u.id, concept: u.concept, number: u.number, count: u.count, amount: u.amount, currency: u.currency, currentPeriodId: null } })}
              accessibilityLabel={`Sin asignar ${u.concept} ${u.number}`}
            />
          ))}
        </View>
      )}

      {dialog === 'profile' && <CardProfileDialog walletId={walletId} profile={p} visible onDismiss={() => setDialog(null)} />}
      {dialog === 'period' && <PeriodDatesDialog walletId={walletId} period={null} visible onDismiss={() => setDialog(null)} />}
      {typeof dialog === 'object' && dialog && 'move' in dialog && (
        <MoveInstallmentDialog walletId={walletId} installment={dialog.move} periods={o.periods.map((s) => s.period)} visible onDismiss={() => setDialog(null)} />
      )}
    </ScreenContainer>
  );
}
