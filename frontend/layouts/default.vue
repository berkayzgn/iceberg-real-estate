<script setup lang="ts">
const ui = useUiStore();
const tx = useTransactionsStore();
const agents = useAgentsStore();
const toast = useToastStore();

onMounted(async () => {
  try {
    await Promise.all([agents.fetchAll(), tx.fetchAll()]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Veriler yüklenemedi.';
    toast.error(message, 'Bağlantı hatası');
  }
});
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[#FAFBFC]">
    <SharedAppSidebar />
    <main class="min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
      <slot />
    </main>

    <TransactionCreateTransactionModal
      :open="ui.createTransactionOpen"
      @close="ui.closeCreateTransaction()"
      @created="(id) => navigateTo(`/transactions/${id}`)"
    />

    <SharedAppToaster />
  </div>
</template>
