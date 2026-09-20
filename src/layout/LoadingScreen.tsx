import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';

export function LoadingScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: theme.colors.background }]} accessibilityLabel="Cargando">
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({ box: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
