export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login') return;
  const session = useSessionStore();
  if (!session.isLoggedIn) {
    return navigateTo('/login');
  }
});
