import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false);
  const createTransactionOpen = ref(false);

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function openCreateTransaction() {
    createTransactionOpen.value = true;
  }

  function closeCreateTransaction() {
    createTransactionOpen.value = false;
  }

  return {
    sidebarCollapsed,
    toggleSidebar,
    createTransactionOpen,
    openCreateTransaction,
    closeCreateTransaction,
  };
});
