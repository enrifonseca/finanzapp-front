import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { AppProviders } from '@/kernel';

export const TEST_API = 'http://api.test';

export async function renderWithProviders(ui: ReactElement) {
  return await render(<AppProviders baseUrl={TEST_API}>{ui}</AppProviders>);
}
