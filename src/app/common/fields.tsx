import { HelperText, TextInput } from 'react-native-paper';
import { formatDate, parseDate } from '@/core-react';

/** Importe decimal: acepta punto o coma; el envío lo normaliza a "1234.50". */
export function AmountInput({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string | undefined }) {
  return (
    <>
      <TextInput mode="outlined" label={label} accessibilityLabel={label} value={value} onChangeText={onChange} keyboardType="decimal-pad" error={!!error} />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
    </>
  );
}

/** Fecha que se ve y se escribe DD/MM/AAAA. */
export function DateInput({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string | undefined }) {
  return (
    <>
      <TextInput mode="outlined" label={`${label} (DD/MM/AAAA)`} accessibilityLabel={label} value={value} onChangeText={onChange} error={!!error} />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
    </>
  );
}

/** ISO -> DD/MM/AAAA para precargar un campo; vacío si no hay fecha. */
export const isoToField = (iso: string | null | undefined): string => (iso ? formatDate(iso) : '');
/** DD/MM/AAAA -> ISO, o null si es inválida o está vacía. */
export const fieldToIso = (text: string): string | null => parseDate(text);
