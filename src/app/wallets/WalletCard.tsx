import { View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import type { Wallet } from '@/core-react';
import { BILLING_LABEL, TYPE_LABEL } from './labels';

/** Tarjeta de billetera. El saldo desconocido se muestra como "sin saldo inicial", nunca como 0. */
export function WalletCard({ wallet }: { wallet: Wallet }) {
  const subtitle = [TYPE_LABEL[wallet.type], wallet.bankName, wallet.locationText].filter(Boolean).join(' · ');
  return (
    <Card accessibilityLabel={`Billetera ${wallet.name}`}>
      <Card.Title title={wallet.name} subtitle={subtitle} />
      <Card.Content style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {wallet.currencies.map((c) => (
            <Chip key={c} compact>
              {c}
            </Chip>
          ))}
        </View>
        {wallet.balances.map((b) => (
          <Text key={b.currency} variant="bodySmall">
            {b.currency}: sin saldo inicial
          </Text>
        ))}
        {wallet.creditProfile && (
          <Text variant="bodySmall">
            {BILLING_LABEL[wallet.creditProfile.billingMode]}
            {wallet.creditProfile.setupStatus === 'PARTIAL' ? ' · períodos sin configurar' : ''}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}
