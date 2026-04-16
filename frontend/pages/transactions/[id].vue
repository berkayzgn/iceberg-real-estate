<script setup lang="ts">
import {
  AGENTS,
  calculateCommission,
  formatCurrency,
  timeAgo,
  getNextStage,
  STAGE_COLORS,
  STAGE_LABELS,
  STAGE_ORDER,
} from '~/utils/demo-data';
import { ArrowLeft, ChevronRight, Home, Building2, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-vue-next';

const tx = useTransactionsStore();
const toast = useToastStore();

const route = useRoute();
const id = computed(() => route.params.id as string);

const transaction = computed(() => tx.findById(id.value));

function agent(aid: string) {
  return AGENTS.find((a) => a.id === aid);
}

const comm = computed(() =>
  transaction.value ? calculateCommission(transaction.value) : null,
);

const nextStage = computed(() =>
  transaction.value ? getNextStage(transaction.value.stage) : null,
);

const stageColors = computed(() =>
  transaction.value ? STAGE_COLORS[transaction.value.stage] : null,
);

const showConfirm = ref(false);

function advance() {
  if (!transaction.value) return;
  const to = nextStage.value;
  tx.advanceStage(transaction.value.id);
  if (to) {
    toast.success(
      to === 'completed' ? 'İşlem tamamlandı.' : 'Aşama güncellendi.',
      'Başarılı',
    );
  }
  showConfirm.value = false;
}

const progressStages = STAGE_ORDER;
</script>

<template>
  <div v-if="!transaction" class="p-8">
    <p class="text-[#64748B]">İşlem bulunamadı.</p>
    <NuxtLink to="/transactions" class="mt-4 text-sm text-[#D4A853] hover:underline"
      >Listeye dön</NuxtLink
    >
  </div>
  <div v-else class="mx-auto max-w-4xl p-6 lg:p-8">
    <NuxtLink
      to="/transactions"
      class="mb-6 inline-block text-sm text-[#64748B] hover:text-[#D4A853]"
    >
      ← İşlemler
    </NuxtLink>
    <div class="mx-auto max-w-[1200px]">
      <!-- Header Card -->
      <div
        class="mb-5 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      >
        <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
              :style="{ backgroundColor: stageColors?.bg ?? '#F1F5F9' }"
            >
              <Building2
                v-if="transaction.propertyType === 'sale'"
                class="h-6 w-6"
                :style="{ color: stageColors?.text ?? '#64748B' }"
              />
              <Home
                v-else
                class="h-6 w-6"
                :style="{ color: stageColors?.text ?? '#64748B' }"
              />
            </div>

            <div class="min-w-0">
              <div class="mb-1 flex flex-wrap items-center gap-3">
                <h1
                  class="text-xl font-bold text-[#0A1628]"
                  style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
                >
                  {{ transaction.propertyAddress.split(',')[0] }}
                </h1>
                <TransactionStageBadge :stage="transaction.stage" />
              </div>

              <p class="text-sm text-[#64748B]">
                {{ transaction.propertyAddress }}
              </p>

              <div class="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                <span class="flex items-center gap-1.5">
                  <Calendar class="h-3.5 w-3.5" />
                  {{ new Date(transaction.date).toLocaleDateString('tr-TR') }}
                </span>
                <span>Ref: {{ transaction.id }}</span>
                <span
                  class="rounded-full px-2 py-0.5 font-medium"
                  :class="
                    transaction.propertyType === 'sale'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-purple-50 text-purple-600'
                  "
                >
                  {{ transaction.propertyType === 'sale' ? 'Satış' : 'Kiralama' }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col items-start gap-3 lg:items-end">
            <div>
              <p class="text-right text-xs text-[#64748B]">Toplam hizmet bedeli</p>
              <p
                class="text-2xl font-bold text-[#0A1628]"
                style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
              >
                {{ formatCurrency(transaction.transactionValue) }}
              </p>
            </div>

            <button
              v-if="nextStage"
              type="button"
              class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
              style="background-color: #d4a853"
              @click="showConfirm = true"
            >
              Aşamayı ilerlet ({{ STAGE_LABELS[nextStage] }})
              <ChevronRight class="h-4 w-4" />
            </button>

            <div v-else class="flex items-center gap-2 text-sm font-semibold text-green-600">
              <CheckCircle class="h-4 w-4" />
              Tamamlandı
            </div>
          </div>
        </div>

        <!-- Stepper -->
        <div class="border-t border-[#F1F5F9] pt-6">
          <div class="flex flex-wrap items-center gap-3">
            <div
              v-for="(s, idx) in progressStages"
              :key="s"
              class="flex items-center gap-3"
            >
              <div class="flex items-center gap-2">
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                  :class="
                    STAGE_ORDER.indexOf(transaction.stage) >= idx
                      ? 'bg-[#D4A853] text-white'
                      : 'bg-[#F1F5F9] text-[#94A3B8]'
                  "
                >
                  {{ idx + 1 }}
                </div>
                <span
                  class="text-xs font-semibold"
                  :class="
                    STAGE_ORDER.indexOf(transaction.stage) >= idx
                      ? 'text-[#0A1628]'
                      : 'text-[#94A3B8]'
                  "
                >
                  {{ STAGE_LABELS[s] }}
                </span>
              </div>
              <div
                v-if="idx < progressStages.length - 1"
                class="hidden h-px w-10 bg-[#E2E8F0] sm:block"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <!-- Commission breakdown -->
        <div
          class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        >
          <h3 class="mb-5 text-base font-semibold text-[#0A1628]">
            Komisyon dağılımı
          </h3>
          <div v-if="comm" class="space-y-3">
            <div class="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-4">
              <span class="text-sm font-medium text-[#64748B]">Ajans (%50)</span>
              <span class="text-sm font-bold text-[#0A1628]">{{ formatCurrency(comm.company) }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-4">
              <span class="text-sm font-medium text-[#64748B]">Danışman(lar) (%50)</span>
              <span class="text-sm font-bold text-[#D4A853]">{{ formatCurrency(comm.agentTotal) }}</span>
            </div>
            <div class="mt-2 flex h-3 overflow-hidden rounded-full">
              <div class="bg-[#0A1628]" style="width: 50%" />
              <div class="bg-[#D4A853]" style="width: 50%" />
            </div>
          </div>
        </div>

        <!-- Agent assignments -->
        <div
          class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        >
          <h3 class="mb-5 text-base font-semibold text-[#0A1628]">
            Danışman atamaları
          </h3>

          <div class="space-y-4">
            <div
              v-if="agent(transaction.listingAgentId)"
              class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-4"
            >
              <div class="mb-3 flex items-center justify-between">
                <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                  >İlan danışmanı</span
                >
                <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600"
                  >Listing</span
                >
              </div>

              <ReportsAgentChip :agent="agent(transaction.listingAgentId)!" />

              <div class="mt-3 border-t border-[#E2E8F0] pt-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-[#64748B]">Kazanç</span>
                  <span class="text-sm font-bold text-[#D4A853]">
                    {{ formatCurrency(comm?.listingAgent ?? 0) }}
                  </span>
                </div>
              </div>
            </div>

            <div
              v-if="transaction.listingAgentId !== transaction.sellingAgentId && agent(transaction.sellingAgentId)"
              class="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-4"
            >
              <div class="mb-3 flex items-center justify-between">
                <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                  >Satış danışmanı</span
                >
                <span class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                  >Selling</span
                >
              </div>

              <ReportsAgentChip :agent="agent(transaction.sellingAgentId)!" />

              <div class="mt-3 border-t border-[#E2E8F0] pt-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-[#64748B]">Kazanç</span>
                  <span class="text-sm font-bold text-[#D4A853]">
                    {{ formatCurrency(comm?.sellingAgent ?? 0) }}
                  </span>
                </div>
              </div>
            </div>

            <div
              v-if="transaction.listingAgentId === transaction.sellingAgentId"
              class="rounded-xl border border-amber-100 bg-amber-50 p-3"
            >
              <p class="text-xs font-medium text-amber-700">
                Aynı danışman: tek pay ({{ formatCurrency(comm?.listingAgent ?? 0) }})
              </p>
            </div>

            <div class="rounded-xl border border-white/10 p-4" style="background-color: #0a1628">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs font-semibold uppercase tracking-wider text-white/60"
                  >Ajans</span
                >
                <span class="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/80"
                  >50%</span
                >
              </div>
              <p class="text-sm font-bold text-white">PropEx Agency</p>
              <div class="mt-3 border-t border-white/10 pt-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-white/60">Gelir</span>
                  <span class="text-sm font-bold text-[#D4A853]">
                    {{ formatCurrency(comm?.company ?? 0) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity timeline -->
        <div
          class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        >
          <div class="mb-5 flex items-center gap-2">
            <Clock class="h-4 w-4 text-[#64748B]" />
            <h3 class="text-base font-semibold text-[#0A1628]">Aktivite</h3>
          </div>

          <div class="relative">
            <div class="absolute bottom-0 left-3.5 top-0 w-px bg-[#E2E8F0]" />
            <div class="space-y-5">
              <div
                v-for="(entry, idx) in [...transaction.activityLog].slice().reverse()"
                :key="`${entry.id}-${idx}`"
                class="relative flex gap-4"
              >
                <div
                  class="z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ring-2 ring-white"
                  :class="
                    entry.type === 'stage_change'
                      ? 'bg-[#0A1628]'
                      : entry.type === 'financial'
                        ? 'bg-[#D4A853]'
                        : 'bg-[#94A3B8]'
                  "
                >
                  <div class="h-2 w-2 rounded-full bg-white" />
                </div>
                <div class="flex-1 pb-1 pt-0.5">
                  <p class="text-sm leading-relaxed text-[#0A1628]">
                    {{ entry.description }}
                  </p>
                  <div
                    v-if="entry.fromStage && entry.toStage"
                    class="mt-1 flex items-center gap-2"
                  >
                    <TransactionStageBadge :stage="entry.fromStage" size="sm" />
                    <ChevronRight class="h-3 w-3 text-[#94A3B8]" />
                    <TransactionStageBadge :stage="entry.toStage" size="sm" />
                  </div>
                  <p class="mt-1 text-xs text-[#94A3B8]">
                    {{ timeAgo(entry.timestamp) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirm Modal -->
      <div
        v-if="showConfirm && nextStage"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showConfirm = false" />
        <div class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
              <AlertCircle class="h-5 w-5 text-amber-500" />
            </div>
            <h3 class="text-base font-semibold text-[#0A1628]">Aşamayı ilerlet?</h3>
          </div>
          <p class="mb-2 text-sm text-[#64748B]">
            Bu işlem aşaması değiştirilecek.
          </p>
          <div class="mb-6 flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-3">
            <span class="text-sm font-semibold text-[#0A1628]">
              {{ STAGE_LABELS[transaction.stage] }}
            </span>
            <ChevronRight class="h-4 w-4 text-[#94A3B8]" />
            <span class="text-sm font-semibold text-[#D4A853]">
              {{ STAGE_LABELS[nextStage] }}
            </span>
          </div>
          <p class="mb-5 text-xs text-[#94A3B8]">
            Demo: işlem geçmişine bir kayıt eklenir.
          </p>
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-xl border border-[#E2E8F0] py-2.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
              @click="showConfirm = false"
            >
              Vazgeç
            </button>
            <button
              type="button"
              class="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style="background-color: #d4a853"
              @click="advance"
            >
              İlerlet
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
