import createClient from 'openapi-fetch';
import type { paths } from './schema';

/** Cliente HTTP tipado generado desde el OpenAPI del backend (nunca importa clases del backend). */
export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}

export type ApiClient = ReturnType<typeof createApiClient>;
