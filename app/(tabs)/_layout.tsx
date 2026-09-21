import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';
import { TABS } from '@/layout';
import { FONT, headerColors } from '@/ui-system';

/** Tabs con cabecera verde y un botón flotante "+" siempre visible para registrar un movimiento. */
export default function TabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const header = headerColors(theme);
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
          headerStyle: { backgroundColor: header.background },
          headerTintColor: header.foreground,
          headerTitleStyle: { fontFamily: FONT.medium },
          tabBarLabelStyle: { fontFamily: FONT.regular },
        }}
      >
        {TABS.map((t) => (
          <Tabs.Screen
            key={t.name}
            name={t.name}
            options={{
              title: t.title,
              tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={t.icon} color={color} size={size} />,
            }}
          />
        ))}
      </Tabs>
      <FAB
        icon="plus"
        accessibilityLabel="Nuevo movimiento"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => router.push('/movement-new')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fab: { position: 'absolute', right: 16, bottom: 72, borderRadius: 32 },
});
