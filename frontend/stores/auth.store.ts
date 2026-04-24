import { defineStore } from "pinia";
import {
  readAuthToken,
  removeAuthToken,
  writeAuthToken,
} from "~/utils/auth-token";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);
  const hydrated = ref(false);

  const isAuthenticated = computed(() => Boolean(token.value));

  function hydrateFromStorage() {
    if (!import.meta.client) return;
    token.value = readAuthToken();
    hydrated.value = true;
  }

  function setToken(accessToken: string) {
    token.value = accessToken;
    writeAuthToken(accessToken);
  }

  function clearToken() {
    token.value = null;
    removeAuthToken();
  }

  async function login(email: string, password: string) {
    const apiBase = useRuntimeConfig().public.apiBase;
    const res = await $fetch<{ accessToken: string }>(`${apiBase}/auth/login`, {
      method: "POST",
      body: { email, password },
    });
    const accessToken =
      res && typeof res.accessToken === "string" ? res.accessToken.trim() : "";
    if (!accessToken) {
      throw new Error("Invalid login response");
    }
    setToken(accessToken);
  }

  async function logout() {
    clearToken();
    useAgentsStore().clear();
    useTransactionsStore().clear();
    await navigateTo("/login");
  }

  return {
    token,
    hydrated,
    isAuthenticated,
    hydrateFromStorage,
    setToken,
    clearToken,
    login,
    logout,
  };
});
