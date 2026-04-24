<script setup lang="ts">
import {
  calculateCommission,
  formatCurrency,
  getAgentStats,
} from "~/utils/domain";
import VChart from "vue-echarts";
import {
  ArrowLeft,
  Mail,
  Phone,
  TrendingUp,
  Award,
  ArrowRight,
  Trash2,
} from "lucide-vue-next";
import { toApiErrorInfo } from "~/utils/api-error";
import { authorizedFetch } from "~/utils/authorized-fetch";
const tx = useTransactionsStore();
const agents = useAgentsStore();
const toast = useToastStore();
const config = useRuntimeConfig();
const loading = ref(true);
const { t } = useI18n();
const { formatTitle, formatSpecialization } = useAgentLabels();

type AgentReport = {
  completedTransactions: number;
  totalEarnings: number;
  currency: string;
  roles: { listing: number; selling: number; dual: number };
  transactions: Array<{
    id: string;
    propertyAddress: string;
    transactionValue: number;
    completedAt?: string;
    earning: number;
    role: "listing" | "selling" | "dual";
  }>;
};
const agentReport = ref<AgentReport | null>(null);
const deleting = ref(false);

const route = useRoute();
const id = computed(() => route.params.id as string);

const agent = computed(() => agents.findById(id.value));

const statsLocal = computed(() =>
  agent.value ? getAgentStats(agent.value.id, tx.transactions) : null
);
const stats = computed(() => {
  if (agentReport.value) {
    return {
      totalTransactions: statsLocal.value?.totalTransactions ?? 0,
      totalEarnings: agentReport.value.totalEarnings,
      completedTransactions: agentReport.value.completedTransactions,
      listingCount: agentReport.value.roles.listing + agentReport.value.roles.dual,
      sellingCount: agentReport.value.roles.selling,
    };
  }
  return statsLocal.value;
});

const agentTxns = computed(() =>
  tx.transactions.filter(
    (t) => t.listingAgentId === id.value || t.sellingAgentId === id.value
  )
);

const earningsSeries = computed(() => {
  const now = new Date();
  const months: Array<{ key: string; label: string }> = [];
  for (let i = 9; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { month: "short" }),
    });
  }

  const earningsMap = new Map<string, number>();
  for (const t of agentTxns.value) {
    if (t.stage !== "completed") continue;
    const c = calculateCommission(t);
    const isDual =
      t.listingAgentId === id.value && t.sellingAgentId === id.value;
    const isListing = t.listingAgentId === id.value;
    const earned = isDual
      ? c.listingAgent
      : isListing
      ? c.listingAgent
      : c.sellingAgent;
    const d = new Date(t.completedAt ?? t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    earningsMap.set(key, (earningsMap.get(key) ?? 0) + earned);
  }

  return months.map((m) => ({
    month: m.label,
    earnings: earningsMap.get(m.key) ?? 0,
  }));
});

const roleCounts = computed(() => {
  const listingCount = agentTxns.value.filter(
    (t) => t.listingAgentId === id.value
  ).length;
  const sellingCount = agentTxns.value.filter(
    (t) =>
      t.sellingAgentId === id.value && t.sellingAgentId !== t.listingAgentId
  ).length;
  const dualCount = agentTxns.value.filter(
    (t) => t.sellingAgentId === id.value && t.listingAgentId === id.value
  ).length;
  return { listingCount, sellingCount, dualCount };
});

async function removeAgent() {
  if (!agent.value) return;
  if (agentTxns.value.length > 0) {
    toast.error(t("agents.deleteBlockedHint"), t("common.panel"));
    return;
  }
  const confirm = useConfirmStore();
  const ok = await confirm.confirm({
    title: t("common.confirmTitle"),
    message: t("common.confirmDelete"),
    confirmText: t("common.confirm"),
    cancelText: t("common.cancel"),
    tone: "danger",
  });
  if (!ok) return;
  deleting.value = true;
  try {
    await agents.removeAgent(agent.value.id);
    toast.success(t("agents.deleted"), t("common.panel"));
    await navigateTo("/agents");
  } catch (error) {
    const err = toApiErrorInfo(error, t, "agents.deleteError");
    toast.error(err.message, err.title);
  } finally {
    deleting.value = false;
  }
}

const rolePieOption = computed(() => ({
  tooltip: { trigger: "item" },
  series: [
    {
      type: "pie",
      radius: ["55%", "75%"],
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      data: [
        {
          name: t("transactions.listing"),
          value: roleCounts.value.listingCount,
          itemStyle: { color: "#0A1628" },
        },
        {
          name: t("transactions.selling"),
          value: roleCounts.value.sellingCount,
          itemStyle: { color: "#D4A853" },
        },
        {
          name: t("agents.dual"),
          value: roleCounts.value.dualCount,
          itemStyle: { color: "#10B981" },
        },
      ].filter((d) => d.value > 0),
    },
  ],
}));

