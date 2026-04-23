<script setup lang="ts">
import { ArrowRight, Plus } from "lucide-vue-next";
import { getAgentStats, formatCurrency } from "~/utils/domain";
import { toApiErrorInfo } from "~/utils/api-error";

const tx = useTransactionsStore();
const agents = useAgentsStore();
const toast = useToastStore();
const showAddAgentModal = ref(false);
const loading = ref(true);
const { t } = useI18n();

const AGENT_TYPE_ORDER = [
  "Satış Danışmanı",
  "Kıdemli Satış Danışmanı",
  "Portföy Danışmanı",
] as const;

function statsFor(agentId: string) {
  return getAgentStats(agentId, tx.transactions);
}

const typeColumns = computed(() => {
  const grouped = new Map<string, typeof agents.agents.value>();

  for (const agent of agents.agents) {
    const key = AGENT_TYPE_ORDER.includes(
      agent.title as (typeof AGENT_TYPE_ORDER)[number]
    )
      ? agent.title
      : t("agents.otherType");
    const prev = grouped.get(key) ?? [];
    prev.push(agent);
    grouped.set(key, prev);
  }

  const ordered = AGENT_TYPE_ORDER.map((title) => ({
    key: title,
    label: title,
    agents: grouped.get(title) ?? [],
  }));

  const otherAgents = grouped.get(t("agents.otherType")) ?? [];
  if (otherAgents.length > 0) {
    ordered.push({
      key: "other",
      label: t("agents.otherType"),
      agents: otherAgents,
    });
  }

  return ordered;
});

onMounted(async () => {
  try {
    await Promise.all([agents.fetchAll(), tx.fetchAll()]);
  } catch (error) {
    const err = toApiErrorInfo(error, "Danışman verileri alınamadı.");
    toast.error(err.message, err.title);
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
          {{ t("common.agents") }}
        </h1>
        <p class="mt-0.5 text-sm text-[#64748B]">
          {{ t("agents.count", { count: agents.agents.length }) }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-[#D4A853] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
        @click="showAddAgentModal = true"
      >
        <Plus class="h-4 w-4" />
        {{ t("agents.newAgent") }}
      </button>
    </div>

    <div
      v-if="loading"
      class="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]"
    >
      {{ t("common.loading") }}
    </div>
    <div v-else class="min-w-0">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-[#0A1628]">
          {{ t("agents.typeFunnel") }}
        </h2>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="column in typeColumns"
          :key="column.key"
          class="rounded-2xl border border-[#E2E8F0] bg-white p-3 transition-all"
        >
          <div class="mb-3 flex items-center gap-2">
            <div class="h-2 w-2 rounded-full bg-[#D4A853]" />
            <span class="text-sm font-semibold text-[#0A1628]">{{
              column.label
            }}</span>
            <span
              class="ml-auto rounded-full px-2 py-0.5 text-xs font-bold"
              style="background-color: #fef3c7; color: #b45309"
            >
              {{ column.agents.length }}
            </span>
          </div>

          <div class="space-y-3">
            <template v-if="column.agents.length === 0">
              <div
                class="rounded-xl border border-dashed border-[#E2E8F0] bg-white p-4 text-center text-sm text-[#94A3B8]"
              >
                {{ t("agents.noAgentsInType") }}
              </div>
            </template>

            <NuxtLink
              v-for="a in column.agents"
              :key="a.id"
              :to="`/agents/${a.id}`"
              class="group block min-w-0 cursor-pointer rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
            >
              <div class="mb-3 flex items-start justify-between gap-3">
                <div
                  class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  :style="{ backgroundColor: a.avatarColor }"
                >
                  {{ a.initials }}
                </div>
                <span
                  class="max-w-[62%] truncate rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#64748B]"
                  :title="a.specialization"
                >
                  {{ a.specialization }}
                </span>
              </div>

              <h3
                class="truncate text-sm font-semibold text-[#0A1628]"
                :title="a.name"
              >
                {{ a.name }}
              </h3>

              <div class="mt-2 grid grid-cols-2 gap-2">
                <div class="rounded-lg border border-[#E2E8F0] bg-white p-2">
                  <p class="text-[11px] text-[#64748B]">
                    {{ t("transactions.transaction") }}
                  </p>
                  <p class="text-sm font-bold text-[#0A1628]">
                    {{ statsFor(a.id).totalTransactions }}
                  </p>
                </div>
                <div class="rounded-lg border border-[#E2E8F0] bg-white p-2">
                  <p class="text-[11px] text-[#64748B]">
                    {{ t("agents.earnings") }}
                  </p>
                  <p
                    class="truncate text-sm font-bold text-[#D4A853]"
                    :title="formatCurrency(statsFor(a.id).totalEarnings)"
                  >
                    {{ formatCurrency(statsFor(a.id).totalEarnings) }}
                  </p>
                </div>
              </div>

              <div
                class="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2"
              >
                <span class="truncate pr-2 text-[11px] text-[#94A3B8]">
                  {{ t("agents.joined") }}: {{ a.joinDate }}
                </span>
                <ArrowRight
                  class="h-3.5 w-3.5 text-[#CBD5E1] transition-colors group-hover:text-[#D4A853]"
                />
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
  <AgentsAddAgentModal
    :open="showAddAgentModal"
    @close="showAddAgentModal = false"
  />
</template>
