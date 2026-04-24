export const AUTH_TOKEN_STORAGE_KEY = "emlak_auth_token";

function getStorage(): Storage | null {
  if (!import.meta.client) return null;
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

export function readAuthToken(): string | null {
  const raw = getStorage()?.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

export function writeAuthToken(token: string): void {
  getStorage()?.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function removeAuthToken(): void {
  getStorage()?.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
