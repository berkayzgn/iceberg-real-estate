<script setup lang="ts">
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  FileX,
  ChevronRight,
  Trash2,
} from "lucide-vue-next";
import type { PropertyType, Stage, Transaction } from "~/utils/demo-data";
import {
  STAGE_ORDER,
  calculateCommission,
  formatCurrency,
  formatDate,
} from "~/utils/demo-data";
import { toApiErrorInfo } from "~/utils/api-error";
const tx = useTransactionsStore();
const agents = useAgentsStore();
const toast = useToastStore();
const { t } = useI18n();

function getAgent(id: string) {
  return agents.findById(id);
}

type SortKey = "date" | "transactionValue" | "stage";
type SortDir = "asc" | "desc";

const search = ref("");
const stageFilter = ref<Stage | "all">("all");
const agentFilter = ref<string | "all">("all");
const typeFilter = ref<PropertyType | "all">("all");
const sortKey = ref<SortKey>("date");
const sortDir = ref<SortDir>("desc");

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    return;
  }
  sortKey.value = key;
  sortDir.value = "desc";
}

const filtered = computed<Transaction[]>(() => {
  const q = search.value.trim().toLowerCase();

  return [...tx.transactions]
    .filter((t) => {
      const matchSearch =
        !q ||
        t.propertyAddress.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q);
      const matchStage =
        stageFilter.value === "all" || t.stage === stageFilter.value;
      const matchAgent =
        agentFilter.value === "all" ||
        t.listingAgentId === agentFilter.value ||
        t.sellingAgentId === agentFilter.value;
      const matchType =
        typeFilter.value === "all" || t.propertyType === typeFilter.value;
      return matchSearch && matchStage && matchAgent && matchType;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey.value === "date") {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortKey.value === "transactionValue") {
        cmp = a.transactionValue - b.transactionValue;
      } else if (sortKey.value === "stage") {
        cmp = STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
      }
      return sortDir.value === "asc" ? cmp : -cmp;
    });
});

function clearFilters() {
  search.value = "";
  stageFilter.value = "all";
  agentFilter.value = "all";
  typeFilter.value = "all";
}

