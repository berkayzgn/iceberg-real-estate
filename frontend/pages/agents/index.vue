<script setup lang="ts">
import { ArrowRight, Plus } from 'lucide-vue-next';
import { getAgentStats, formatCurrency } from '~/utils/demo-data';

const tx = useTransactionsStore();
const agents = useAgentsStore();
const showAddAgentModal = ref(false);
const loading = ref(true);
const { t } = useI18n();

function statsFor(agentId: string) {
  return getAgentStats(agentId, tx.transactions);
}

onMounted(async () => {
  try {
    await Promise.all([agents.fetchAll(), tx.fetchAll()]);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-6xl p-6 lg:p-8">
    <div class="mb-8 flex items-center justify-between gap-4">
      <div>
        <h1
          class="text-2xl font-bold text-[#0A1628]"
          style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
        >
          {{ t('common.agents') }}
        </h1>
        <p class="mt-0.5 text-sm text-[#64748B]">
          {{ t('agents.count', { count: agents.agents.length }) }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-[#D4A853] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
        @click="showAddAgentModal = true"
      >
        <Plus class="h-4 w-4" />
        {{ t('agents.newAgent') }}
      </button>
    </div>

    <div v-if="loading" class="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
      {{ t('common.loading') }}
    </div>
    <div
      v-else
      class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5"
    >
      <NuxtLink
        v-for="a in agents.agents"
        :key="a.id"
        :to="`/agents/${a.id}`"
        class="group min-w-0 cursor-pointer rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            :style="{ backgroundColor: a.avatarColor }"
          >
            {{ a.initials }}
          </div>
          <span
            class="max-w-[60%] truncate rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#64748B] transition-colors group-hover:bg-amber-50 group-hover:text-amber-700"
            :title="a.specialization"
          >
            {{ a.specialization }}
          </span>
        </div>

        <h3 class="mb-0.5 truncate text-base font-semibold text-[#0A1628]" :title="a.name">
          {{ a.name }}
        </h3>
        <p class="mb-4 truncate text-sm text-[#64748B]" :title="a.title">{{ a.title }}</p>

        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-3">
            <p class="mb-1 text-xs text-[#64748B]">{{ t('transactions.transaction') }}</p>
            <p class="text-lg font-bold text-[#0A1628]">
              {{ statsFor(a.id).totalTransactions }}
            </p>
          </div>
          <div class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-3">
            <p class="mb-1 text-xs text-[#64748B]">{{ t('agents.earnings') }}</p>
            <p class="break-words text-base font-bold leading-tight text-[#D4A853]">
              {{ formatCurrency(statsFor(a.id).totalEarnings) }}
            </p>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between border-t border-[#F1F5F9] pt-4">
          <span class="truncate pr-2 text-xs text-[#94A3B8]">{{ t('agents.joined') }}: {{ a.joinDate }}</span>
          <ArrowRight class="h-4 w-4 text-[#CBD5E1] transition-colors group-hover:text-[#D4A853]" />
        </div>
      </NuxtLink>
    </div>
  </div>
  <AgentsAddAgentModal
    :open="showAddAgentModal"
    @close="showAddAgentModal = false"
  />
</template>
