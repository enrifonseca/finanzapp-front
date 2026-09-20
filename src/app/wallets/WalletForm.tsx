import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Button, Chip, HelperText, RadioButton, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { z } from 'zod';
import { ApiRequestError, useBanks, useCreateWallet, useCurrencies, useMe, type BillingMode, type CreateWalletBody, type Wallet } from '@/core-react';
import { AddCurrencyDialog } from './AddCurrencyDialog';
import { BankPickerDialog } from './BankPickerDialog';
import { BILLING_LABEL } from './labels';

const TYPES = ['CASH', 'DEBIT', 'CREDIT'] as const;
const MODES = ['FIXED_PATTERN', 'VARIABLE_PER_PERIOD'] as const;

const Form = z
  .object({
    name: z.string().trim().min(1, 'Ingresá un nombre').max(80, 'Máximo 80 caracteres'),
    type: z.enum(TYPES, { message: 'Elegí un tipo de billetera' }),
    currencies: z.array(z.string()).min(1, 'Elegí al menos una moneda'),
    bankId: z.string().optional(),
    locationText: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
    billingMode: z.enum(MODES).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type !== 'CASH' && !v.bankId) ctx.addIssue({ code: 'custom', path: ['bankId'], message: 'Elegí un banco' });
    if (v.type === 'CREDIT' && !v.billingMode) ctx.addIssue({ code: 'custom', path: ['billingMode'], message: 'Indicá si las fechas son fijas o variables' });
  });
type Values = z.infer<typeof Form>;

const SERVER_FIELD: Record<string, keyof Values> = { name: 'name', type: 'type', currencies: 'currencies', bankId: 'bankId', locationText: 'locationText', creditProfile: 'billingMode' };

function toBody(v: Values): CreateWalletBody {
  return {
    name: v.name,
    type: v.type,
    currencies: v.currencies,
    ...(v.type !== 'CASH' && v.bankId ? { bankId: v.bankId } : {}),
    ...(v.type === 'CASH' && v.locationText ? { locationText: v.locationText } : {}),
    ...(v.type === 'CREDIT' && v.billingMode ? { creditProfile: { billingMode: v.billingMode as BillingMode } } : {}),
  };
}

/**
 * Alta de billetera (FLUJO-001 §4 y 8 bis). Banco y moneda se crean/habilitan en diálogos sobre esta
 * misma pantalla: el borrador vive en el formulario y no se pierde. No se presume ninguna moneda ni fecha.
 */
