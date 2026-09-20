// SafeAreaProvider no renderiza hijos en jest sin métricas iniciales: se usa el mock oficial.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
