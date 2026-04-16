<script setup lang="ts">
import { TrendingUp, Download, ChevronRight } from 'lucide-vue-next';
import {
  AGENTS,
  MONTHLY_DATA,
  QUARTERLY_DATA,
  YEARLY_DATA,
  calculateCommission,
  formatCurrency,
} from '~/utils/demo-data';
const tx = useTransactionsStore();

type Period = 'monthly' | 'quarterly' | 'yearly';

const period = ref<Period>('monthly');

const completed = computed(() =>
  tx.transactions.filter((txn) => txn.stage === 'completed'),
);

const totalCommission = computed(() =>
  completed.value.reduce((s, txn) => s + txn.transactionValue, 0),
);
const agencyShare = computed(() => totalCommission.value * 0.5);
const agentPayouts = computed(() =>
  completed.value.reduce(
    (s, txn) => s + calculateCommission(txn).agentTotal,
    0,
  ),
);

const chartData = computed(() => {
  if (period.value === 'monthly') return MONTHLY_DATA;
  if (period.value === 'quarterly') return QUARTERLY_DATA;
  return YEARLY_DATA;
});

function getAgent(id: string) {
  return AGENTS.find((a) => a.id === id);
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="mx-auto max-w-[1400px] p-6 lg:p-8">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1
          class="text-2xl font-bold text-[#0A1628] lg:text-3xl"
          style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
        >
          Finansal raporlar
        </h1>
        <p class="mt-0.5 text-sm text-[#64748B]">
          Komisyon dağılımı ve tamamlanan işlemler (demo veri).
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
      >
        <Download class="h-4 w-4" />
        Dışa aktar
      </button>
    </div>

    <div class="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
      <div
        class="rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        style="background-color: #f8fafc"
      >
        <p class="mb-2 text-sm font-medium text-[#64748B]">Toplam hizmet bedeli</p>
        <p
          class="mb-1 text-2xl font-bold"
          style="color: #0a1628; font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
        >
          {{ formatCurrency(totalCommission) }}
        </p>
        <p class="text-xs text-[#94A3B8]">
          {{ completed.length }} tamamlanan işlem
        </p>
      </div>
      <div
        class="rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        style="background-color: #f0fdf4"
      >
        <p class="mb-2 text-sm font-medium text-[#64748B]">Ajans payı (%50)</p>
        <p
          class="mb-1 text-2xl font-bold"
          style="color: #059669; font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
        >
          {{ formatCurrency(agencyShare) }}
        </p>
        <p class="text-xs text-[#94A3B8]">Şirket payı</p>
      </div>
      <div
        class="rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        style="background-color: #fffbeb"
      >
        <p class="mb-2 text-sm font-medium text-[#64748B]">Danışman ödemeleri</p>
        <p
          class="mb-1 text-2xl font-bold"
          style="color: #d4a853; font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
        >
          {{ formatCurrency(agentPayouts) }}
        </p>
        <p class="text-xs text-[#94A3B8]">Dağıtılan paylar</p>
      </div>
    </div>

    <div
      class="mb-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
    >
      <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div class="flex items-center gap-2">
          <TrendingUp class="h-4 w-4 text-[#D4A853]" />
          <h3 class="text-lg font-semibold text-[#0A1628]">
            Ajans ve danışman payı
          </h3>
        </div>
        <div class="flex overflow-hidden rounded-xl border border-[#E2E8F0] text-sm">
          <button
            v-for="p in (['monthly', 'quarterly', 'yearly'] as Period[])"
            :key="p"
            type="button"
            class="px-4 py-2 transition-colors"
            :class="
              period === p
                ? 'text-white'
                : 'text-[#64748B] hover:bg-[#F1F5F9]'
            "
            :style="period === p ? { backgroundColor: '#0A1628' } : {}"
            @click="period = p"
          >
            {{
              p === 'monthly'
                ? 'Aylık'
                : p === 'quarterly'
                  ? 'Çeyrek'
                  : 'Yıllık'
            }}
          </button>
        </div>
      </div>

      <ChartsCommissionBarChart
        :key="period"
        :chart-data="chartData"
        legend-agency="Ajans payı"
        legend-agents="Danışman payı"
      />

      <div class="mt-4 flex flex-wrap justify-end gap-4 border-t border-[#F1F5F9] pt-4">
        <p class="text-xs text-[#94A3B8]">
          Varsayılan bölüşüm: ajans %50, kalan %50 danışman(lar)a (aynı danışmanda
          tek pay).
        </p>
      </div>
    </div>

    <div
      class="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
    >
      <div class="border-b border-[#F1F5F9] px-6 py-4">
        <h3 class="text-lg font-semibold text-[#0A1628]">Tamamlanan işlemler</h3>
        <p class="mt-0.5 text-sm text-[#64748B]">
          {{ completed.length }} kayıt
        </p>
      </div>

      <div v-if="completed.length === 0" class="py-16 text-center text-sm text-[#94A3B8]">
        Tamamlanan işlem yok.
      </div>
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[#F1F5F9] bg-[#FAFBFC]">
                <th
                  class="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                >
                  Mülk
                </th>
                <th
                  class="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                >
                  Tarih
                </th>
                <th
                  class="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                >
                  Toplam ücret
                </th>
                <th
                  class="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                >
                  Ajans %50
                </th>
                <th
                  class="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                >
                  Danışman toplam
                </th>
                <th
                  class="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                >
                  İlan danışmanı
                </th>
                <th
                  class="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                >
                  Satış danışmanı
                </th>
                <th class="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F8FAFC]">
              <tr
                v-for="txn in completed"
                :key="txn.id"
                class="group cursor-pointer transition-colors hover:bg-[#FAFBFC]"
                @click="navigateTo(`/transactions/${txn.id}`)"
              >
                <td class="px-5 py-4">
                  <p class="max-w-[180px] truncate text-sm font-semibold text-[#0A1628]">
                    {{ txn.propertyAddress.split(',')[0] }}
                  </p>
                  <p class="text-xs text-[#94A3B8]">{{ txn.id }}</p>
                </td>
                <td class="whitespace-nowrap px-5 py-4 text-sm text-[#64748B]">
                  {{ formatDateShort(txn.date) }}
                </td>
                <td class="px-5 py-4 text-sm font-bold text-[#0A1628]">
                  {{ formatCurrency(txn.transactionValue) }}
                </td>
                <td class="px-5 py-4 text-sm font-semibold text-[#059669]">
                  {{ formatCurrency(calculateCommission(txn).company) }}
                </td>
                <td class="px-5 py-4 text-sm font-semibold text-[#D4A853]">
                  {{ formatCurrency(calculateCommission(txn).agentTotal) }}
                </td>
                <td class="px-5 py-4">
                  <ReportsAgentChip
                    v-if="getAgent(txn.listingAgentId)"
                    :agent="getAgent(txn.listingAgentId)!"
                    size="sm"
                  />
                  <p
                    v-if="getAgent(txn.listingAgentId)"
                    class="mt-0.5 pl-8 text-xs text-[#D4A853]"
                  >
                    {{ formatCurrency(calculateCommission(txn).listingAgent) }}
                  </p>
                </td>
                <td class="px-5 py-4">
                  <span
                    v-if="txn.listingAgentId === txn.sellingAgentId"
                    class="text-xs italic text-[#94A3B8]"
                    >Aynı danışman</span
                  >
                  <template v-else-if="getAgent(txn.sellingAgentId)">
                    <ReportsAgentChip
                      :agent="getAgent(txn.sellingAgentId)!"
                      size="sm"
                    />
                    <p class="mt-0.5 pl-8 text-xs text-[#D4A853]">
                      {{ formatCurrency(calculateCommission(txn).sellingAgent) }}
                    </p>
                  </template>
                </td>
                <td class="px-4 py-4">
                  <ChevronRight
                    class="h-4 w-4 text-[#CBD5E1] transition-colors group-hover:text-[#D4A853]"
                  />
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="background-color: #0a1628">
                <td class="px-5 py-4 text-sm font-semibold text-white">
                  Toplam ({{ completed.length }} işlem)
                </td>
                <td class="px-5 py-4" />
                <td class="px-5 py-4 text-sm font-bold text-white">
                  {{ formatCurrency(totalCommission) }}
                </td>
                <td class="px-5 py-4 text-sm font-bold text-green-400">
                  {{ formatCurrency(agencyShare) }}
                </td>
                <td class="px-5 py-4 text-sm font-bold text-[#D4A853]">
                  {{ formatCurrency(agentPayouts) }}
                </td>
                <td colspan="3" class="px-5 py-4" />
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="divide-y divide-[#F1F5F9] md:hidden">
          <div
            v-for="txn in completed"
            :key="`m-${txn.id}`"
            class="cursor-pointer p-4 transition-colors hover:bg-[#FAFBFC]"
            @click="navigateTo(`/transactions/${txn.id}`)"
          >
            <div class="mb-2 flex items-start justify-between">
              <p class="text-sm font-semibold text-[#0A1628]">
                {{ txn.propertyAddress.split(',')[0] }}
              </p>
              <TransactionStageBadge :stage="txn.stage" size="sm" />
            </div>
            <div class="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p class="text-xs text-[#94A3B8]">Toplam</p>
                <p class="text-sm font-bold text-[#0A1628]">
                  {{ formatCurrency(txn.transactionValue) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-[#94A3B8]">Ajans</p>
                <p class="text-sm font-bold text-[#059669]">
                  {{ formatCurrency(calculateCommission(txn).company) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-[#94A3B8]">Danışman</p>
                <p class="text-sm font-bold text-[#D4A853]">
                  {{ formatCurrency(calculateCommission(txn).agentTotal) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
