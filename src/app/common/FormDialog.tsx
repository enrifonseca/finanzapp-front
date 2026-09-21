import { useState, type ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';
import { describeError } from '@/core-react';
import { ErrorText } from '@/ui-system';

/**
 * Diálogo de formulario: ejecuta `onSubmit`; si falla muestra el error del servidor y se queda abierto
 * (el borrador se conserva); si sale bien se cierra.
 */
export function FormDialog({
  title, visible, onDismiss, onSubmit, submitLabel, children, disabled = false,
}: { title: string; visible: boolean; onDismiss: () => void; onSubmit: () => Promise<void>; submitLabel: string; children: ReactNode; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await onSubmit();
      onDismiss();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.ScrollArea style={{ maxHeight: 460 }}>
          <ScrollView contentContainerStyle={{ paddingVertical: 8, gap: 4 }}>{children}</ScrollView>
        </Dialog.ScrollArea>
        {error && (
          <Dialog.Content>
            <ErrorText>{error}</ErrorText>
          </Dialog.Content>
        )}
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button onPress={() => void submit()} loading={busy} disabled={busy || disabled}>
            {submitLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
