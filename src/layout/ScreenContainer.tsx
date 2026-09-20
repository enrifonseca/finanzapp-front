import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export function ScreenContainer({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ content: { padding: 16, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' } });
