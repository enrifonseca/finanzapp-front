import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Preferencias del dispositivo (no son datos financieros ni credenciales). */
export interface PreferenceStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export class MemoryPreferences implements PreferenceStorage {
  private data = new Map<string, string>();
  async get(key: string) {
    return this.data.get(key) ?? null;
  }
  async set(key: string, value: string) {
    this.data.set(key, value);
  }
}

/** Nativo: expo-secure-store. Web: localStorage. Cualquier fallo devuelve null / se ignora (la preferencia es opcional). */
export const devicePreferences: PreferenceStorage = {
  async get(key) {
    try {
      return Platform.OS === 'web' ? (globalThis.localStorage?.getItem(key) ?? null) : await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch {
      /* sin almacenamiento: la preferencia dura solo esta sesión */
    }
  },
};
