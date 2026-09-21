import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';

/**
 * Contenedor de pantalla. Con `title` muestra la cabecera verde (Appbar de Paper); con `onBack`, la flecha de volver.
 * Las pantallas de tabs no pasan `title`: su cabecera la pone el navegador de tabs.
 */
export function ScreenContainer({ children, title, onBack, bottomInset = 0 }: { children: ReactNode; title?: string; onBack?: () => void; bottomInset?: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {title !== undefined && (
        <Appbar.Header mode="small" style={{ backgroundColor: theme.colors.primary }} statusBarHeight={0}>
          {onBack && <Appbar.BackAction onPress={onBack} color={theme.colors.onPrimary} accessibilityLabel="Volver" />}
          <Appbar.Content title={title} titleStyle={{ color: theme.colors.onPrimary }} />
        </Appbar.Header>
      )}
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: 16 + bottomInset }]}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' },
});
