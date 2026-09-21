import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/layout';
import { MovementForm, type MovementDraft } from './MovementForm';

/** "Nuevo movimiento": siempre empieza por familia y categoría; un habitual solo PRECARGA (todo editable). */
export function NewMovementScreen() {
  const router = useRouter();
  const p = useLocalSearchParams<{ family?: string; categoryId?: string; concept?: string; referenceId?: string }>();
  const draft: MovementDraft = {
    ...(p.family === 'INCOME' || p.family === 'EXPENSE' ? { family: p.family } : {}),
    ...(p.categoryId ? { categoryId: p.categoryId } : {}),
    ...(p.concept ? { concept: p.concept } : {}),
    ...(p.referenceId ? { referenceId: p.referenceId } : {}),
  };
  return (
    <ScreenContainer title="Nuevo movimiento" onBack={() => router.back()}>
      <MovementForm draft={draft} onCreated={() => router.replace('/')} />
    </ScreenContainer>
  );
}
