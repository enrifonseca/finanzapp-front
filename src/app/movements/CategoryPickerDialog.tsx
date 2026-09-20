import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Dialog, HelperText, List, Portal, TextInput } from 'react-native-paper';
import { ApiRequestError, useCategories, useCreateCategory, type OperationFamily } from '@/core-react';

/** Selector de categoría con alta contextual: nombre y familia ya elegida; vuelve con la categoría seleccionada. */
export function CategoryPickerDialog({ family, visible, onDismiss, onSelect }: { family: OperationFamily; visible: boolean; onDismiss: () => void; onSelect: (id: string) => void }) {
  const categories = useCategories(family);
  const create = useCreateCategory();
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
      const c = await create.mutateAsync({ family, name });
      onSelect(c.id);
      close();
    } catch (e) {
      setError(e instanceof ApiRequestError ? (e.fieldErrors.name ?? e.message) : 'No se pudo crear la categoría');
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={close}>
        <Dialog.Title>{creating ? 'Nueva categoría' : 'Elegir categoría'}</Dialog.Title>
        {creating ? (
          <Dialog.Content>
            <TextInput label="Nombre de la categoría" accessibilityLabel="Nombre de la categoría" value={name} onChangeText={setName} autoFocus />
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          </Dialog.Content>
        ) : (
          <Dialog.ScrollArea style={{ maxHeight: 320 }}>
            <ScrollView>
              <List.Item title="+ Crear categoría" disabled={!visible} left={(p) => <List.Icon {...p} icon="plus" />} onPress={() => setCreating(true)} />
              {categories.isPending && <List.Item title="Cargando…" />}
              {categories.isError && <List.Item title="No se pudieron cargar las categorías" />}
              {(categories.data ?? []).map((c) => (
                <List.Item key={c.id} title={c.name} disabled={!visible} onPress={() => (onSelect(c.id), close())} />
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
