import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Button, Card, Chip, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { z } from 'zod';
import {
  ApiRequestError, addDecimal, formatDecimal, isZero, normalizeAmount, parseDecimal, useCategories, useCreateOperation, useReferences, useWallets,
  type CreateOperationBody, type Dec, type Operation, type OperationFamily, type Wallet,
} from '@/core-react';
import { CategoryPickerDialog } from './CategoryPickerDialog';
import { ReferencePickerDialog } from './ReferencePickerDialog';
import { WalletPickerDialog } from './WalletPickerDialog';
import { isIsoDate, todayLocal } from './dates';

const Line = z.object({
  walletId: z.string().min(1, 'Elegí una billetera'),
  currency: z.string().min(1, 'Elegí la moneda'),
  amount: z.string().refine((v) => {
    const d = parseDecimal(v);
    return !!d && !isZero(d);
  }, 'Ingresá un importe mayor que cero'),
});

const Form = z.object({
  family: z.enum(['INCOME', 'EXPENSE'], { message: 'Elegí Ingreso o Egreso' }),
  categoryId: z.string().optional(),
  concept: z.string().trim().min(1, 'Ingresá un concepto').max(120, 'Máximo 120 caracteres'),
  referenceId: z.string().optional(),
  date: z.string().refine(isIsoDate, 'Fecha inválida (AAAA-MM-DD)'),
  economicPeriod: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Período inválido (AAAA-MM)').or(z.literal('')).optional(),
  lines: z.array(Line).min(1),
});
type Values = z.infer<typeof Form>;

export interface MovementDraft {
  family?: OperationFamily;
  categoryId?: string;
  concept?: string;
  referenceId?: string;
}

/** Suma por moneda con aritmética decimal exacta: una operación de N monedas produce N sumas, nunca una suma cruzada. */
export function sumByCurrency(lines: ReadonlyArray<{ currency: string; amount: string }>): Array<[string, string]> {
  const sums = new Map<string, Dec>();
  for (const l of lines) {
    const d = parseDecimal(l.amount);
    if (d) sums.set(l.currency, addDecimal(sums.get(l.currency) ?? { units: 0n, scale: 0 }, d));
  }
  return [...sums].map(([c, d]) => [c, formatDecimal(d)]);
}

function toBody(v: Values): CreateOperationBody {
  const settlements = v.lines.map((l) => ({ walletId: l.walletId, currency: l.currency, amount: normalizeAmount(l.amount)!, effectiveDate: v.date }));
  return {
    family: v.family,
    ...(v.categoryId ? { categoryId: v.categoryId } : {}),
    concept: v.concept,
    ...(v.referenceId ? { referenceId: v.referenceId } : {}),
    ...(v.family === 'INCOME' && v.economicPeriod ? { economicPeriod: v.economicPeriod } : {}),
    economicComponents: sumByCurrency(settlements).map(([currency, amount]) => ({
      currency,
      amount,
      // Gasto: fecha económica explícita. Ingreso: solo período opcional; la fecha "ganado" queda desconocida (no se rellena con hoy).
      ...(v.family === 'EXPENSE' ? { economicDate: v.date } : {}),
    })),
    settlements,
  };
}

const SERVER_LINE = /^settlements\.(\d+)\.(walletId|currency|amount)$/;

/**
 * Registro de un movimiento inmediato (FLUJO-003). Todo selector reutilizable ofrece "crear" en contexto y vuelve
 * al mismo punto con el borrador intacto: categoría, referencia y billetera (que a su vez crea banco/moneda).
 */
