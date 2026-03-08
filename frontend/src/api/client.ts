import type { ApiError } from '@shared/types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.title ?? `Ошибка ${res.status}`);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),
  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, token }),
};
