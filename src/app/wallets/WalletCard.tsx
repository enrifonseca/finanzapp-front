import { StyleSheet, View } from 'react-native';
import { Surface, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { formatMoney, type Wallet } from '@/core-react';
import { FONT } from '@/ui-system';
import { BILLING_LABEL, TYPE_LABEL } from './labels';

const isZero = (s: string) => /^-?0+(\.0+)?$/.test(s);

/**
 * Tarjeta de billetera (color de marca). El saldo desconocido se muestra como "sin saldo inicial", nunca como 0;
 * si hay movimientos se informa la variación REGISTRADA, que no es el saldo disponible.
 */
export function WalletCard({ wallet, compact = false, onPress }: { wallet: Wallet; compact?: boolean; onPress?: () => void }) {
  const theme = useTheme();
  const subtitle = [TYPE_LABEL[wallet.type], wallet.bankName, wallet.locationText].filter(Boolean).join(' · ');
  const fg = theme.colors.onPrimary;
  const body = (
    <Surface
      elevation={2}
      accessibilityLabel={`Billetera ${wallet.name}`}
      style={[styles.card, compact && styles.compact, { backgroundColor: theme.colors.primary, borderRadius: theme.roundness * 4 }]}
    >
      <Text variant="titleMedium" style={{ color: fg, fontFamily: FONT.bold }}>
        {wallet.name}
      </Text>
      <Text variant="bodySmall" style={{ color: fg, opacity: 0.85 }}>
        {subtitle}
      </Text>
      <View style={styles.lines}>
        {wallet.balances.map((b) => (
          <View key={b.currency} style={styles.line}>
            <Text variant="labelLarge" style={{ color: fg, width: 40 }}>
              {b.currency}
            </Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodySmall" style={{ color: fg, opacity: 0.9 }}>
                sin saldo inicial
              </Text>
              {!isZero(b.observedDelta) && (
                <Text variant="bodySmall" style={{ color: fg, fontFamily: FONT.bold }}>
                  {`Movimientos: ${formatMoney(b.observedDelta, b.currency)}`}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
      {wallet.creditProfile && (
        <Text variant="bodySmall" style={{ color: fg, opacity: 0.85 }}>
          {BILLING_LABEL[wallet.creditProfile.billingMode]}
          {wallet.creditProfile.setupStatus === 'PARTIAL' ? ' · períodos sin configurar' : ''}
        </Text>
      )}
    </Surface>
  );
  return onPress ? (
    <TouchableRipple onPress={onPress} accessibilityRole="button" accessibilityLabel={`Abrir ${wallet.name}`} borderless style={{ borderRadius: theme.roundness * 4 }}>
      {body}
    </TouchableRipple>
  ) : (
    body
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 4 },
  compact: { width: 260 },
  lines: { gap: 2, marginTop: 6 },
  line: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
});