export function WalletForm({ submitLabel = 'Crear billetera', onCreated }: { submitLabel?: string; onCreated: (wallet: Wallet) => void }) {
  const me = useMe();
  const currencies = useCurrencies();
  const banks = useBanks();
  const createWallet = useCreateWallet();
  const [bankDialog, setBankDialog] = useState(false);
  const [currencyDialog, setCurrencyDialog] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // La moneda preferida (si el usuario ya eligió una) se SUGIERE y es editable; nunca se asume ARS.
  const preferred = me.data?.preferredCurrencyCode;
  const { control, handleSubmit, watch, setValue, setError, formState } = useForm<Values>({
    resolver: zodResolver(Form),
    defaultValues: { name: '', currencies: preferred ? [preferred] : [], locationText: '' },
  });
  const type = watch('type');
  const selectedBank = (banks.data ?? []).find((b) => b.id === watch('bankId'));
  const enabled = (currencies.data ?? []).filter((c) => c.enabled);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      onCreated(await createWallet.mutateAsync(toBody(values)));
    } catch (e) {
      if (!(e instanceof ApiRequestError)) return setFormError('Ocurrió un error inesperado. Reintentá.');
      if (e.code === 'NETWORK') return setFormError('No hay conexión con el servidor. Tu borrador se conserva: reintentá cuando vuelva la red.');
      const mapped = Object.entries(e.fieldErrors).filter(([f]) => SERVER_FIELD[f]);
      mapped.forEach(([f, msg]) => setError(SERVER_FIELD[f]!, { message: msg }));
      if (mapped.length === 0) setFormError(e.message);
    }
  });

  return (
    <View style={{ gap: 12 }}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput label="Nombre de la billetera" accessibilityLabel="Nombre de la billetera" value={value} onChangeText={onChange} onBlur={onBlur} error={!!formState.errors.name} />
        )}
      />
      <HelperText type="error" visible={!!formState.errors.name}>
        {formState.errors.name?.message}
      </HelperText>

      <Text variant="titleSmall">Tipo</Text>
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <SegmentedButtons
            value={value ?? ''}
            onValueChange={onChange}
            buttons={[
              { value: 'CASH', label: 'Efectivo', accessibilityLabel: 'Tipo Efectivo' },
              { value: 'DEBIT', label: 'Débito', accessibilityLabel: 'Tipo Débito' },
              { value: 'CREDIT', label: 'Crédito', accessibilityLabel: 'Tipo Crédito' },
            ]}
          />
        )}
      />
      <HelperText type="error" visible={!!formState.errors.type}>
        {formState.errors.type?.message}
      </HelperText>

      <Text variant="titleSmall">Monedas admitidas</Text>
      <Controller
        control={control}
        name="currencies"
        render={({ field: { onChange, value } }) => (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {enabled.map((c) => (
              <Chip
                key={c.code}
                selected={value.includes(c.code)}
                showSelectedOverlay
                accessibilityLabel={`Moneda ${c.code}`}
                onPress={() => onChange(value.includes(c.code) ? value.filter((x) => x !== c.code) : [...value, c.code])}
              >
                {c.code}
              </Chip>
            ))}
            <Chip icon="plus" accessibilityLabel="Agregar moneda" onPress={() => setCurrencyDialog(true)}>
              Agregar moneda
            </Chip>
          </View>
        )}
      />
      {currencies.data && enabled.length === 0 && <HelperText type="info" visible>Todavía no habilitaste ninguna moneda: agregá una.</HelperText>}
      <HelperText type="error" visible={!!formState.errors.currencies}>
        {formState.errors.currencies?.message}
      </HelperText>

      {type === 'CASH' && (
        <Controller
          control={control}
          name="locationText"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput label="Ubicación o referencia (opcional)" accessibilityLabel="Ubicación" value={value ?? ''} onChangeText={onChange} onBlur={onBlur} />
          )}
        />
      )}

      {(type === 'DEBIT' || type === 'CREDIT') && (
        <View style={{ gap: 4 }}>
          <Text variant="titleSmall">Banco</Text>
          <Button mode="outlined" icon="bank" onPress={() => setBankDialog(true)} accessibilityLabel="Elegir banco">
            {selectedBank ? selectedBank.name : 'Elegir banco'}
          </Button>
          <HelperText type="error" visible={!!formState.errors.bankId}>
            {formState.errors.bankId?.message}
          </HelperText>
        </View>
      )}

      {type === 'CREDIT' && (
        <View style={{ gap: 4 }}>
          <Text variant="titleSmall">¿Cómo son las fechas de cierre y vencimiento?</Text>
          <Controller
            control={control}
            name="billingMode"
            render={({ field: { onChange, value } }) => (
              <RadioButton.Group onValueChange={onChange} value={value ?? ''}>
                {MODES.map((m) => (
                  <RadioButton.Item key={m} value={m} label={BILLING_LABEL[m]} accessibilityLabel={BILLING_LABEL[m]} />
                ))}
              </RadioButton.Group>
            )}
          />
          <HelperText type="info" visible>
            Los períodos se pueden cargar más adelante: no se inventan fechas.
          </HelperText>
          <HelperText type="error" visible={!!formState.errors.billingMode}>
            {formState.errors.billingMode?.message}
          </HelperText>
        </View>
      )}

      {formError && (
        <Text accessibilityRole="alert" style={{ color: '#B3261E' }}>
          {formError}
        </Text>
      )}
      <Button mode="contained" onPress={() => void onSubmit()} loading={formState.isSubmitting} disabled={formState.isSubmitting}>
        {submitLabel}
      </Button>

      <BankPickerDialog visible={bankDialog} onDismiss={() => setBankDialog(false)} onSelect={(id) => setValue('bankId', id, { shouldValidate: true })} />
      <AddCurrencyDialog
        visible={currencyDialog}
        onDismiss={() => setCurrencyDialog(false)}
        onAdded={(code) => setValue('currencies', [...new Set([...watch('currencies'), code])], { shouldValidate: true })}
      />
    </View>
  );
}
