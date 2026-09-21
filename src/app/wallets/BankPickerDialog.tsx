import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Dialog, HelperText, List, Portal, TextInput } from 'react-native-paper';
import { ApiRequestError, useBanks, useCreateBank } from '@/core-react';

/**
 * Selector de banco con alta contextual: si el banco no existe se crea en el propio selector
 * y se vuelve al formulario con el banco ya seleccionado (el borrador no se pierde).
 */
export function BankPickerDialog({ visible, onDismiss, onSelect }: { visible: boolean; onDismiss: () => void; onSelect: (id: string) => void }) {
  const banks = useBanks();
  const create = useCreateBank();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setCreating(false);
    setName('');
    setError(null);
    onDismiss();
  };

  const submit = async () => {
    setError(null);
    try {
      const bank = await create.mutateAsync({ name });
      onSelect(bank.id);
      close();
    } catch (e) {
      setError(e instanceof ApiRequestError ? (e.fieldErrors.name ?? e.message) : 'No se pudo crear el banco');
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={close}>
        <Dialog.Title>{creating ? 'Nuevo banco' : 'Elegir banco'}</Dialog.Title>
        {creating ? (
          <Dialog.Content>
            <TextInput mode="outlined" label="Nombre del banco" accessibilityLabel="Nombre del banco" value={name} onChangeText={setName} autoFocus />
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          </Dialog.Content>
        ) : (
          <Dialog.ScrollArea style={{ maxHeight: 320 }}>
            <ScrollView>
              <List.Item title="+ Crear banco" disabled={!visible} left={(p) => <List.Icon {...p} icon="plus" />} onPress={() => setCreating(true)} />
              {banks.isPending && <List.Item title="Cargando…" />}
              {banks.isError && <List.Item title="No se pudieron cargar los bancos" />}
              {(banks.data ?? []).map((b) => (
                <List.Item
                  key={b.id}
                  title={b.name}
                  disabled={!visible}
                  onPress={() => {
                    onSelect(b.id);
                    close();
                  }}
                />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
        )}
        <Dialog.Actions>
          {creating && <Button onPress={() => setCreating(false)}>Volver</Button>}
          {creating ? (
            <Button onPress={() => void submit()} loading={create.isPending} disabled={create.isPending || name.trim().length === 0}>
              Crear y elegir
            </Button>
          ) : (
            <Button onPress={close}>Cerrar</Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
