export default defineNuxtRouteMiddleware((to) => {
  if (to.path === "/login") return;
  if (import.meta.server) return;
  const auth = useAuthStore();
  if (!auth.hydrated) auth.hydrateFromStorage();
  if (!auth.token) return navigateTo("/login");
});
