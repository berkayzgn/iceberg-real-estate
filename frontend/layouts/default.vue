<script setup lang="ts">
import { toApiErrorInfo } from "~/utils/api-error";

const ui = useUiStore();
const tx = useTransactionsStore();
const agents = useAgentsStore();
const toast = useToastStore();
const { t } = useI18n();

onMounted(async () => {
  try {
    await Promise.all([agents.fetchAll(), tx.fetchAll()]);
  } catch (error) {
    const err = toApiErrorInfo(error, t, "errors.layoutLoadFailed");
    toast.error(err.message, err.title);
  }
});
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[#FAFBFC]">
    <SharedAppSidebar />
    <main
      class="min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0"
    >
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
