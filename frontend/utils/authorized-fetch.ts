import { readAuthToken } from "./auth-token";

type FetchOptions = Parameters<typeof $fetch>[1];

export function authorizedFetch<T>(url: string, options?: FetchOptions): Promise<T> {
  const headers = new Headers((options?.headers as HeadersInit) ?? undefined);
  if (import.meta.client) {
    const token = readAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return $fetch<T>(url, {
    ...options,
    headers,
  });
}
