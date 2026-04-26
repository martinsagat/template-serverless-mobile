import { fetchAuthSession } from 'aws-amplify/auth';

export interface ApiClientOptions {
  baseUrl: string;
  /** Override the token source — useful for tests. */
  getAccessToken?: () => Promise<string | null>;
}

export interface ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
}

async function defaultGetAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
}

function makeError(status: number, body: unknown): ApiError {
  const envelope = (
    body as {
      error?: { code?: string; message?: string; details?: unknown };
    } | null
  )?.error;
  const err = new Error(
    envelope?.message ?? `Request failed: ${status}`,
  ) as ApiError;
  err.status = status;
  err.code = envelope?.code;
  err.details = envelope?.details;
  return err;
}

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const getToken = options.getAccessToken ?? defaultGetAccessToken;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 204) return undefined as T;
    const json = await res.json().catch(() => null);
    if (!res.ok) throw makeError(res.status, json);
    return json as T;
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
