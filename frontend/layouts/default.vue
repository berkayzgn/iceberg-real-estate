<script setup lang="ts">
const ui = useUiStore();
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
