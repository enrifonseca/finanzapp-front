/** Error HTTP del backend con el contrato `{code,message,fieldErrors?,requestId,retryable?}`. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: Readonly<Record<string, string>> = {},
    readonly retryable = false,
  ) {
    super(message);
  }
  /** Sin respuesta del servidor (red caída, timeout): el resultado de la operación es DESCONOCIDO. */
  static network(): ApiRequestError {
    return new ApiRequestError(0, 'NETWORK', 'No hay conexión con el servidor', {}, true);
  }
}

interface Result<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/** Convierte el resultado de openapi-fetch en datos o en un ApiRequestError tipado. */
export function unwrap<T>(result: Result<T>): T {
  if (result.data !== undefined) return result.data;
  const body = (result.error ?? {}) as { code?: string; message?: string; fieldErrors?: Record<string, string>; retryable?: boolean };
  throw new ApiRequestError(result.response.status, body.code ?? 'UNKNOWN', body.message ?? `HTTP ${result.response.status}`, body.fieldErrors, body.retryable);
}

/** Envuelve una llamada para que un fallo de red se vea como ApiRequestError.network(). */
export async function call<T>(fn: () => Promise<Result<T>>): Promise<T> {
  let r: Result<T>;
  try {
    r = await fn();
  } catch {
    throw ApiRequestError.network();
  }
  return unwrap(r);
}
