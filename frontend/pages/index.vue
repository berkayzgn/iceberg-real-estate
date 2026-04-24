<script setup lang="ts">
import { Plus, ArrowRight, Clock, Filter } from "lucide-vue-next";
import {
  STAGE_ORDER,
  STAGE_COLORS,
  type Stage,
  calculateCommission,
} from "~/utils/domain";
import { formatActivityEntry } from "~/utils/format-activity";
import { toApiErrorInfo } from "~/utils/api-error";

const tx = useTransactionsStore();
const ui = useUiStore();
const toast = useToastStore();
const agents = useAgentsStore();
const { t } = useI18n();
const { timeAgo } = useDateTimeFormat();

const draggingTransactionId = ref<string | null>(null);
const dragOverStage = ref<Stage | null>(null);
const activityType = ref<"all" | "stage_change" | "financial">("all");
const activityPage = ref(1);
const activityPageSize = 6;

function getAgent(id: string) {
  return agents.findById(id);
}

const completed = computed(() =>
  tx.transactions.filter((t) => t.stage === "completed")
);
const active = computed(() =>
  tx.transactions.filter((t) => t.stage !== "completed")
);
const totalRevenue = computed(() =>
  completed.value.reduce((s, t) => s + t.transactionValue, 0)
);
const pendingCommissions = computed(() =>
  active.value.reduce((s, t) => s + calculateCommission(t).agentTotal, 0)
);

const metrics = computed(() => [
  {
    label: t("dashboard.metrics.total"),
    value: tx.transactions.length,
    displayMode: "plain" as const,
  },
  {
    label: t("dashboard.metrics.active"),
    value: active.value.length,
    displayMode: "plain" as const,
  },
  {
    label: t("dashboard.metrics.completedVolume"),
    value: totalRevenue.value,
    displayMode: "currency" as const,
  },
  {
    label: t("dashboard.metrics.pendingAgentShare"),
    value: pendingCommissions.value,
    displayMode: "currency" as const,
  },
]);