const earningsLineOption = computed(() => ({
  grid: { left: 10, right: 10, top: 10, bottom: 24, containLabel: true },
  tooltip: {
    trigger: "axis",
    formatter(params: Array<{ axisValue: string; value: number }>) {
      const p = params?.[0];
      if (!p) return "";
      return `<div class="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-lg text-sm">
        <p class="font-semibold text-[#0A1628] mb-1">${p.axisValue}</p>
        <p class="text-[#64748B]">${t(
          "agents.earnings"
        )}: <span class="font-semibold text-[#0A1628]">${formatCurrency(
        Number(p.value) || 0
      )}</span></p>
      </div>`;
    },
  },
  xAxis: {
    type: "category",
    data: earningsSeries.value.map((d) => d.month),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "#94A3B8", fontSize: 11 },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } },
    axisLabel: { color: "#94A3B8", fontSize: 11 },
  },
  series: [
    {
      type: "line",
      smooth: true,
      data: earningsSeries.value.map((d) => d.earnings),
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { width: 2, color: "#D4A853" },
      itemStyle: { color: "#D4A853" },
      areaStyle: { color: "rgba(212,168,83,0.12)" },
    },
  ],
}));

onMounted(async () => {
  try {
    await Promise.all([
      agents.loaded ? Promise.resolve() : agents.fetchAll(),
      tx.loaded ? Promise.resolve() : tx.fetchAll(),
    ]);
    agentReport.value = await authorizedFetch<AgentReport>(
      `${config.public.apiBase}/reports/agent/${id.value}`
    );
  } catch (error) {
    const err = toApiErrorInfo(error, t, "errors.agentDetailLoadFailed");
    toast.error(err.message, err.title);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-if="loading" class="p-8">
    <p class="text-[#64748B]">{{ t("common.loading") }}</p>
  </div>
  <div v-else-if="!agent" class="p-8">
    <p class="text-[#64748B]">{{ t("common.notFound") }}</p>
    <NuxtLink
      to="/agents"
      class="mt-4 text-sm text-[#D4A853] hover:underline"
      >{{ t("common.backToList") }}</NuxtLink
    >
  </div>
  <div v-else class="mx-auto max-w-[1200px] p-6 lg:p-8">
    <NuxtLink
      to="/agents"
      class="mb-6 inline-flex items-center gap-2 text-sm text-[#64748B] transition-colors hover:text-[#0A1628]"
    >
      <ArrowLeft class="h-4 w-4" />
      {{ t("common.agents") }}
    </NuxtLink>

    <div
      class="mb-5 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
    >
      <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
          :style="{ backgroundColor: agent.avatarColor }"
        >
          {{ agent.initials }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1
                class="text-2xl font-bold text-[#0A1628]"
                style="
                  font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui;
                "
              >
                {{ agent.name }}
              </h1>
              <p class="text-sm text-[#64748B]">{{ formatTitle(agent.title) }}</p>
              <span
                class="mt-1 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
              >
                {{ formatSpecialization(agent.specialization) }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <a
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B] transition-colors hover:bg-[#E2E8F0]"
                :href="`mailto:${agent.email}`"
                :aria-label="t('login.email')"
              >
                <Mail class="h-4 w-4" />
              </a>
              <a
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B] transition-colors hover:bg-[#E2E8F0]"
                :href="`tel:${agent.phone}`"
                :aria-label="t('agents.phone')"
              >
                <Phone class="h-4 w-4" />
              </a>
              <button
                v-if="agentTxns.length === 0"
                type="button"
                class="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                :disabled="deleting"
                :aria-label="t('common.delete')"
                @click="removeAgent"
              >
                <Trash2 class="h-4 w-4" />
                {{ t("common.delete") }}
              </button>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-4 text-sm text-[#64748B]">
            <span class="truncate">{{ agent.email }}</span>
            <span class="truncate">{{ agent.phone }}</span>
            <span>{{ t("agents.joined") }}: {{ agent.joinDate }}</span>
          </div>
        </div>
      </div>

      <div
        v-if="stats"
        class="mt-6 grid grid-cols-2 gap-4 border-t border-[#F1F5F9] pt-5 sm:grid-cols-4"
      >
        <div
          class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-3 text-center"
        >
          <p class="mb-1 text-xs text-[#64748B]">
            {{ t("dashboard.metrics.total") }}
          </p>
          <p class="text-lg font-bold text-[#0A1628]">
            {{ stats.totalTransactions }}
          </p>
        </div>
        <div
          class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-3 text-center"
        >
          <p class="mb-1 text-xs text-[#64748B]">{{ t("agents.completed") }}</p>
          <p class="text-lg font-bold text-[#10B981]">
            {{ stats.completedTransactions }}
          </p>
        </div>
        <div
          class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-3 text-center"
        >
          <p class="mb-1 text-xs text-[#64748B]">
            {{ t("agents.totalEarnings") }}
          </p>
          <p class="text-lg font-bold text-[#D4A853]">
            {{ formatCurrency(stats.totalEarnings) }}
          </p>
        </div>
        <div
          class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-3 text-center"
        >
          <p class="mb-1 text-xs text-[#64748B]">
            {{ t("agents.listingSelling") }}
          </p>
          <p class="text-lg font-bold text-[#0A1628]">
            {{ roleCounts.listingCount }} / {{ roleCounts.sellingCount }}
          </p>
        </div>
      </div>
    </div>

    <div class="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div
        class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:col-span-2"
      >
        <div class="mb-5 flex items-center gap-2">
          <TrendingUp class="h-4 w-4 text-[#D4A853]" />
          <h3 class="text-base font-semibold text-[#0A1628]">
            {{ t("agents.monthlyEarnings") }}
          </h3>
        </div>
        <ClientOnly>
          <VChart
            class="h-[180px] w-full"
            :option="earningsLineOption"
            autoresize
          />
          <template #fallback>
            <div
              class="flex h-[180px] items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400"
            >
              {{ t("reports.chartLoading") }}
            </div>
          </template>
        </ClientOnly>
      </div>

      <div
        class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      >
        <div class="mb-5 flex items-center gap-2">
          <Award class="h-4 w-4 text-[#D4A853]" />
          <h3 class="text-base font-semibold text-[#0A1628]">
            {{ t("agents.roleDistribution") }}
          </h3>
        </div>
        <ClientOnly>
          <VChart class="h-[140px] w-full" :option="rolePieOption" autoresize />
          <template #fallback>
            <div
              class="flex h-[140px] items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400"
            >
              {{ t("reports.chartLoading") }}
            </div>
          </template>
        </ClientOnly>

        <div class="mt-2 space-y-2 text-xs">
          <div
            v-if="roleCounts.listingCount"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="h-2.5 w-2.5 rounded-full"
                style="background-color: #0a1628"
              />
              <span class="text-[#64748B]">{{
                t("transactions.listing")
              }}</span>
            </div>
            <span class="font-semibold text-[#0A1628]">{{
              roleCounts.listingCount
            }}</span>
          </div>
          <div
            v-if="roleCounts.sellingCount"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="h-2.5 w-2.5 rounded-full"
                style="background-color: #d4a853"
              />
              <span class="text-[#64748B]">{{
                t("transactions.selling")
              }}</span>
            </div>
            <span class="font-semibold text-[#0A1628]">{{
              roleCounts.sellingCount
            }}</span>
          </div>
          <div
            v-if="roleCounts.dualCount"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="h-2.5 w-2.5 rounded-full"
                style="background-color: #10b981"
              />
              <span class="text-[#64748B]">{{ t("agents.dual") }}</span>
            </div>
            <span class="font-semibold text-[#0A1628]">{{
              roleCounts.dualCount
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
    >
      <h3 class="mb-4 text-base font-semibold text-[#0A1628]">
        {{ t("agents.transactionHistory") }}
      </h3>

      <p
        v-if="agentTxns.length === 0"
        class="py-8 text-center text-sm text-[#94A3B8]"
      >
        {{ t("agents.noTransactionsYet") }}
      </p>

      <div v-else class="divide-y divide-[#F1F5F9]">
        <div
          v-for="txn in agentTxns"
          :key="txn.id"
          class="-mx-2 flex cursor-pointer items-center justify-between rounded-lg px-2 py-3 transition-colors hover:bg-[#FAFBFC]"
          @click="navigateTo(`/transactions/${txn.id}`)"
        >
          <div>
            <p class="text-sm font-semibold text-[#0A1628]">
              {{ txn.propertyAddress.split(",")[0] }}
            </p>
            <div
              class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]"
            >
              <span>{{ new Date(txn.date).toLocaleDateString("tr-TR") }}</span>
              <span
                class="rounded-full px-1.5 py-0.5 font-medium"
                :class="
                  txn.listingAgentId === id && txn.sellingAgentId === id
                    ? 'bg-purple-50 text-purple-600'
                    : txn.listingAgentId === id
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-amber-50 text-amber-700'
                "
              >
                {{
                  txn.listingAgentId === id && txn.sellingAgentId === id
                    ? t("agents.dual")
                    : txn.listingAgentId === id
                    ? t("transactions.listing")
                    : t("transactions.selling")
                }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <TransactionStageBadge :stage="txn.stage" size="sm" />
            <span class="text-sm font-bold text-[#D4A853]">
              {{
                (() => {
                  const c = calculateCommission(txn);
                  const isDual =
                    txn.listingAgentId === id && txn.sellingAgentId === id;
                  const isListing = txn.listingAgentId === id;
                  const earned = isDual
                    ? c.listingAgent
                    : isListing
                    ? c.listingAgent
                    : c.sellingAgent;
                  return formatCurrency(earned);
                })()
              }}
            </span>
            <ArrowRight class="h-4 w-4 text-[#CBD5E1]" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
