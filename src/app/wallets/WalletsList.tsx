import { ScrollView, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useWallets } from '@/core-react';
import { EmptyState } from '@/layout';
import { WalletCard } from './WalletCard';

/** Billeteras con estados de carga, error y vacío. `carousel` (Inicio) las muestra en horizontal; `list`, apiladas. */
export function WalletsList({ onCreate, variant = 'list' }: { onCreate: () => void; variant?: 'list' | 'carousel' }) {
  const wallets = useWallets();
  if (wallets.isPending) return <Text>Cargando billeteras…</Text>;
  if (wallets.isError) {
    return (
      <View style={{ gap: 8 }}>
        <Text accessibilityRole="alert">No se pudieron cargar las billeteras.</Text>
        <Button onPress={() => void wallets.refetch()}>Reintentar billeteras</Button>
      </View>
    );
  }
  if (wallets.data.length === 0) {
    return (
      <View style={{ gap: 8 }}>
        <EmptyState title="Todavía no tenés billeteras" description="Creá una para empezar a registrar movimientos." />
        <Button mode="contained" onPress={onCreate}>
          Crear billetera
        </Button>
      </View>
    );
  }
  const cards = wallets.data.map((w) => <WalletCard key={w.id} wallet={w} compact={variant === 'carousel'} />);
  return (
    <View style={{ gap: 12 }}>
      {variant === 'carousel' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
          {cards}
        </ScrollView>
      ) : (
        cards
      )}
      <Button mode="outlined" icon="plus" onPress={onCreate}>
        Nueva billetera
      </Button>
    </View>
  );
}
