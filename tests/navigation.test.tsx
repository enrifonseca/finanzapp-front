import { screen } from '@testing-library/react-native';
import { PlanningScreen } from '@/app/planning/PlanningScreen';
import { ReportsScreen } from '@/app/reports/ReportsScreen';
import { TABS } from '@/layout';
import { renderWithProviders } from './render';

describe('navegación vacía (Fase 0)', () => {
  it('las tabs son exactamente las de docs/spec/02, en orden', () => {
    expect(TABS.map((t) => t.title)).toEqual(['Inicio', 'Movimientos', 'Billeteras', 'Planificación', 'Reportes']);
  });

  it.each([
    ['Planificación', PlanningScreen, 'Fase 6'],
    ['Reportes', ReportsScreen, 'Fase 7'],
  ] as const)('%s muestra estado vacío y sin lógica de negocio', async (title, Screen, fase) => {
    await renderWithProviders(<Screen />);
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText(`Esta sección se construye en la ${fase}.`)).toBeTruthy();
  });
});
