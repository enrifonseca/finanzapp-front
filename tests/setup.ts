// SafeAreaProvider no renderiza hijos en jest sin métricas iniciales: se usa el mock oficial.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// La navegación real se verifica en el e2e de navegador; en unit tests se reemplaza por espías.
export const routerMock = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock('expo-router', () => ({
  useRouter: () => require('./setup').routerMock,
  useLocalSearchParams: () => require('./setup').routerMock.params,
}));
