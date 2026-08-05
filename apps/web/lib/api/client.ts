import { problemDetailsSchema, type ProblemDetails } from "@urnight/contracts";
import { logger } from "../logger";

/** Base URL del API backend. Server y cliente comparten el mismo origen v1. */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101/api/v1";

/**
 * Error tipado a partir de una respuesta RFC 7807 (application/problem+json).
 * Expone `code` (dominio) y `fieldErrors` para feedback inline en formularios.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.problem = problem;
  }

  /** Código machine-readable de dominio (p. ej. `identity/underage`). */
  get code(): string | undefined {
    return this.problem.code;
  }

  /** Errores de validación por campo (extensión RFC 7807 del backend). */
  get fieldErrors(): Record<string, string[]> {
    return this.problem.errors ?? {};
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** Token Bearer: en Server Components viene de `auth()`, en cliente de `useSession()`. */
  token?: string;
  /** Cuerpo JSON; se serializa automáticamente y fija Content-Type. */
  json?: unknown;
  /** Query params; los `undefined` se omiten. */
  query?: Record<string, string | number | boolean | undefined>;
  /** Caché de Next (ISR): revalidación por tiempo y tags. */
  next?: { revalidate?: number | false; tags?: string[] };
  /**
   * Timeout en ms (default 15s): un API colgado no debe bloquear la petición
   * indefinidamente. Los uploads binarios no pasan por aquí (XHR presignado).
   */
  timeoutMs?: number;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function toProblem(res: Response): Promise<ProblemDetails> {
  try {
    const parsed = problemDetailsSchema.safeParse(await res.json());
    if (parsed.success) return parsed.data;
  } catch {
    /* respuesta no-JSON o vacía: caemos al fallback */
  }
  return {
    type: "about:blank",
    title: res.statusText || "Error",
    status: res.status,
  };
}

/**
 * Wrapper de fetch tipado. Inyecta Bearer (si se pasa), serializa JSON y
 * convierte cualquier respuesta no-2xx en `ApiError`. El refresh de token NO
 * se maneja aquí: lo gestiona el callback `jwt` de NextAuth (la sesión siempre
 * entrega un access token vigente).
 */
export interface ApiFetchResponse<T> {
  data: T;
  headers: Headers;
  status: number;
}

export async function apiFetchResponse<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<ApiFetchResponse<T>> {
  const {
    token,
    json,
    query,
    headers,
    cache,
    next,
    timeoutMs = 15_000,
    ...rest
  } = opts;
  const method = rest.method ?? "GET";

  // Señal compuesta: timeout propio + señal del caller (si la hay). No hay
  // streaming en la app (todo se consume con res.json()), abortar es seguro.
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = rest.signal
    ? AbortSignal.any([rest.signal, timeoutSignal])
    : timeoutSignal;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      ...rest,
      signal,
      ...(next ? { next } : {}),
      // cache explícito gana; con ISR (next) se omite; por defecto sin caché.
      ...(cache ? { cache } : next ? {} : { cache: "no-store" }),
      headers: {
        Accept: "application/json",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch (err) {
    // Fallo de red/DNS/timeout: el backend no respondió. `name` distingue
    // TimeoutError (backend colgado) de un fallo DNS/conexión.
    const cause = err as Error;
    logger.error(
      { method, path, err: cause.message, name: cause.name },
      "web.api.network_error",
    );
    throw err;
  }

  if (!res.ok) {
    const problem = await toProblem(res);
    logger.warn(
      { method, path, status: problem.status, code: problem.code },
      "web.api.error",
    );
    throw new ApiError(problem);
  }
  const data =
    res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  return { data, headers: res.headers, status: res.status };
}

export async function apiFetch<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  return (await apiFetchResponse<T>(path, opts)).data;
}
