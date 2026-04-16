<script setup lang="ts">
import {
  AGENTS,
  calculateCommission,
  formatCurrency,
  getAgentStats,
} from '~/utils/demo-data';
import VChart from 'vue-echarts';
import {
  ArrowLeft,
  Mail,
  Phone,
  TrendingUp,
  Award,
  ArrowRight,
} from 'lucide-vue-next';
const tx = useTransactionsStore();

const route = useRoute();
const id = computed(() => route.params.id as string);

const agent = computed(() => AGENTS.find((a) => a.id === id.value));

const stats = computed(() =>
  agent.value ? getAgentStats(agent.value.id, tx.transactions) : null,
);

const agentTxns = computed(() =>
  tx.transactions.filter(
    (t) => t.listingAgentId === id.value || t.sellingAgentId === id.value,
  ),
);

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'] as const;
const BASE_EARNINGS: Record<string, number[]> = {
  a1: [8500, 11200, 7400, 14500, 12000, 16800, 15200, 22000, 17500, 9500],
  a2: [12000, 9800, 15200, 18400, 11500, 21000, 18700, 26500, 19800, 13200],
  a3: [5200, 7800, 9500, 8200, 14500, 12400, 11800, 15600, 13200, 8500],
  a4: [3500, 5200, 4800, 7500, 8200, 9500, 8800, 12500, 10200, 6500],
  a5: [9800, 12500, 8700, 15200, 10500, 18400, 14500, 20800, 16200, 10200],
};

const earningsSeries = computed(() => {
  const arr = BASE_EARNINGS[id.value] ?? new Array(10).fill(0);
  return MONTHS.map((m, i) => ({ month: m, earnings: arr[i] ?? 0 }));
});

const roleCounts = computed(() => {
  const listingCount = agentTxns.value.filter((t) => t.listingAgentId === id.value).length;
  const sellingCount = agentTxns.value.filter(
    (t) => t.sellingAgentId === id.value && t.sellingAgentId !== t.listingAgentId,
  ).length;
  const dualCount = agentTxns.value.filter(
    (t) => t.sellingAgentId === id.value && t.listingAgentId === id.value,
  ).length;
  return { listingCount, sellingCount, dualCount };
});

const rolePieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['55%', '75%'],
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      data: [
        { name: 'Listing', value: roleCounts.value.listingCount, itemStyle: { color: '#0A1628' } },
        { name: 'Selling', value: roleCounts.value.sellingCount, itemStyle: { color: '#D4A853' } },
        { name: 'Dual', value: roleCounts.value.dualCount, itemStyle: { color: '#10B981' } },
      ].filter((d) => d.value > 0),
    },
  ],
}));

const earningsLineOption = computed(() => ({
  grid: { left: 10, right: 10, top: 10, bottom: 24, containLabel: true },
  tooltip: {
    trigger: 'axis',
    formatter(params: Array<{ axisValue: string; value: number }>) {
      const p = params?.[0];
      if (!p) return '';
      return `<div class="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-lg text-sm">
        <p class="font-semibold text-[#0A1628] mb-1">${p.axisValue}</p>
        <p class="text-[#64748B]">Kazanç: <span class="font-semibold text-[#0A1628]">${formatCurrency(Number(p.value) || 0)}</span></p>
      </div>`;
    },
  },
  xAxis: {
    type: 'category',
    data: earningsSeries.value.map((d) => d.month),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#94A3B8', fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
    axisLabel: { color: '#94A3B8', fontSize: 11 },
  },
  series: [
    {
      type: 'line',
      smooth: true,
      data: earningsSeries.value.map((d) => d.earnings),
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color: '#D4A853' },
      itemStyle: { color: '#D4A853' },
      areaStyle: { color: 'rgba(212,168,83,0.12)' },
    },
  ],
}));
</script>

