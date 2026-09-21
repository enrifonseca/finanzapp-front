import { useState } from 'react';
import { Text } from 'react-native-paper';
import { useCreatePeriod, useUpdatePeriod, type Period } from '@/core-react';
import { DateInput, fieldToIso, isoToField } from '../common/fields';
import { FormDialog } from '../common/FormDialog';

/** Corregir las fechas de un período (pasan a CONFIRMED) o cargar uno nuevo (típico en tarjetas de fechas variables). */
export function PeriodDatesDialog({ walletId, period, visible, onDismiss }: { walletId: string; period: Period | null; visible: boolean; onDismiss: () => void }) {
  const update = useUpdatePeriod(walletId, period?.id ?? '');
  const create = useCreatePeriod(walletId);
  const [open, setOpen] = useState(isoToField(period?.openDate));
  const [close, setClose] = useState(isoToField(period?.closeDate));
  const [due, setDue] = useState(isoToField(period?.dueDate));
  const [errors, setErrors] = useState<{ close?: string; open?: string; due?: string }>({});

  return (
    <FormDialog
      title={period ? `Fechas del resumen ${period.cycleLabel}` : 'Nuevo período'}
      visible={visible}
      onDismiss={onDismiss}
      submitLabel="Guardar"
      onSubmit={async () => {
        const o = open.trim() ? fieldToIso(open) : null;
        const c = fieldToIso(close);
        const d = due.trim() ? fieldToIso(due) : null;
        const next = { ...(c ? {} : { close: 'Fecha de cierre inválida' }), ...(open.trim() && !o ? { open: 'Fecha inválida' } : {}), ...(due.trim() && !d ? { due: 'Fecha inválida' } : {}) };
        setErrors(next);
        if (!c || (open.trim() && !o) || (due.trim() && !d)) throw new Error('validación');
        if (period) await update.mutateAsync({ openDate: o, closeDate: c, dueDate: d, expectedVersion: period.version });
        else await create.mutateAsync({ closeDate: c, ...(o ? { openDate: o } : {}), ...(d ? { dueDate: d } : {}) });
      }}
    >
      <Text variant="bodySmall">Las fechas que cargues o corrijas quedan confirmadas; las calculadas por la app son solo estimaciones.</Text>
      <DateInput label="Apertura" value={open} onChange={setOpen} error={errors.open} />
      <DateInput label="Cierre" value={close} onChange={setClose} error={errors.close} />
      <DateInput label="Vencimiento" value={due} onChange={setDue} error={errors.due} />
    </FormDialog>
  );
}
