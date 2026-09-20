import { ScrollView } from 'react-native';
import { Button, Dialog, HelperText, List, Portal } from 'react-native-paper';
import { useCurrencies, useEnableCurrency } from '@/core-react';

/** Habilita una moneda del catálogo sin salir del formulario (FLUJO-001 §4). */
export function AddCurrencyDialog({ visible, onDismiss, onAdded }: { visible: boolean; onDismiss: () => void; onAdded: (code: string) => void }) {
  const currencies = useCurrencies();
  const enable = useEnableCurrency();
  const available = (currencies.data ?? []).filter((c) => !c.enabled);
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Agregar moneda</Dialog.Title>
        <Dialog.ScrollArea style={{ maxHeight: 320 }}>
          <ScrollView>
            {currencies.isPending && <List.Item title="Cargando…" />}
            {currencies.isError && <List.Item title="No se pudo cargar el catálogo de monedas" />}
            {available.map((c) => (
              <List.Item
                key={c.code}
                title={`${c.code} · ${c.displayName}`}
                disabled={enable.isPending || !visible} // !visible: el diálogo animando su cierre no debe aceptar toques
                onPress={async () => {
                  try {
                    await enable.mutateAsync({ code: c.code });
                    onAdded(c.code);
                    onDismiss();
                  } catch {
                    /* el error se muestra abajo */
                  }
                }}
              />
            ))}
            {currencies.data && available.length === 0 && <List.Item title="Ya habilitaste todas las monedas del catálogo" />}
          </ScrollView>
        </Dialog.ScrollArea>
        {enable.isError && <HelperText type="error">No se pudo habilitar la moneda. Reintentá.</HelperText>}
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cerrar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
