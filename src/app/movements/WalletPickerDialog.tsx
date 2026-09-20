import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Dialog, List, Portal } from 'react-native-paper';
import { useWallets, type Wallet } from '@/core-react';
import { WalletForm } from '../wallets/WalletForm';
import { TYPE_LABEL } from '../wallets/labels';

/**
 * Selector de billetera de una línea, con alta contextual ANIDADA: "+ Crear billetera" abre el formulario de
 * billetera (que a su vez puede crear banco/moneda) y al terminar vuelve a la línea con la billetera elegida.
 * Las billeteras de crédito no se ofrecen: las compras con tarjeta llegan en la Fase 4.
 */
export function WalletPickerDialog({ visible, onDismiss, onSelect }: { visible: boolean; onDismiss: () => void; onSelect: (w: Wallet) => void }) {
  const wallets = useWallets();
  const [creating, setCreating] = useState(false);
  const usable = (wallets.data ?? []).filter((w) => w.type !== 'CREDIT');

  const close = () => {
    setCreating(false);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={close}>
        <Dialog.Title>{creating ? 'Nueva billetera' : 'Elegir billetera'}</Dialog.Title>
        <Dialog.ScrollArea style={{ maxHeight: 460 }}>
          <ScrollView>
            {creating ? (
              <WalletForm
                onCreated={(w) => {
                  onSelect(w);
                  close();
                }}
              />
            ) : (
              <>
                <List.Item title="+ Crear billetera" disabled={!visible} left={(p) => <List.Icon {...p} icon="plus" />} onPress={() => setCreating(true)} />
                {wallets.isPending && <List.Item title="Cargando…" />}
                {wallets.isError && <List.Item title="No se pudieron cargar las billeteras" />}
                {usable.map((w) => (
                  <List.Item
                    key={w.id}
                    title={w.name}
                    description={`${TYPE_LABEL[w.type]} · ${w.currencies.join(', ')}`}
                    disabled={!visible}
                    onPress={() => (onSelect(w), close())}
                  />
                ))}
              </>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => (creating ? setCreating(false) : close())}>{creating ? 'Volver' : 'Cerrar'}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
