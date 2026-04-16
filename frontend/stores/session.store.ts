import { defineStore } from 'pinia';

const AUTH_COOKIE = 'emlak-demo-auth';

export const useSessionStore = defineStore('session', () => {
  const auth = useCookie<string | null>(AUTH_COOKIE, {
    default: () => null,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });

  const isLoggedIn = computed(() => auth.value === 'ok');

  function login(email?: string, password?: string) {
    // demo credentials (UI parity with prototype)
    if (email && password) {
      const ok = email.trim().toLowerCase() === 'admin@propex.co' && password === 'propex2026';
      if (!ok) return false;
    }
    auth.value = 'ok';
    return true;
  }

  function logout() {
    auth.value = null;
  }

  return { auth, isLoggedIn, login, logout };
});
