import { fetchAuthSession } from 'aws-amplify/auth';
import { env } from './env';

export interface ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
}

async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
}

function makeError(status: number, body: unknown): ApiError {
  const envelope = (body as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
  const err = new Error(envelope?.message ?? `Request failed: ${status}`) as ApiError;
  err.status = status;
  err.code = envelope?.code;
  err.details = envelope?.details;
  return err;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const baseUrl = env().consumerApiUrl.replace(/\/$/, '');
  const token = await getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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

export const consumerApi = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
