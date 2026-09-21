import { StyleSheet, View } from 'react-native';
import { Chip, Surface, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { dayMonth, formatSigned, type Operation } from '@/core-react';

/** Fecha con la que se muestra la operación: cuándo se movió el dinero; si no, la fecha económica; si no, la de registro. */
export function operationDate(op: Operation): string {
  return op.settlements[0]?.effectiveDate ?? op.economicComponents.find((c) => c.economicDate)?.economicDate ?? op.recordedAt.slice(0, 10);
}

/** Cada moneda por separado, con signo según la familia (nunca sumadas entre sí). */
export function operationAmounts(op: Operation): string[] {
  return op.economicComponents.map((c) => formatSigned(c.amount, c.currency, op.family));
}

/** Fila de operación: bloque de fecha, concepto/categoría y monto de color según ingreso o egreso. */
export function OperationRow({ op, onPress }: { op: Operation; onPress: () => void }) {
  const theme = useTheme();
  const { day, month } = dayMonth(operationDate(op));
  const income = op.family === 'INCOME';
  const amountColor = op.state === 'REVERSED' ? theme.colors.outline : income ? theme.colors.primary : theme.colors.error;
  const detail = [op.categoryName, op.referenceName].filter(Boolean).join(' · ');
  return (
    <Surface elevation={1} style={[styles.surface, { borderRadius: theme.roundness * 2, borderLeftColor: income ? theme.colors.primary : theme.colors.error }]}>
      <TouchableRipple onPress={onPress} accessibilityLabel={`Operación ${op.concept}`} accessibilityRole="button" borderless style={{ borderRadius: theme.roundness * 2 }}>
        <View style={styles.row}>
          <View style={[styles.date, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>
              {day}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
              {month}
            </Text>
          </View>
          <View style={styles.body}>
            <Text variant="titleSmall" numberOfLines={1}>
              {op.concept}
            </Text>
            {detail !== '' && (
              <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                {detail}
              </Text>
            )}
            {op.state === 'REVERSED' && <Chip compact style={styles.chip}>Revertida</Chip>}
          </View>
          <View style={styles.amounts}>
            {operationAmounts(op).map((a) => (
              <Text key={a} variant="titleSmall" style={{ color: amountColor, fontWeight: '700', textDecorationLine: op.state === 'REVERSED' ? 'line-through' : 'none' }}>
                {a}
              </Text>
            ))}
          </View>
        </View>
      </TouchableRipple>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: { borderLeftWidth: 4, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  date: { width: 46, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
  body: { flex: 1, gap: 2 },
  amounts: { alignItems: 'flex-end', gap: 2 },
  chip: { alignSelf: 'flex-start' },
});