<template>
  <div v-if="!agent" class="p-8">
    <p class="text-[#64748B]">Danışman bulunamadı.</p>
    <NuxtLink to="/agents" class="mt-4 text-sm text-[#D4A853] hover:underline"
      >Listeye dön</NuxtLink
    >
  </div>
  <div v-else class="mx-auto max-w-[1200px] p-6 lg:p-8">
    <NuxtLink
      to="/agents"
      class="mb-6 inline-flex items-center gap-2 text-sm text-[#64748B] transition-colors hover:text-[#0A1628]"
    >
      <ArrowLeft class="h-4 w-4" />
      Danışmanlar
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
                style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
              >
                {{ agent.name }}
              </h1>
              <p class="text-sm text-[#64748B]">{{ agent.title }}</p>
              <span class="mt-1 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                {{ agent.specialization }}
              </span>
            </div>
            <div class="flex gap-3">
              <a
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B] transition-colors hover:bg-[#E2E8F0]"
                :href="`mailto:${agent.email}`"
                aria-label="Email"
              >
                <Mail class="h-4 w-4" />
              </a>
              <a
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B] transition-colors hover:bg-[#E2E8F0]"
                :href="`tel:${agent.phone}`"
                aria-label="Phone"
              >
                <Phone class="h-4 w-4" />
              </a>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-4 text-sm text-[#64748B]">
            <span class="truncate">{{ agent.email }}</span>
            <span class="truncate">{{ agent.phone }}</span>
            <span>Katılım: {{ agent.joinDate }}</span>
          </div>
        </div>
      </div>

      <div v-if="stats" class="mt-6 grid grid-cols-2 gap-4 border-t border-[#F1F5F9] pt-5 sm:grid-cols-4">
        <div class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-3 text-center">
          <p class="mb-1 text-xs text-[#64748B]">Toplam işlem</p>
          <p class="text-lg font-bold text-[#0A1628]">{{ stats.totalTransactions }}</p>
        </div>
        <div class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-3 text-center">
          <p class="mb-1 text-xs text-[#64748B]">Tamamlanan</p>
          <p class="text-lg font-bold text-[#10B981]">{{ stats.completedTransactions }}</p>
        </div>
        <div class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-3 text-center">
          <p class="mb-1 text-xs text-[#64748B]">Toplam kazanç</p>
          <p class="text-lg font-bold text-[#D4A853]">{{ formatCurrency(stats.totalEarnings) }}</p>
        </div>
        <div class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-3 text-center">
          <p class="mb-1 text-xs text-[#64748B]">Listing / Selling</p>
          <p class="text-lg font-bold text-[#0A1628]">
            {{ roleCounts.listingCount }} / {{ roleCounts.sellingCount }}
          </p>
        </div>
      </div>
    </div>

    <div class="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:col-span-2">
        <div class="mb-5 flex items-center gap-2">
          <TrendingUp class="h-4 w-4 text-[#D4A853]" />
          <h3 class="text-base font-semibold text-[#0A1628]">Aylık kazanç</h3>
        </div>
        <ClientOnly>
          <VChart class="h-[180px] w-full" :option="earningsLineOption" autoresize />
          <template #fallback>
            <div class="flex h-[180px] items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
              Grafik yükleniyor…
            </div>
          </template>
        </ClientOnly>
      </div>

      <div class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div class="mb-5 flex items-center gap-2">
          <Award class="h-4 w-4 text-[#D4A853]" />
          <h3 class="text-base font-semibold text-[#0A1628]">Rol dağılımı</h3>
        </div>
        <ClientOnly>
          <VChart class="h-[140px] w-full" :option="rolePieOption" autoresize />
          <template #fallback>
            <div class="flex h-[140px] items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
              Grafik yükleniyor…
            </div>
          </template>
        </ClientOnly>

        <div class="mt-2 space-y-2 text-xs">
          <div v-if="roleCounts.listingCount" class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="h-2.5 w-2.5 rounded-full" style="background-color:#0a1628" />
              <span class="text-[#64748B]">Listing</span>
            </div>
            <span class="font-semibold text-[#0A1628]">{{ roleCounts.listingCount }}</span>
          </div>
          <div v-if="roleCounts.sellingCount" class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="h-2.5 w-2.5 rounded-full" style="background-color:#d4a853" />
              <span class="text-[#64748B]">Selling</span>
            </div>
            <span class="font-semibold text-[#0A1628]">{{ roleCounts.sellingCount }}</span>
          </div>
          <div v-if="roleCounts.dualCount" class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="h-2.5 w-2.5 rounded-full" style="background-color:#10b981" />
              <span class="text-[#64748B]">Dual</span>
            </div>
            <span class="font-semibold text-[#0A1628]">{{ roleCounts.dualCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <h3 class="mb-4 text-base font-semibold text-[#0A1628]">İşlem geçmişi</h3>

      <p v-if="agentTxns.length === 0" class="py-8 text-center text-sm text-[#94A3B8]">
        Henüz işlem yok.
      </p>

      <div v-else class="divide-y divide-[#F1F5F9]">
        <div
          v-for="t in agentTxns"
          :key="t.id"
          class="-mx-2 flex cursor-pointer items-center justify-between rounded-lg px-2 py-3 transition-colors hover:bg-[#FAFBFC]"
          @click="navigateTo(`/transactions/${t.id}`)"
        >
          <div>
            <p class="text-sm font-semibold text-[#0A1628]">
              {{ t.propertyAddress.split(',')[0] }}
            </p>
            <div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
              <span>{{ new Date(t.date).toLocaleDateString('tr-TR') }}</span>
              <span
                class="rounded-full px-1.5 py-0.5 font-medium"
                :class="
                  t.listingAgentId === id && t.sellingAgentId === id
                    ? 'bg-purple-50 text-purple-600'
                    : t.listingAgentId === id
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-amber-50 text-amber-700'
                "
              >
                {{
                  t.listingAgentId === id && t.sellingAgentId === id
                    ? 'Dual'
                    : t.listingAgentId === id
                      ? 'Listing'
                      : 'Selling'
                }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <TransactionStageBadge :stage="t.stage" size="sm" />
            <span class="text-sm font-bold text-[#D4A853]">
              {{
                (() => {
                  const c = calculateCommission(t);
                  const isDual = t.listingAgentId === id && t.sellingAgentId === id;
                  const isListing = t.listingAgentId === id;
                  const earned = isDual ? c.listingAgent : isListing ? c.listingAgent : c.sellingAgent;
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