async function removeTxn(id: string) {
  const ok = window.confirm(t("common.confirmDelete"));
  if (!ok) return;
  try {
    await tx.removeTransaction(id);
    toast.success(t("common.delete"), t("common.panel"));
  } catch (error) {
    const err = toApiErrorInfo(error, t("transactions.deleteError"));
    toast.error(err.message, err.title);
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1400px] p-6 lg:p-8">
    <div class="mb-6">
      <div>
        <h1
          class="text-2xl font-bold text-[#0A1628]"
          style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
        >
          İşlemler
        </h1>
        <p class="mt-0.5 text-sm text-[#64748B]">
          {{ tx.transactions.length }} kayıt.
        </p>
      </div>
    </div>

    <div
      class="mb-5 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
    >
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative min-w-[200px] flex-1">
          <Search
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            v-model="search"
            class="w-full rounded-lg border border-[#E2E8F0] bg-[#FAFBFC] py-2 pl-9 pr-4 text-sm text-[#0A1628] placeholder-[#94A3B8] transition-all focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20"
            :placeholder="t('transactions.searchPlaceholder')"
          />
        </div>

        <div class="flex items-center gap-1.5">
          <SlidersHorizontal class="h-4 w-4 text-[#94A3B8]" />
          <select
            v-model="stageFilter"
            class="cursor-pointer rounded-lg border border-[#E2E8F0] bg-[#FAFBFC] px-3 py-2 text-sm text-[#0A1628] transition-all focus:border-[#D4A853] focus:outline-none"
          >
            <option value="all">{{ t("transactions.allStages") }}</option>
            <option v-for="s in STAGE_ORDER" :key="s" :value="s">
              {{ t(`stages.${s}`) }}
            </option>
          </select>
        </div>

        <select
          v-model="agentFilter"
          class="cursor-pointer rounded-lg border border-[#E2E8F0] bg-[#FAFBFC] px-3 py-2 text-sm text-[#0A1628] transition-all focus:border-[#D4A853] focus:outline-none"
        >
          <option value="all">{{ t("transactions.allAgents") }}</option>
          <option v-for="a in agents.agents" :key="a.id" :value="a.id">
            {{ a.name }}
          </option>
        </select>

        <div
          class="flex overflow-hidden rounded-lg border border-[#E2E8F0] text-sm"
        >
          <button
            v-for="typeOpt in (['all', 'sale', 'rental'] as const)"
            :key="typeOpt"
            type="button"
            class="px-3 py-2 transition-colors"
            :class="
              typeFilter === typeOpt
                ? 'bg-[#0A1628] text-white'
                : 'text-[#64748B] hover:bg-[#F1F5F9]'
            "
            @click="typeFilter = typeOpt"
          >
            {{
              typeOpt === "all"
                ? t("dashboard.all")
                : typeOpt === "sale"
                ? t("transactions.sale")
                : t("transactions.rental")
            }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="filtered.length === 0">
      <div
        class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white py-20 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      >
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5F9]"
        >
          <FileX class="h-8 w-8 text-[#CBD5E1]" />
        </div>
        <div class="text-center">
          <h3 class="text-base font-semibold text-[#0A1628]">
            {{ t("transactions.noResults") }}
          </h3>
          <p class="mt-1 text-sm text-[#64748B]">
            {{ t("transactions.noResultsHint") }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
          @click="clearFilters"
        >
          {{ t("transactions.clearFilters") }}
        </button>
      </div>
    </div>

    <template v-else>
      <div
        class="hidden overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] md:block"
      >
        <table class="w-full">
          <thead>
            <tr class="border-b border-[#F1F5F9] bg-[#FAFBFC]">
              <th class="px-5 py-3.5 text-left">
                <span
                  class="text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                  >{{ t("transactions.property") }}</span
                >
              </th>
              <th class="px-4 py-3.5 text-left">
                <button
                  type="button"
                  class="group flex items-center gap-1 text-xs font-semibold text-[#64748B] transition-colors hover:text-[#0A1628]"
                  @click="toggleSort('transactionValue')"
                >
                  Değer
                  <ArrowUpDown
                    class="h-3 w-3 transition-colors"
                    :class="
                      sortKey === 'transactionValue'
                        ? 'text-[#D4A853]'
                        : 'text-[#CBD5E1]'
                    "
                  />
                </button>
              </th>
              <th class="px-4 py-3.5 text-left">
                <button
                  type="button"
                  class="group flex items-center gap-1 text-xs font-semibold text-[#64748B] transition-colors hover:text-[#0A1628]"
                  @click="toggleSort('stage')"
                >
                  Aşama
                  <ArrowUpDown
                    class="h-3 w-3 transition-colors"
                    :class="
                      sortKey === 'stage' ? 'text-[#D4A853]' : 'text-[#CBD5E1]'
                    "
                  />
                </button>
              </th>
              <th class="px-4 py-3.5 text-left">
                <span
                  class="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                  >{{ t("transactions.listingAgent") }}</span
                >
              </th>
              <th class="px-4 py-3.5 text-left">
                <span
                  class="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                  >{{ t("transactions.sellingAgent") }}</span
                >
              </th>
              <th class="px-4 py-3.5 text-left">
                <span
                  class="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                  >{{ t("transactions.commission") }}</span
                >
              </th>
              <th class="px-4 py-3.5 text-left">
                <button
                  type="button"
                  class="group flex items-center gap-1 text-xs font-semibold text-[#64748B] transition-colors hover:text-[#0A1628]"
                  @click="toggleSort('date')"
                >
                  Tarih
                  <ArrowUpDown
                    class="h-3 w-3 transition-colors"
                    :class="
                      sortKey === 'date' ? 'text-[#D4A853]' : 'text-[#CBD5E1]'
                    "
                  />
                </button>
              </th>
              <th class="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F8FAFC]">
            <tr
              v-for="txn in filtered"
              :key="txn.id"
              class="group cursor-pointer transition-colors hover:bg-[#FAFBFC]"
              @click="navigateTo(`/transactions/${txn.id}`)"
            >
              <td class="px-5 py-4">
                <div>
                  <p
                    class="max-w-[220px] truncate text-sm font-semibold text-[#0A1628]"
                  >
                    {{ txn.propertyAddress.split(",")[0] }}
                  </p>
                  <div class="mt-0.5 flex items-center gap-2">
                    <span class="text-xs text-[#94A3B8]">{{ txn.id }}</span>
                    <span
                      class="rounded-full px-1.5 py-0.5 text-xs font-medium"
                      :class="
                        txn.propertyType === 'sale'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-purple-50 text-purple-600'
                      "
                    >
                      {{
                        txn.propertyType === "sale"
                          ? t("transactions.sale")
                          : t("transactions.rental")
                      }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 text-sm font-bold text-[#0A1628]">
                {{ formatCurrency(txn.transactionValue) }}
              </td>
              <td class="px-4 py-4">
                <TransactionStageBadge :stage="txn.stage" size="sm" />
              </td>
              <td class="px-4 py-4">
                <ReportsAgentChip
                  v-if="getAgent(txn.listingAgentId)"
                  :agent="getAgent(txn.listingAgentId)!"
                  size="sm"
                />
              </td>
              <td class="px-4 py-4">
                <span
                  v-if="txn.listingAgentId === txn.sellingAgentId"
                  class="text-xs italic text-[#94A3B8]"
                  >{{ t("transactions.sameAgent") }}</span
                >
                <ReportsAgentChip
                  v-else-if="getAgent(txn.sellingAgentId)"
                  :agent="getAgent(txn.sellingAgentId)!"
                  size="sm"
                />
              </td>
              <td class="px-4 py-4">
                <span class="text-sm font-semibold text-[#D4A853]">
                  {{ formatCurrency(calculateCommission(txn).agentTotal) }}
                </span>
              </td>
              <td class="px-4 py-4 text-sm text-[#64748B]">
                {{ formatDate(txn.date) }}
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-md p-1.5 text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-red-600"
                    :title="t('common.delete')"
                    @click.stop="removeTxn(txn.id)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                  <ChevronRight
                    class="h-4 w-4 text-[#CBD5E1] transition-colors group-hover:text-[#D4A853]"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-3 md:hidden">
        <div
          v-for="txn in filtered"
          :key="`m-${txn.id}`"
          class="cursor-pointer rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:shadow-md"
          @click="navigateTo(`/transactions/${txn.id}`)"
        >
          <div class="mb-2 flex items-start justify-between">
            <p class="text-sm font-semibold text-[#0A1628]">
              {{ txn.propertyAddress.split(",")[0] }}
            </p>
            <TransactionStageBadge :stage="txn.stage" size="sm" />
          </div>
          <p class="mb-3 text-xs text-[#94A3B8]">
            {{ txn.id }} · {{ formatDate(txn.date) }}
          </p>
          <div class="flex items-center justify-between">
            <ReportsAgentChip
              v-if="getAgent(txn.listingAgentId)"
              :agent="getAgent(txn.listingAgentId)!"
              size="sm"
            />
            <div class="text-right">
              <p class="text-xs text-[#64748B]">
                {{ t("transactions.commission") }}
              </p>
              <p class="text-sm font-bold text-[#D4A853]">
                {{ formatCurrency(calculateCommission(txn).agentTotal) }}
              </p>
            </div>
          </div>
          <div class="mt-3 border-t border-[#F1F5F9] pt-3">
            <button
              type="button"
              class="inline-flex items-center gap-1 text-xs font-medium text-red-600"
              @click.stop="removeTxn(txn.id)"
            >
              <Trash2 class="h-3.5 w-3.5" />
              {{ t("common.delete") }}
            </button>
          </div>
        </div>
      </div>

      <p class="mt-4 text-center text-xs text-[#94A3B8]">
        {{ filtered.length }} / {{ tx.transactions.length }} gösteriliyor
      </p>
    </template>
  </div>
</template>
