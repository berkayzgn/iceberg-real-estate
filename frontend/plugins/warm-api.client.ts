export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const api = config.public.apiBase;
  if (!api || typeof api !== "string") return;
  const root = api.replace(/\/$/, "");
  $fetch(`${root}/health`).catch(() => {});
});
