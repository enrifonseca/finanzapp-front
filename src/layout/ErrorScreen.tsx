import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

export function ErrorScreen({ message, onRetry, onSecondary, secondaryLabel }: { message: string; onRetry: () => void; onSecondary?: () => void; secondaryLabel?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: theme.colors.background }]}>
      <Text accessibilityRole="alert" variant="bodyLarge" style={{ textAlign: 'center' }}>
        {message}
      </Text>
      <Button mode="contained" onPress={onRetry}>
        Reintentar
      </Button>
      {onSecondary && <Button onPress={onSecondary}>{secondaryLabel}</Button>}
    </View>
  );
}

const styles = StyleSheet.create({ box: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 } });
