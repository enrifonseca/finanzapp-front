import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StoredSession, TokenStorage } from './token-storage';

const KEY = 'finanzapp.session';

/**
 * iOS/Android: Keychain/Keystore vía expo-secure-store.
 * Web: no existe almacenamiento seguro del sistema; se usa sessionStorage (se borra al cerrar la pestaña).
 * Es una limitación de la plataforma web, aceptable para desarrollo; la app de producción es móvil.
 */
export const secureTokenStorage: TokenStorage = {
  async get() {
    try {
      const raw = Platform.OS === 'web' ? globalThis.sessionStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  },
  async set(session) {
    const raw = JSON.stringify(session);
    if (Platform.OS === 'web') globalThis.sessionStorage?.setItem(KEY, raw);
    else await SecureStore.setItemAsync(KEY, raw);
  },
  async clear() {
    if (Platform.OS === 'web') globalThis.sessionStorage?.removeItem(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  },
};
