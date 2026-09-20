import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { useRecentOperations, type Operation } from '@/core-react';

interface Habitual {
  key: string;
  label: string;
  params: { family: string; categoryId?: string; concept: string; referenceId?: string };
  count: number;
}

/** Accesos habituales SOLO a partir de operaciones realmente registradas (nunca sugerencias inventadas). */
export function habitualesOf(ops: readonly Operation[], max = 5): Habitual[] {
  const map = new Map<string, Habitual>();
  for (const op of ops) {
    if (op.state !== 'CONFIRMED') continue;
    const key = `${op.family}|${op.categoryId ?? ''}|${op.concept}|${op.referenceId ?? ''}`;
    const prev = map.get(key);
    if (prev) {
      prev.count++;
      continue;
    }
    map.set(key, {
      key,
      label: [op.concept, op.referenceName].filter(Boolean).join(' · '),
      params: { family: op.family, concept: op.concept, ...(op.categoryId ? { categoryId: op.categoryId } : {}), ...(op.referenceId ? { referenceId: op.referenceId } : {}) },
      count: 1,
    });
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, max);
}

export function Habituales() {
  const router = useRouter();
  const recent = useRecentOperations(10);
  const items = habitualesOf(recent.data ?? []);
  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleMedium">Habituales</Text>
      {items.length === 0 ? (
        <Text variant="bodySmall">Todavía no hay accesos habituales: aparecen a medida que registrás movimientos.</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {items.map((h) => (
            // Precarga familia/categoría/concepto/referencia; todo sigue siendo editable en el formulario.
            <Chip key={h.key} icon="lightning-bolt" onPress={() => router.push({ pathname: '/movement-new', params: h.params })} accessibilityLabel={`Habitual ${h.label}`}>
              {h.label}
            </Chip>
          ))}
        </View>
      )}
    </View>
  );
}
