<script setup lang="ts">
import { Plus, ArrowRight, Clock } from 'lucide-vue-next';
import {
  AGENTS,
  STAGE_ORDER,
  STAGE_COLORS,
  STAGE_LABELS,
  SPARKLINE_DATA,
  calculateCommission,
  timeAgo,
} from '~/utils/demo-data';
const tx = useTransactionsStore();
const ui = useUiStore();

function getAgent(id: string) {
  return AGENTS.find((a) => a.id === id);
}

const completed = computed(() => tx.transactions.filter((t) => t.stage === 'completed'));
const active = computed(() => tx.transactions.filter((t) => t.stage !== 'completed'));
const totalRevenue = computed(() =>
  completed.value.reduce((s, t) => s + t.transactionValue, 0),
);
const pendingCommissions = computed(() =>
  active.value.reduce((s, t) => s + calculateCommission(t).agentTotal, 0),
);

const metrics = computed(() => [
  {
    label: 'Toplam işlem',
    value: tx.transactions.length,
    displayMode: 'plain' as const,
    trend: 12,
    sparkData: SPARKLINE_DATA.transactions,
    color: '#3B82F6',
  },
  {
    label: 'Aktif işlem',
    value: active.value.length,
    displayMode: 'plain' as const,
    trend: 8,
    sparkData: SPARKLINE_DATA.active,
    color: '#D4A853',
  },
  {
    label: 'Tamamlanan hacim (TL)',
    value: totalRevenue.value,
    displayMode: 'currency' as const,
    trend: 24,
    sparkData: SPARKLINE_DATA.revenue,
    color: '#10B981',
  },
  {
    label: 'Bekleyen danışman payı (TL)',
    value: pendingCommissions.value,
    displayMode: 'currency' as const,
    trend: -5,
    sparkData: SPARKLINE_DATA.pending,
    color: '#8B5CF6',
  },
]);

const recentActivity = computed(() =>
  tx.transactions.flatMap((t) =>
    t.activityLog.map((a) => ({
      ...a,
      transactionId: t.id,
      address: t.propertyAddress.split(',')[0] ?? '',
    })),
  )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 12),
);

function stageTxns(stage: (typeof STAGE_ORDER)[number]) {
  return tx.transactions.filter((t) => t.stage === stage);
}

function stageCardBg(stage: (typeof STAGE_ORDER)[number]) {
  // subtle tint per stage so cards are visually distinguishable
  return STAGE_COLORS[stage].bg;
}

const config = useRuntimeConfig();
const { data: health, error: healthError } = await useFetch(
  () => `${config.public.apiBase}/health`,
  { server: false, lazy: true },
);
</script>

<template>
  <div class="mx-auto min-w-0 max-w-[1600px] p-6 lg:p-8">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1
          class="text-2xl font-bold text-[#0A1628] lg:text-3xl"
          style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
        >
          Panel
        </h1>
        <p class="mt-0.5 text-sm text-[#64748B]">
          Özet metrikler ve işlem hunisi (demo veri;
          <NuxtLink
            to="/transactions/create"
            class="text-[#D4A853] underline-offset-2 hover:underline"
            >API’ye bağlama</NuxtLink
          >
          sonraki aşama).
        </p>
        <p class="mt-2 text-xs text-slate-500">
          API sağlık:
          <span v-if="healthError" class="text-amber-700">{{
            healthError.message
          }}</span>
          <code v-else-if="health" class="text-emerald-800">{{
            JSON.stringify(health)
          }}</code>
          <span v-else class="text-slate-400">yükleniyor…</span>
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-200 transition-all hover:opacity-90 active:scale-95"
        style="background-color: #d4a853"
        @click="ui.openCreateTransaction()"
      >
        <Plus class="h-4 w-4" />
        <span class="hidden sm:inline">Yeni işlem</span>
      </button>
    </div>

    <div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <DashboardStatCard
        v-for="m in metrics"
        :key="m.label"
        :label="m.label"
        :value="m.value"
        :display-mode="m.displayMode"
        :trend="m.trend"
        :spark-data="m.sparkData"
        :color="m.color"
      />
    </div>

    <div class="min-w-0">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-[#0A1628]">Aşama hunisi</h2>
        <NuxtLink
          to="/transactions"
          class="flex items-center gap-1 text-sm text-[#64748B] transition-colors hover:text-[#D4A853]"
        >
          Tümü
          <ArrowRight class="h-4 w-4" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="stage in STAGE_ORDER"
          :key="stage"
          class="rounded-2xl border border-[#E2E8F0] p-3"
          :style="{ backgroundColor: '#ffffff' }"
        >
          <div class="mb-3 flex items-center gap-2">
            <div
              class="h-2 w-2 rounded-full"
              :style="{ backgroundColor: STAGE_COLORS[stage].dot }"
            />
            <span class="text-sm font-semibold text-[#0A1628]">
              {{ STAGE_LABELS[stage] }}
            </span>
            <span
              class="ml-auto rounded-full px-2 py-0.5 text-xs font-bold"
              :style="{
                backgroundColor: STAGE_COLORS[stage].bg,
                color: STAGE_COLORS[stage].text,
              }"
            >
              {{ stageTxns(stage).length }}
            </span>
          </div>

          <div class="space-y-3">
            <template v-if="stageTxns(stage).length === 0">
              <div
                class="rounded-xl border border-dashed border-[#E2E8F0] bg-white p-4 text-center text-sm text-[#94A3B8]"
              >
                İşlem yok
              </div>
            </template>

            <TransactionDemoTransactionCard
              v-for="t in stageTxns(stage)"
              :key="t.id"
              :transaction="t"
              :get-agent="getAgent"
              :card-bg="stageCardBg(stage)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-8">
      <div class="mb-4 flex items-center gap-2">
        <Clock class="h-4 w-4 text-[#64748B]" />
        <h2 class="text-lg font-semibold text-[#0A1628]">Son aktivite</h2>
      </div>
      <div
        class="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      >
        <div class="grid grid-cols-1 divide-y divide-[#F1F5F9] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3">
          <NuxtLink
            v-for="(activity, idx) in recentActivity"
            :key="`${activity.id}-${idx}`"
            :to="`/transactions/${activity.transactionId}`"
            class="flex cursor-pointer gap-3 p-4 transition-colors hover:bg-[#FAFBFC]"
          >
            <div class="mt-0.5 flex-shrink-0">
              <div
                v-if="activity.type === 'stage_change'"
                class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50"
              >
                <div class="h-2 w-2 rounded-full bg-blue-500" />
              </div>
              <div
                v-else
                class="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50"
              >
                <div class="h-2 w-2 rounded-full bg-amber-500" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-semibold text-[#0A1628]">
                {{ activity.address }}
              </p>
              <p class="mt-0.5 text-xs leading-relaxed text-[#64748B]">
                {{ activity.description }}
              </p>
              <p class="mt-1 text-[10px] text-[#94A3B8]">
                {{ timeAgo(activity.timestamp) }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
