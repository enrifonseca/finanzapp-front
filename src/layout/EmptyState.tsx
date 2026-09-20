import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

/** Estado vacío estándar de una sección todavía no construida. */
export function EmptyState({ title, description }: { title: string; description: string }) {
  const theme = useTheme();
  return (
    <View style={styles.box} accessibilityRole="summary">
      <Text variant="titleLarge">{title}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ box: { alignItems: 'center', gap: 8, paddingVertical: 48 } });