const allActivity = computed(() =>
  tx.transactions
    .flatMap((txn) =>
      txn.activityLog.map((a) => ({
        ...a,
        transactionId: txn.id,
        address: txn.propertyAddress.split(",")[0] ?? "",
        displayText: formatActivityEntry(a, t),
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    ),
);

const filteredActivity = computed(() =>
  allActivity.value.filter(
    (entry) => activityType.value === "all" || entry.type === activityType.value
  )
);

const activityPageCount = computed(() =>
  Math.max(1, Math.ceil(filteredActivity.value.length / activityPageSize))
);

const pagedActivity = computed(() => {
  const start = (activityPage.value - 1) * activityPageSize;
  return filteredActivity.value.slice(start, start + activityPageSize);
});

watch([activityType, filteredActivity], () => {
  activityPage.value = 1;
});

function stageTxns(stage: (typeof STAGE_ORDER)[number]) {
  return tx.transactions.filter((t) => t.stage === stage);
}

function stageCardBg(stage: (typeof STAGE_ORDER)[number]) {
  return STAGE_COLORS[stage].bg;
}

function stageLabel(stage: Stage) {
  return t(`stages.${stage}`);
}

function onDragStart(event: DragEvent, id: string) {
  draggingTransactionId.value = id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  }
}

function onDragEnd() {
  draggingTransactionId.value = null;
  dragOverStage.value = null;
}

function onDragOver(stage: Stage) {
  const current = draggingTransactionId.value
    ? tx.findById(draggingTransactionId.value)
    : null;
  if (!current || getNextStage(current.stage) !== stage) return;
  dragOverStage.value = stage;
}

async function onDrop(stage: Stage) {
  const transactionId = draggingTransactionId.value;
  dragOverStage.value = null;
  if (!transactionId) return;

  const current = tx.findById(transactionId);
  if (!current) return;
  if (current.stage === stage) return;
  if (getNextStage(current.stage) !== stage) return;

  try {
    await tx.setStage(transactionId, stage);
    await tx.fetchAll(true);
    toast.success(t("dashboard.toastStageMoved", { stage: stageLabel(stage) }));
  } catch (error) {
    const err = toApiErrorInfo(error, t, "dashboard.toastStageError");
    toast.error(err.message, err.title);
  }
}

onMounted(async () => {
  await Promise.all([agents.fetchAll(true), tx.fetchAll(true)]);
});
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
          {{ t("dashboard.subtitle") }}
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-200 transition-all hover:opacity-90 active:scale-95"
        style="background-color: #d4a853"
        @click="ui.openCreateTransaction()"
      >
        <Plus class="h-4 w-4" />
        <span class="hidden sm:inline">{{ t("common.newTransaction") }}</span>
      </button>
    </div>

    <div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <DashboardStatCard
        v-for="m in metrics"
        :key="m.label"
        :label="m.label"
        :value="m.value"
        :display-mode="m.displayMode"
      />
    </div>

    <div class="min-w-0">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-[#0A1628]">
          {{ t("dashboard.funnel") }}
        </h2>
        <NuxtLink
          to="/transactions"
          class="flex items-center gap-1 text-sm text-[#64748B] transition-colors hover:text-[#D4A853]"
        >
          {{ t("dashboard.all") }}
          <ArrowRight class="h-4 w-4" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="stage in STAGE_ORDER"
          :key="stage"
          class="rounded-2xl border border-[#E2E8F0] p-3 transition-all"
          :class="dragOverStage === stage ? 'ring-2 ring-[#D4A853]/50' : ''"
          :style="{
            backgroundColor: dragOverStage === stage ? '#FFFAEF' : '#ffffff',
          }"
          @dragover.prevent="onDragOver(stage)"
          @dragleave="dragOverStage = null"
          @drop.prevent="onDrop(stage)"
        >
          <div class="mb-3 flex items-center gap-2">
            <div
              class="h-2 w-2 rounded-full"
              :style="{ backgroundColor: STAGE_COLORS[stage].dot }"
            />
            <span class="text-sm font-semibold text-[#0A1628]">
              {{ stageLabel(stage) }}
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
                {{ t("dashboard.noTransaction") }}
              </div>
            </template>

            <div
              v-for="t in stageTxns(stage)"
              :key="t.id"
              draggable="true"
              class="cursor-grab active:cursor-grabbing"
              :class="draggingTransactionId === t.id ? 'opacity-60' : ''"
              @dragstart="onDragStart($event, t.id)"
              @dragend="onDragEnd"
            >
              <TransactionPipelineTransactionCard
                :transaction="t"
                :get-agent="getAgent"
                :card-bg="stageCardBg(stage)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-8">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <Clock class="h-4 w-4 text-[#64748B]" />
          <h2 class="text-lg font-semibold text-[#0A1628]">
            {{ t("dashboard.activity") }}
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <Filter class="h-4 w-4 text-[#94A3B8]" />
          <select
            v-model="activityType"
            class="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-[#0A1628] focus:border-[#D4A853] focus:outline-none"
          >
            <option value="all">{{ t("dashboard.activityFilterAll") }}</option>
            <option value="stage_change">
              {{ t("dashboard.activityFilterStage") }}
            </option>
            <option value="financial">
              {{ t("dashboard.activityFilterFinancial") }}
            </option>
          </select>
        </div>
      </div>
      <div
        class="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      >
        <div class="divide-y divide-[#F1F5F9]">
          <div
            class="hidden bg-[#FAFBFC] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B] md:grid md:grid-cols-[180px_1fr_140px_90px]"
          >
            <span>{{ t("dashboard.activityTable.transaction") }}</span>
            <span>{{ t("dashboard.activityTable.detail") }}</span>
            <span>{{ t("dashboard.activityTable.type") }}</span>
            <span class="text-right">{{
              t("dashboard.activityTable.time")
            }}</span>
          </div>
          <NuxtLink
            v-for="(activity, idx) in pagedActivity"
            :key="`${activity.id}-${idx}`"
            :to="`/transactions/${activity.transactionId}`"
            class="grid grid-cols-1 gap-1 px-4 py-3 transition-colors hover:bg-[#FAFBFC] md:grid-cols-[180px_1fr_140px_90px] md:items-center md:gap-3"
          >
            <p class="truncate text-xs font-semibold text-[#0A1628]">
              {{ activity.address }}
            </p>
            <p class="truncate text-xs text-[#64748B]">
              {{ activity.displayText }}
            </p>
            <div>
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
                :class="
                  activity.type === 'stage_change'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-amber-50 text-amber-700'
                "
              >
                {{
                  activity.type === "stage_change"
                    ? t("dashboard.activityType.stage")
                    : t("dashboard.activityType.financial")
                }}
              </span>
            </div>
            <div class="text-left md:text-right">
              <p class="text-[11px] text-[#94A3B8]">
                {{ timeAgo(activity.timestamp) }}
              </p>
            </div>
          </NuxtLink>
          <div
            v-if="pagedActivity.length === 0"
            class="px-4 py-8 text-center text-sm text-[#94A3B8]"
          >
            {{ t("dashboard.activityEmpty") }}
          </div>
        </div>
        <div
          class="flex items-center justify-between border-t border-[#F1F5F9] px-4 py-3 text-xs text-[#64748B]"
        >
          <span>{{
            t("dashboard.activityPageStatus", {
              total: filteredActivity.length,
              start:
                pagedActivity.length > 0
                  ? (activityPage - 1) * activityPageSize + 1
                  : 0,
              end: Math.min(
                activityPage * activityPageSize,
                filteredActivity.length,
              ),
            })
          }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-[#E2E8F0] px-2 py-1 disabled:opacity-50"
              :disabled="activityPage <= 1"
              @click="activityPage -= 1"
            >
              {{ t("dashboard.pagination.prev") }}
            </button>
            <span>{{ activityPage }} / {{ activityPageCount }}</span>
            <button
              type="button"
              class="rounded-lg border border-[#E2E8F0] px-2 py-1 disabled:opacity-50"
              :disabled="activityPage >= activityPageCount"
              @click="activityPage += 1"
            >
              {{ t("dashboard.pagination.next") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