export function MovementForm({ draft = {}, onCreated }: { draft?: MovementDraft; onCreated: (op: Operation) => void }) {
  const wallets = useWallets();
  const createOperation = useCreateOperation();
  const [formError, setFormError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | 'category' | 'reference' | { wallet: number }>(null);
  const [extraWallets, setExtraWallets] = useState<Wallet[]>([]);

  const { control, handleSubmit, watch, setValue, setError, formState } = useForm<Values>({
    resolver: zodResolver(Form),
    defaultValues: {
      family: draft.family, categoryId: draft.categoryId, concept: draft.concept ?? '', referenceId: draft.referenceId,
      date: todayLocal(), economicPeriod: '', lines: [{ walletId: '', currency: '', amount: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const family = watch('family');
  const lines = watch('lines');
  const categories = useCategories(family ?? 'EXPENSE');
  const refs = useReferences();
  const allWallets = [...(wallets.data ?? []), ...extraWallets.filter((e) => !(wallets.data ?? []).some((w) => w.id === e.id))];
  const walletOf = (id: string) => allWallets.find((w) => w.id === id);
  const categoryName = (categories.data ?? []).find((c) => c.id === watch('categoryId'))?.name;
  const referenceName = (refs.data ?? []).find((r) => r.id === watch('referenceId'))?.displayName;
  const totals = sumByCurrency(lines.filter((l) => l.currency));

  const selectWallet = (index: number, w: Wallet) => {
    setExtraWallets((prev) => [...prev, w]);
    setValue(`lines.${index}.walletId`, w.id, { shouldValidate: true });
    // Con una sola moneda admitida no hay nada que elegir; con varias se elige (nunca se presume).
    setValue(`lines.${index}.currency`, w.currencies.length === 1 ? (w.currencies[0] ?? '') : '', { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      onCreated(await createOperation.mutateAsync(toBody(values)));
    } catch (e) {
      if (!(e instanceof ApiRequestError)) return setFormError('Ocurrió un error inesperado. Reintentá.');
      if (e.code === 'NETWORK') return setFormError('No hay conexión con el servidor. Tu borrador se conserva: reintentá cuando vuelva la red.');
      let mapped = 0;
      for (const [field, msg] of Object.entries(e.fieldErrors)) {
        const m = SERVER_LINE.exec(field);
        if (m) {
          setError(`lines.${m[1]}.${m[2]}` as `lines.${number}.walletId`, { message: msg });
          mapped++;
        } else if (field === 'concept' || field === 'categoryId') {
          setError(field, { message: msg });
          mapped++;
        }
      }
      // Errores generales (cobro que no iguala el importe, precisión de moneda, etc.): se muestran completos.
      const general = Object.values(e.fieldErrors).filter((_, i) => !SERVER_LINE.test(Object.keys(e.fieldErrors)[i] ?? '') && !['concept', 'categoryId'].includes(Object.keys(e.fieldErrors)[i] ?? ''));
      if (general.length > 0 || mapped === 0) setFormError(general[0] ?? e.message);
    }
  });

  const err = (path: string) => (formState.errors as Record<string, { message?: string }>)[path]?.message;

  return (
    <View style={{ gap: 12 }}>
      <Text variant="titleSmall">¿Qué registrás?</Text>
      <Controller
        control={control}
        name="family"
        render={({ field: { onChange, value } }) => (
          <SegmentedButtons
            value={value ?? ''}
            onValueChange={(v) => {
              onChange(v);
              setValue('categoryId', undefined); // la categoría es de una familia: se descarta al cambiar
            }}
            buttons={[
              { value: 'INCOME', label: 'Ingreso', accessibilityLabel: 'Familia Ingreso' },
              { value: 'EXPENSE', label: 'Egreso', accessibilityLabel: 'Familia Egreso' },
            ]}
          />
        )}
      />
      <HelperText type="error" visible={!!formState.errors.family}>
        {formState.errors.family?.message}
      </HelperText>

      {family && (
        <>
          <Button mode="outlined" icon="shape" onPress={() => setDialog('category')} accessibilityLabel="Elegir categoría">
            {categoryName ?? 'Categoría (opcional)'}
          </Button>
          <HelperText type="error" visible={!!formState.errors.categoryId}>
            {formState.errors.categoryId?.message}
          </HelperText>

          <Controller
            control={control}
            name="concept"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Concepto (ej. Impuesto municipal)" accessibilityLabel="Concepto" value={value} onChangeText={onChange} onBlur={onBlur} error={!!formState.errors.concept} />
            )}
          />
          <HelperText type="error" visible={!!formState.errors.concept}>
            {formState.errors.concept?.message}
          </HelperText>

          <Button mode="outlined" icon="link-variant" onPress={() => setDialog('reference')} accessibilityLabel="Elegir referencia">
            {referenceName ?? 'Referencia (opcional)'}
          </Button>

          <Text variant="titleSmall">{family === 'INCOME' ? 'Cobros' : 'Pagos'}</Text>
          {fields.map((field, index) => {
            const w = walletOf(lines[index]?.walletId ?? '');
            const lineErrors = formState.errors.lines?.[index];
            return (
              <Card key={field.id} accessibilityLabel={`Línea ${index + 1}`}>
                <Card.Content style={{ gap: 8 }}>
                  <Button mode="outlined" icon="wallet" onPress={() => setDialog({ wallet: index })} accessibilityLabel={`Elegir billetera línea ${index + 1}`}>
                    {w ? w.name : 'Elegir billetera'}
                  </Button>
                  <HelperText type="error" visible={!!lineErrors?.walletId}>
                    {lineErrors?.walletId?.message}
                  </HelperText>
                  {w && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {w.currencies.map((c) => (
                        <Chip
                          key={c}
                          selected={lines[index]?.currency === c}
                          showSelectedOverlay
                          accessibilityLabel={`Moneda ${c} línea ${index + 1}`}
                          onPress={() => setValue(`lines.${index}.currency`, c, { shouldValidate: true })}
                        >
                          {c}
                        </Chip>
                      ))}
                    </View>
                  )}
                  <HelperText type="error" visible={!!lineErrors?.currency}>
                    {lineErrors?.currency?.message}
                  </HelperText>
                  <Controller
                    control={control}
                    name={`lines.${index}.amount`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="Importe"
                        accessibilityLabel={`Importe línea ${index + 1}`}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="decimal-pad"
                        error={!!lineErrors?.amount}
                      />
                    )}
                  />
                  <HelperText type="error" visible={!!lineErrors?.amount}>
                    {lineErrors?.amount?.message}
                  </HelperText>
                  {fields.length > 1 && (
                    <Button onPress={() => remove(index)} accessibilityLabel={`Quitar línea ${index + 1}`}>
                      Quitar línea
                    </Button>
                  )}
                </Card.Content>
              </Card>
            );
          })}
          <Button icon="plus" onPress={() => append({ walletId: '', currency: '', amount: '' })} accessibilityLabel="Agregar línea">
            Agregar línea
          </Button>
          {totals.length > 0 && (
            <Text accessibilityLabel="Totales por moneda">{`Total: ${totals.map(([c, a]) => `${a} ${c}`).join(' · ')}`}</Text>
          )}

          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label={family === 'INCOME' ? 'Fecha de cobro (AAAA-MM-DD)' : 'Fecha de pago (AAAA-MM-DD)'} accessibilityLabel="Fecha" value={value} onChangeText={onChange} onBlur={onBlur} error={!!formState.errors.date} />
            )}
          />
          <HelperText type="error" visible={!!formState.errors.date}>
            {formState.errors.date?.message}
          </HelperText>
          {family === 'INCOME' && (
            <>
              <Controller
                control={control}
                name="economicPeriod"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput label="Período al que corresponde (opcional, AAAA-MM)" accessibilityLabel="Período" value={value ?? ''} onChangeText={onChange} onBlur={onBlur} error={!!formState.errors.economicPeriod} />
                )}
              />
              <HelperText type="error" visible={!!formState.errors.economicPeriod}>
                {formState.errors.economicPeriod?.message}
              </HelperText>
            </>
          )}
        </>
      )}

      {formError && (
        <Text accessibilityRole="alert" style={{ color: '#B3261E' }}>
          {formError}
        </Text>
      )}
      <Button mode="contained" onPress={() => void onSubmit()} loading={formState.isSubmitting} disabled={formState.isSubmitting}>
        Confirmar movimiento
      </Button>
      {err('root') && <Text>{err('root')}</Text>}

      {family && (
        <CategoryPickerDialog family={family} visible={dialog === 'category'} onDismiss={() => setDialog(null)} onSelect={(id) => setValue('categoryId', id)} />
      )}
      <ReferencePickerDialog visible={dialog === 'reference'} onDismiss={() => setDialog(null)} onSelect={(id) => setValue('referenceId', id ?? undefined)} />
      <WalletPickerDialog
        visible={typeof dialog === 'object' && dialog !== null}
        onDismiss={() => setDialog(null)}
        onSelect={(w) => selectWallet(typeof dialog === 'object' && dialog ? dialog.wallet : 0, w)}
      />
    </View>
  );
}
