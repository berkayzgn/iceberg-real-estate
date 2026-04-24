export default defineNuxtPlugin(() => {
  useAuthStore().hydrateFromStorage();
});
