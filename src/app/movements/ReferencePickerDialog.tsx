import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Dialog, HelperText, List, Portal, TextInput } from 'react-native-paper';
import { ApiRequestError, useCreateReference, useReferences, type ReferenceKind } from '@/core-react';

const KINDS: Array<[ReferenceKind, string]> = [
  ['ACCOUNT', 'Cuenta'], ['CLIENT', 'Cliente'], ['PROPERTY', 'Inmueble'], ['CONTRACT', 'Contrato'], ['SERVICE', 'Servicio'], ['OTHER', 'Otro'],
];

/** Referencia opcional (cuenta/cliente/inmueble…): se elige o se crea en el selector con nombre y código opcional. */
export function ReferencePickerDialog({ visible, onDismiss, onSelect }: { visible: boolean; onDismiss: () => void; onSelect: (id: string | null) => void }) {
  const refs = useReferences();
  const create = useCreateReference();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [kind, setKind] = useState<ReferenceKind>('OTHER');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setCreating(false);
    setName('');
    setCode('');
    setKind('OTHER');
    setError(null);
    onDismiss();
  };
  const submit = async () => {
    setError(null);
    try {
      // El código se envía TAL CUAL (ceros a la izquierda incluidos); solo se omite si está vacío.
      const r = await create.mutateAsync({ kind, displayName: name, ...(code.length > 0 ? { externalCodeText: code } : {}) });
      onSelect(r.id);
      close();
    } catch (e) {
      setError(e instanceof ApiRequestError ? (e.fieldErrors.displayName ?? e.message) : 'No se pudo crear la referencia');
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={close}>
        <Dialog.Title>{creating ? 'Nueva referencia' : 'Referencia (opcional)'}</Dialog.Title>
        {creating ? (
          <Dialog.Content style={{ gap: 8 }}>
            <TextInput label="Nombre (ej. Dpto 0027)" accessibilityLabel="Nombre de la referencia" value={name} onChangeText={setName} autoFocus />
            <TextInput label="Número de cuenta o cliente (opcional)" accessibilityLabel="Código de la referencia" value={code} onChangeText={setCode} autoCapitalize="none" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {KINDS.map(([k, label]) => (
                <Chip key={k} selected={kind === k} onPress={() => setKind(k)} accessibilityLabel={`Tipo ${label}`}>
                  {label}
                </Chip>
              ))}
            </View>
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          </Dialog.Content>
        ) : (
          <Dialog.ScrollArea style={{ maxHeight: 320 }}>
            <ScrollView>
              <List.Item title="+ Agregar cuenta o cliente" disabled={!visible} left={(p) => <List.Icon {...p} icon="plus" />} onPress={() => setCreating(true)} />
              <List.Item title="Sin referencia" disabled={!visible} onPress={() => (onSelect(null), close())} />
              {(refs.data ?? []).map((r) => (
                <List.Item key={r.id} title={r.displayName} description={r.externalCodeText ?? undefined} disabled={!visible} onPress={() => (onSelect(r.id), close())} />
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
