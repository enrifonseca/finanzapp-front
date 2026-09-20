/**
 * URL base del backend. En Android emulador `localhost` es el propio emulador: usar
 * EXPO_PUBLIC_API_URL=http://10.0.2.2:3000. En dispositivo físico, la IP de la PC en la red local.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
