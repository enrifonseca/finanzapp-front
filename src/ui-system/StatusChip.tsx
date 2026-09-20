import { Chip, useTheme } from 'react-native-paper';

export type StatusTone = 'neutral' | 'positive' | 'negative';

/** Chip de estado sin dependencias de API ni dominio. */
export function StatusChip({ label, tone }: { label: string; tone: StatusTone }) {
  const theme = useTheme();
  const bg = tone === 'positive' ? theme.colors.primaryContainer : tone === 'negative' ? theme.colors.errorContainer : theme.colors.surfaceVariant;
  return (
    <Chip compact style={{ backgroundColor: bg, alignSelf: 'flex-start' }} accessibilityLabel={label}>
      {label}
    </Chip>
  );
}
