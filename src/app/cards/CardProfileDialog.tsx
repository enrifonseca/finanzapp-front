import { useState } from 'react';
import { HelperText, Text, TextInput } from 'react-native-paper';
import { useUpdateCardProfile, type CardProfile } from '@/core-react';
import { FormDialog } from '../common/FormDialog';

const parseDay = (t: string): number | null | 'invalid' => {
  if (t.trim() === '') return null;
  const n = Number(t);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : 'invalid';
};

/** Día de cierre y de vencimiento del mes. Opcionales: vacío = sin cargar (las compras quedan sin período). */
export function CardProfileDialog({ walletId, profile, visible, onDismiss }: { walletId: string; profile: CardProfile; visible: boolean; onDismiss: () => void }) {
  const update = useUpdateCardProfile(walletId);
  const [close, setClose] = useState(profile.nominalCloseDay?.toString() ?? '');
  const [due, setDue] = useState(profile.nominalDueDay?.toString() ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);

  return (
    <FormDialog
      title="Días de cierre y vencimiento"
      visible={visible}
      onDismiss={onDismiss}
      submitLabel="Guardar"
      onSubmit={async () => {
        const c = parseDay(close);
        const d = parseDay(due);
        if (c === 'invalid' || d === 'invalid') {
          setFieldError('Los días van de 1 a 31');
          throw new Error('validación');
        }
        setFieldError(null);
        await update.mutateAsync({ nominalCloseDay: c, nominalDueDay: d });
      }}
    >
      <Text variant="bodySmall">
        {profile.billingMode === 'FIXED_PATTERN'
          ? 'Con estos días la app propone los períodos siguientes como estimados, que podés corregir.'
          : 'Valen para el período actual: los meses siguientes pueden cambiar, así que los cargás vos.'}
      </Text>
      <TextInput mode="outlined" label="Día de cierre del mes" accessibilityLabel="Día de cierre" value={close} onChangeText={setClose} keyboardType="number-pad" />
      <TextInput mode="outlined" label="Día de vencimiento del mes" accessibilityLabel="Día de vencimiento" value={due} onChangeText={setDue} keyboardType="number-pad" />
      <HelperText type="error" visible={!!fieldError}>
        {fieldError}
      </HelperText>
    </FormDialog>
  );
}
